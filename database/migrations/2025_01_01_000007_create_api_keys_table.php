<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_keys', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('application_id')->constrained('applications')->onDelete('cascade');
            $table->string('name');
            $table->text('encrypted_key');
            $table->string('key_hash')->unique();
            $table->enum('status', ['active', 'inactive', 'revoked'])->default('active');
            $table->timestamp('last_used_at')->nullable();
            $table->string('last_used_ip')->nullable();
            $table->unsignedBigInteger('total_requests')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->json('allowed_ips')->nullable();
            $table->json('allowed_domains')->nullable();
            $table->integer('rate_limit')->default(1000)->comment('Requests per hour');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['key_hash', 'status']);
            $table->index('application_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_keys');
    }
};
