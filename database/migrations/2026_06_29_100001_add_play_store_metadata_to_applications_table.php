<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            // Play Store public metadata
            $table->string('developer_name')->nullable()->after('description');
            $table->string('category')->nullable()->after('developer_name');
            $table->decimal('rating', 3, 1)->nullable()->after('category');
            $table->unsignedBigInteger('ratings_count')->nullable()->after('rating');
            $table->string('installs')->nullable()->after('ratings_count');   // e.g. "1,000,000+"
            $table->string('banner_url')->nullable()->after('icon_url');
            $table->json('screenshots')->nullable()->after('banner_url');
            $table->string('privacy_policy_url')->nullable()->after('screenshots');
            $table->string('website_url')->nullable()->after('privacy_policy_url');
            $table->string('play_store_url')->nullable()->after('website_url');
            $table->timestamp('store_last_updated_at')->nullable()->after('play_store_url');

            // Play Store release tracking
            $table->string('play_status')->nullable()->after('store_last_updated_at');  // PUBLISHED/DRAFT/etc.
            $table->string('play_version_code')->nullable()->after('play_status');

            // Sync metadata
            $table->string('sync_status')->default('pending')->after('play_version_code'); // pending/syncing/synced/failed
            $table->timestamp('last_synced_at')->nullable()->after('sync_status');
            $table->text('sync_error')->nullable()->after('last_synced_at');

            $table->index('sync_status');
            $table->index('play_status');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'developer_name', 'category', 'rating', 'ratings_count', 'installs',
                'banner_url', 'screenshots', 'privacy_policy_url', 'website_url',
                'play_store_url', 'store_last_updated_at', 'play_status',
                'play_version_code', 'sync_status', 'last_synced_at', 'sync_error',
            ]);
        });
    }
};
