<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminMarketController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Market;
use App\Http\Controllers\TradeController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/auth/google', [AuthController::class, 'googleRedirect']);
Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);


Route::get('/markets', function (Request $request) {
    $query = Market::where('status', 'open')->orderBy('closes_at');

    if ($request->filled('category') && $request->category !== 'Trending') {
        $query->where('category', $request->category);
    }

    return $query->get();
});

Route::get('/markets/{market}', function (Market $market) {
    $data = $market->toArray();
    $data['history'] = [];
    try {
        $market->ensurePriceHistory();
        $data['history'] = $market->priceTicks()
            ->orderBy('created_at')
            ->get(['yes_price', 'no_price', 'volume', 'created_at']);
    } catch (\Throwable $e) {
        // ticks table may not be migrated yet
    }
    return $data;
});

Route::post('/markets/{market}/preview', [TradeController::class, 'preview']);



Route::get('/leaderboard', function () {
    return \App\Models\User::with('wallet')
        ->get()
        ->map(function ($u) {
            $w = $u->wallet;
            $tokens = (int) (($w->available ?? 0) + ($w->committed ?? 0) + ($w->ad_tokens ?? 0));
            return [
                'username' => $u->username ?: $u->name,
                'tokens' => $tokens,
                'available' => (int) ($w->available ?? 0),
                'committed' => (int) ($w->committed ?? 0),
            ];
        })
        ->sortByDesc('tokens')
        ->values()
        ->take(20)
        ->map(function ($row, $i) {
            $row['rank'] = $i + 1;
            return $row;
        })
        ->values();
});

Route::get('/leaderboard/experts', function () {
    return \App\Models\User::with('positions')->get()
        ->map(function ($u) {
            $settled = $u->positions->whereIn('status', ['won', 'lost']);
            $won = $settled->where('status', 'won')->count();
            $lost = $settled->where('status', 'lost')->count();
            $total = $won + $lost;
            if ($total < 1) {
                return null;
            }
            return [
                'username' => $u->username ?: $u->name,
                'tokens' => (int) round($won / $total * 100),
                'available' => $won,
                'committed' => $lost,
            ];
        })
        ->filter()
        ->sortByDesc('tokens')
        ->values()
        ->take(20)
        ->map(function ($row, $i) {
            $row['rank'] = $i + 1;
            return $row;
        })
        ->values();
});

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/portfolio', function (Request $request) {
        $user = $request->user();
        $positions = $user->positions()->where('status', 'open')->with('market')->latest()->get()->map(function ($p) {
            $row = $p->toArray();
            $row['max_payout'] = round((float) $p->shares * 100, 2);
            return $row;
        });

        return [
            'wallet' => $user->wallet,
            'positions' => $positions,
        ];
    });

    Route::get('/profile', function (Request $request) {
        $user = $request->user();
        $history = $user->positions()->with('market')->latest()->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'market_id' => $p->market_id,
                'question' => $p->market?->question,
                'outcome' => $p->outcome,
                'shares' => round((float) $p->shares, 4),
                'tokens_spent' => (int) $p->tokens_spent,
                'avg_price' => (int) $p->avg_price,
                'status' => $p->status,
                'max_payout' => (int) round((float) $p->shares * 100),
            ];
        });

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
            ],
            'wallet' => $user->wallet,
            'history' => $history,
        ];
    });

    Route::get('/wallet', function (Request $request) {
        return $request->user()->wallet;
    });

    Route::post('/wallet/claim', function (Request $request) {
        $wallet = $request->user()->wallet;
        if (! $wallet) {
            return response()->json(['message' => 'No wallet'], 404);
        }

        $today = now()->toDateString();
        $last = $wallet->last_claim_at?->toDateString();
        if ($last === $today) {
            return response()->json(['message' => 'Already claimed today.'], 422);
        }

        $amount = 50;
        $wallet->available += $amount;
        $wallet->ad_tokens += $amount;
        $wallet->last_claim_at = now();
        $wallet->save();

        return $wallet;
    });

    Route::get('/admin/users', function (Request $request) {
        if (! $request->user()->is_admin) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return \App\Models\User::with('wallet')
            ->orderByDesc('id')
            ->get(['id', 'name', 'username', 'email', 'is_admin', 'created_at']);
    });

    Route::get('/admin/markets', [AdminMarketController::class, 'index']);
    Route::post('/admin/markets', [AdminMarketController::class, 'store']);
    Route::post('/admin/markets/{market}/resolve', [AdminMarketController::class, 'resolve']);
    Route::post('/markets/{market}/buy', [TradeController::class, 'buy']);

    Route::post('/markets/{market}/sell', [TradeController::class, 'sell']);
});