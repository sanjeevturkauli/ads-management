<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('application_id')->constrained('applications')->onDelete('cascade');
            $table->foreignUuid('ad_network_id')->constrained('ad_networks')->onDelete('cascade');
            $table->enum('ad_type', [
                'banner',
                'interstitial',
                'rewarded',
                'rewarded_interstitial',
                'native',
                'app_open'
            ]);
            $table->text('encrypted_ad_unit_id');
            $table->boolean('is_enabled')->default(true);
            $table->integer('frequency')->default(1)->comment('Show after X actions');
            $table->integer('refresh_interval')->default(60)->comment('Seconds');
            $table->integer('priority')->default(1)->comment('Waterfall priority');
            $table->integer('daily_cap')->nullable()->comment('Max impressions per day');
            $table->integer('hourly_cap')->nullable()->comment('Max impressions per hour');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['application_id', 'ad_type', 'is_enabled']);
            $table->index(['ad_type', 'is_enabled']);
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_units');
    }
};
