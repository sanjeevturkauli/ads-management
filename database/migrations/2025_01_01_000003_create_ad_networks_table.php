<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_networks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('provider')->default('admob'); // admob, facebook, unity, etc.
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(1);
            $table->json('configuration')->nullable();
            $table->timestamps();
            
            $table->index(['slug', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_networks');
    }
};
