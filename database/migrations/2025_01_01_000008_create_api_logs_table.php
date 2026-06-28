<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('api_key_id')->nullable()->constrained('api_keys')->nullOnDelete();
            $table->foreignUuid('application_id')->nullable()->constrained('applications')->nullOnDelete();
            $table->string('endpoint');
            $table->string('method', 10);
            $table->ipAddress('ip_address');
            $table->string('user_agent')->nullable();
            $table->integer('response_code');
            $table->float('response_time')->comment('milliseconds');
            $table->json('request_headers')->nullable();
            $table->json('request_body')->nullable();
            $table->json('response_body')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            $table->index(['application_id', 'created_at']);
            $table->index(['api_key_id', 'created_at']);
            $table->index('created_at');
            $table->index('response_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_logs');
    }
};
