<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Market;

class MarketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Market::create([
            'question' => 'Will India win the next T20 series?',
            'category' => 'Sports',
            'closes_at' => now()->addDays(2),
            'resolve_at' => now()->addDays(3),
            'resolution_rules' => 'Official series result from BCCI / ESPNcricinfo.',
            'resolution_source' => 'ESPNcricinfo',
            'b' => 500,
            'status' => 'open',
            'yes_price' => 62,
            'no_price' => 38,
            'traders_count' => 1204,
            'volume' => 48500,
        ]);
        Market::create([
            'question' => 'Will RBI hold rates this month?',
            'category' => 'Finance',
            'closes_at' => now()->addDays(5),
            'resolve_at' => now()->addDays(6),
            'resolution_rules' => 'RBI monetary policy statement.',
            'resolution_source' => 'rbi.org.in',
            'b' => 150,
            'status' => 'open',
            'yes_price' => 71,
            'no_price' => 29,
            'traders_count' => 340,
            'volume' => 12000,
        ]);
        Market::create([
            'question' => 'iPhone launch in September?',
            'category' => 'Technology',
            'closes_at' => now()->addDays(10),
            'resolve_at' => now()->addDays(12),
            'resolution_rules' => 'Official Apple event announcement.',
            'resolution_source' => 'apple.com',
            'b' => 150,
            'status' => 'open',
            'yes_price' => 54,
            'no_price' => 46,
            'traders_count' => 890,
            'volume' => 22100,
        ]);
    }
}
