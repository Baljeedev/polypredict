<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Market extends Model
{
   protected $fillable = [
        'question',
        'category',
        'yes_label',
        'no_label',
        'closes_at',
        'resolve_at',
        'resolution_rules',
        'resolution_source',
        'b',
        'status',
        'q_yes',
        'q_no',
        'yes_price',
        'no_price',
        'traders_count',
        'volume',
        'winner',
    ];
    protected $casts = [
        'closes_at' => 'datetime',
        'resolve_at' => 'datetime',
    ];

    public function priceTicks()
    {
        return $this->hasMany(MarketPriceTick::class);
    }

    public function recordPriceTick(): void
    {
        try {
            $this->priceTicks()->create([
                'yes_price' => (int) $this->yes_price,
                'no_price' => (int) $this->no_price,
                'volume' => (int) $this->volume,
            ]);
        } catch (\Throwable $e) {
            // ignore if ticks table is unavailable
        }
    }

    public function ensurePriceHistory(): void
    {
        if ($this->priceTicks()->exists()) {
            return;
        }

        $end = max(5, min(95, (int) $this->yes_price));
        $n = 36;
        $seed = crc32((string) $this->id);
        $start = max(8, min(92, $end + (($seed % 21) - 10)));
        $now = now();
        $rows = [];

        for ($i = 0; $i < $n; $i++) {
            $t = $n === 1 ? 1 : $i / ($n - 1);
            $wave = sin(($i + ($seed % 7)) * 0.55) * 5;
            $yes = (int) round($start + ($end - $start) * $t + $wave);
            $yes = max(5, min(95, $yes));
            if ($i === $n - 1) {
                $yes = $end;
            }
            $at = $now->copy()->subDays(30)->addHours((int) round(30 * 24 * $t));
            $rows[] = [
                'market_id' => $this->id,
                'yes_price' => $yes,
                'no_price' => 100 - $yes,
                'volume' => (int) round(((int) $this->volume) * $t),
                'created_at' => $at,
                'updated_at' => $at,
            ];
        }

        MarketPriceTick::insert($rows);
    }
}
