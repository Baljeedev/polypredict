<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminMarketController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Market;

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
Route::get('/admin/markets', [AdminMarketController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/wallet', function (Request $request) {
        return $request->user()->wallet;
    });

    Route::post('/admin/markets', [AdminMarketController::class, 'store']);
});