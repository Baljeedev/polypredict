<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminMarketController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Market;
use App\Http\Controllers\TradeController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/markets', function () {
    return Market::where('status', 'open')->orderBy('closes_at')->get();
});
Route::get('/markets', function (Request $request) {
    $query = Market::where('status', 'open')->orderBy('closes_at');

    if ($request->filled('category') && $request->category !== 'Trending') {
        $query->where('category', $request->category);
    }

    return $query->get();
});

Route::get('/markets/{market}', function (Market $market) {
    return $market;
});



Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/portfolio', function (Request $request) {
        $user = $request->user();
        $positions = $user->positions()->with('market')->latest()->get()->map(function ($p) {
            $row = $p->toArray();
            $row['max_payout'] = round((float) $p->shares * 100, 2);
            return $row;
        });

        return [
            'wallet' => $user->wallet,
            'positions' => $positions,
        ];
    });

    Route::get('/wallet', function (Request $request) {
        return $request->user()->wallet;
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
    Route::post('/markets/{market}/buy', [TradeController::class, 'buy']);
    Route::post('/markets/{market}/sell', [TradeController::class, 'sell']);
});