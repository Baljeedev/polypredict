<?php

namespace App\Http\Controllers;

use App\Models\Market;
use App\Models\Position;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

use Illuminate\Http\Request;

class AdminMarketController extends Controller
{
    public function index(Request $request)
    {
        if (! $request->user()->is_admin) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return Market::orderByDesc('id')->get();
    }

    public function store(Request $request)
    {
        if (! $request->user()->is_admin) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'question' => 'required|string',
            'category' => 'required|string',
            'closes_at' => 'required|date',
            'resolve_at' => 'nullable|date',
            'resolution_rules' => 'required|string',
            'resolution_source' => 'required|string',
            'b' => 'nullable|integer|min:1',
            'status' => 'nullable|in:draft,open',
        ]);

        $data['b'] = $data['b'] ?? 150;
        $data['status'] = $data['status'] ?? 'draft';
        $data['yes_price'] = 50;
        $data['no_price'] = 50;

        $market = Market::create($data);
        $market->recordPriceTick();

        return response()->json($market, 201);
    }

    public function resolve(Request $request, Market $market)
    {
        if (! $request->user()->is_admin) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'outcome' => 'required|in:yes,no',
        ]);

        if (! in_array($market->status, ['open', 'closed'], true)) {
            throw ValidationException::withMessages(['market' => ['Market cannot be resolved.']]);
        }

        $winner = $data['outcome'];

        DB::transaction(function () use ($market, $winner) {
            $positions = Position::where('market_id', $market->id)
                ->where('status', 'open')
                ->with('user.wallet')
                ->get();

            foreach ($positions as $pos) {
                $wallet = $pos->user?->wallet;
                $spent = (int) $pos->tokens_spent;
                $payout = 0;

                if ($pos->outcome === $winner) {
                    $payout = (int) round((float) $pos->shares * 100);
                    $pos->status = 'won';
                } else {
                    $pos->status = 'lost';
                }

                if ($wallet) {
                    $wallet->available += $payout;
                    $wallet->committed = max(0, (int) $wallet->committed - $spent);
                    $wallet->save();
                }

                $pos->save();
            }

            $market->status = 'resolved';
            $market->winner = $winner;
            $market->save();
        });

        return $market->fresh();
    }

    public function update(Request $request, Market $market)
    {
        if (! $request->user()->is_admin) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (in_array($market->status, ['resolved', 'cancelled'], true)) {
            throw ValidationException::withMessages(['market' => ['Settled markets cannot be edited.']]);
        }

        $data = $request->validate([
            'question' => 'sometimes|required|string',
            'category' => 'sometimes|required|string',
            'closes_at' => 'sometimes|required|date',
            'resolve_at' => 'nullable|date',
            'resolution_rules' => 'sometimes|required|string',
            'resolution_source' => 'sometimes|required|string',
            'b' => 'nullable|integer|min:1',
            'status' => 'nullable|in:draft,open',
        ]);

        if ((int) $market->volume > 0) {
            unset($data['b']);
        }

        if ($market->status === 'closed') {
            unset($data['status']);
        }

        $market->fill($data);
        $market->save();

        return $market->fresh();
    }

    public function close(Request $request, Market $market)
    {
        if (! $request->user()->is_admin) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($market->status !== 'open') {
            throw ValidationException::withMessages(['market' => ['Only open markets can be closed.']]);
        }

        $market->status = 'closed';
        $market->save();

        return $market->fresh();
    }

    public function cancel(Request $request, Market $market)
    {
        if (! $request->user()->is_admin) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (! in_array($market->status, ['draft', 'open', 'closed'], true)) {
            throw ValidationException::withMessages(['market' => ['Market cannot be cancelled.']]);
        }

        DB::transaction(function () use ($market) {
            $positions = Position::where('market_id', $market->id)
                ->where('status', 'open')
                ->with('user.wallet')
                ->get();

            foreach ($positions as $pos) {
                $wallet = $pos->user?->wallet;
                $spent = (int) $pos->tokens_spent;

                if ($wallet) {
                    $wallet->available += $spent;
                    $wallet->committed = max(0, (int) $wallet->committed - $spent);
                    $wallet->save();
                }

                $pos->status = 'cancelled';
                $pos->save();
            }

            $market->status = 'cancelled';
            $market->winner = null;
            $market->save();
        });

        return $market->fresh();
    }

}