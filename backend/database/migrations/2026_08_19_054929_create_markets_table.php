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
        Schema::create('markets', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->string('category');
            $table->string('yes_label')->default('YES');
            $table->string('no_label')->default('NO');
            $table->timestamp('closes_at');
            $table->timestamp('resolve_at')->nullable();
            $table->text('resolution_rules');
            $table->string('resolution_source');
            $table->unsignedInteger('b')->default(150);
            $table->string('status')->default('draft');
            $table->integer('q_yes')->default(0);
            $table->integer('q_no')->default(0);
            $table->unsignedInteger('yes_price')->default(50);
            $table->unsignedInteger('no_price')->default(50);
            $table->unsignedInteger('traders_count')->default(0);
            $table->unsignedInteger('volume')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('markets');
    }
};
