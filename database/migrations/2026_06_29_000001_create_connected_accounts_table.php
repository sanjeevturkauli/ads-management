<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connected_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider');           // google_play_console | google_ads
            $table->string('name');               // Human-readable label
            $table->text('encrypted_credentials')->nullable(); // Encrypted JSON credentials
            $table->string('account_id')->nullable();          // Provider-side account ID
            $table->string('status')->default('connected');   // connected | disconnected | error
            $table->timestamp('last_synced_at')->nullable();
            $table->json('metadata')->nullable();              // Extra provider-specific data
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connected_accounts');
    }
};
