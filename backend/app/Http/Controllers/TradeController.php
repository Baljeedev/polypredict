<?php

namespace App\Http\Controllers;

use App\Models\Market;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TradeController extends Controller
{
    public function buy(Request $request, Market $market)
    {
        $data = $request->validate([
            'outcome' => 'required|in:yes,no',
            'tokens' => 'required|integer|min:1',
        ]);

        if ($market->status !== 'open') {
            throw ValidationException::withMessages(['market' => ['Market is not open.']]);
        }

        $tokens = (int) $data['tokens'];
        $outcome = $data['outcome'];
        $user = $request->user();
        $wallet = $user->wallet;

        if (!$wallet || $wallet->available < $tokens) {
            throw ValidationException::withMessages(['tokens' => ['Not enough tokens.']]);
        }

        $b = max(1, (int) $market->b);
        $shares = $this->sharesForSpend(
            (int) $market->q_yes,
            (int) $market->q_no,
            $b,
            $outcome,
            $tokens
        );

        if ($shares <= 0) {
            throw ValidationException::withMessages(['tokens' => ['Trade too small.']]);
        }

        $hadPosition = $user->positions()->where('market_id', $market->id)->exists();

        DB::transaction(function () use ($wallet, $tokens, $user, $market, $outcome, $shares, $hadPosition, $b) {
            $wallet->available -= $tokens;
            $wallet->committed += $tokens;
            $wallet->save();

            $qYes = (int) $market->q_yes;
            $qNo = (int) $market->q_no;
            if ($outcome === 'yes') {
                $qYes += (int) round($shares);
            } else {
                $qNo += (int) round($shares);
            }

            [$yesPrice, $noPrice] = $this->prices($qYes, $qNo, $b);

            $market->q_yes = $qYes;
            $market->q_no = $qNo;
            $market->yes_price = $yesPrice;
            $market->no_price = $noPrice;
            $market->volume += $tokens;
            if (!$hadPosition) {
                $market->traders_count += 1;
            }
            $market->save();

            $pos = $user->positions()->firstOrNew([
                'market_id' => $market->id,
                'outcome' => $outcome,
            ]);
            $newShares = (float) $pos->shares + $shares;
            $spent = (int) $pos->tokens_spent + $tokens;
            $pos->shares = $newShares;
            $pos->tokens_spent = $spent;
            $pos->avg_price = (int) round($spent / $newShares);
            $pos->status = 'open';
            $pos->save();
        });

        return response()->json([
            'market' => $market->fresh(),
            'wallet' => $wallet->fresh(),
            'position' => $user->positions()->where('market_id', $market->id)->where('outcome', $outcome)->first(),
        ]);
    }

    private function prices(int $qYes, int $qNo, int $b): array
    {
        $pYes = 100 / (1 + exp(($qNo - $qYes) / $b));
        $pYes = (int) round(max(5, min(95, $pYes)));
        return [$pYes, 100 - $pYes];
    }

    private function sharesForSpend(int $qYes, int $qNo, int $b, string $outcome, int $tokens): float
    {
        $t = $tokens / 100;
        $ey = exp($qYes / $b);
        $en = exp($qNo / $b);
        $sum = $ey + $en;
        if ($outcome === 'yes') {
            $inner = $sum * exp($t / $b) - $en;
        } else {
            $inner = $sum * exp($t / $b) - $ey;
        }
        if ($inner <= 0) {
            throw ValidationException::withMessages(['tokens' => ['Trade too large for this pool.']]);
        }
        $q = $outcome === 'yes' ? $qYes : $qNo;
        return ($b * log($inner)) - $q;
    }

    public function sell(Request $request, Market $market)
    {
        $data = $request->validate([
            'outcome' => 'required|in:yes,no',
            'shares' => 'required|numeric|min:0.0001',
        ]);

        if ($market->status !== 'open') {
            throw ValidationException::withMessages(['market' => ['Market is not open.']]);
        }

        $user = $request->user();
        $shares = (float) $data['shares'];
        $outcome = $data['outcome'];

        $pos = $user->positions()
            ->where('market_id', $market->id)
            ->where('outcome', $outcome)
            ->where('status', 'open')
            ->first();

        if (!$pos || (float) $pos->shares < $shares) {
            throw ValidationException::withMessages(['shares' => ['Not enough shares.']]);
        }

        $b = max(1, (int) $market->b);
        $qYes = (int) $market->q_yes;
        $qNo = (int) $market->q_no;
        $sold = (int) max(1, round($shares));

        if ($outcome === 'yes') {
            if ($sold > $qYes) {
                throw ValidationException::withMessages(['shares' => ['Not enough pool shares.']]);
            }
            $tokensBack = $this->tokensForSell($qYes, $qNo, $b, 'yes', $sold);
            $qYes -= $sold;
        } else {
            if ($sold > $qNo) {
                throw ValidationException::withMessages(['shares' => ['Not enough pool shares.']]);
            }
            $tokensBack = $this->tokensForSell($qYes, $qNo, $b, 'no', $sold);
            $qNo -= $sold;
        }

        $tokensBack = max(1, $tokensBack);
        $wallet = $user->wallet;

        DB::transaction(function () use ($wallet, $tokensBack, $pos, $shares, $market, $qYes, $qNo, $b) {
            $wallet->available += $tokensBack;
            $wallet->committed = max(0, (int) $wallet->committed - $tokensBack);
            $wallet->save();

            [$yesPrice, $noPrice] = $this->prices($qYes, $qNo, $b);
            $market->q_yes = $qYes;
            $market->q_no = $qNo;
            $market->yes_price = $yesPrice;
            $market->no_price = $noPrice;
            $market->save();

            $left = (float) $pos->shares - $shares;
            if ($left <= 0.0001) {
                $pos->delete();
            } else {
                $pos->shares = $left;
                $pos->save();
            }
        });

        return response()->json([
            'market' => $market->fresh(),
            'wallet' => $wallet->fresh(),
            'sold_tokens' => $tokensBack,
        ]);
    }

    private function tokensForSell(int $qYes, int $qNo, int $b, string $outcome, int $sold): int
    {
        $cost = function ($y, $n) use ($b) {
            return $b * log(exp($y / $b) + exp($n / $b));
        };
        $before = $cost($qYes, $qNo);
        $after = $outcome === 'yes'
            ? $cost($qYes - $sold, $qNo)
            : $cost($qYes, $qNo - $sold);
        return (int) round(max(0, ($before - $after) * 100));
    }
}