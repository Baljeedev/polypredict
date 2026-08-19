<?php

namespace App\Http\Controllers;

use App\Models\Market;
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

        return response()->json($market, 201);
    }
}