<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        \Illuminate\Support\Facades\DB::statement(
            'ALTER TABLE markets MODIFY q_yes DECIMAL(16,6) NOT NULL DEFAULT 0'
        );
        \Illuminate\Support\Facades\DB::statement(
            'ALTER TABLE markets MODIFY q_no DECIMAL(16,6) NOT NULL DEFAULT 0'
        );
    }

    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement(
            'ALTER TABLE markets MODIFY q_yes INT NOT NULL DEFAULT 0'
        );
        \Illuminate\Support\Facades\DB::statement(
            'ALTER TABLE markets MODIFY q_no INT NOT NULL DEFAULT 0'
        );
    }
};
