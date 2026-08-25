<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketPriceTick extends Model
{
    protected $fillable = [
        'market_id',
        'yes_price',
        'no_price',
        'volume',
    ];
}
