<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('package_name')->unique();
            $table->enum('platform', ['android', 'ios', 'both'])->default('android');
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->string('current_version')->default('1.0.0');
            $table->string('minimum_version')->default('1.0.0');
            $table->string('latest_version')->default('1.0.0');
            $table->enum('status', ['active', 'inactive', 'maintenance', 'archived'])->default('active');
            $table->text('encrypted_api_key')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['package_name', 'status']);
            $table->index('status');
            $table->index('platform');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
