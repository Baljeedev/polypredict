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
}
