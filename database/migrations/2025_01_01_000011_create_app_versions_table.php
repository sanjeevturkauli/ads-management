<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('application_id')->constrained('applications')->onDelete('cascade');
            $table->string('version');
            $table->integer('version_code');
            $table->enum('platform', ['android', 'ios']);
            $table->boolean('is_forced')->default(false);
            $table->boolean('is_latest')->default(false);
            $table->text('release_notes')->nullable();
            $table->string('download_url')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['application_id', 'version', 'platform']);
            $table->index(['application_id', 'is_latest']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_versions');
    }
};
