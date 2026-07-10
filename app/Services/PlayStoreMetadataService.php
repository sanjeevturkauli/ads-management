<?php

namespace App\Services;

use App\DataTransferObjects\PlayStoreMetadata;
use App\Models\Application;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * PlayStoreMetadataService
 *
 * Coordinates fetching, caching, and persisting Play Store metadata
 * for a single application.
 */
class PlayStoreMetadataService
{
    private const CACHE_TTL_HOURS = 24;

    public function __construct(
        private readonly MetadataParser $parser
    ) {}

    /**
     * Fetch metadata for a package (with caching) and persist to the application.
     * Returns the metadata DTO or null on failure.
     */
    public function syncApplication(Application $application): ?PlayStoreMetadata
    {
        $pkg = $application->package_name;

        Log::info('[PlayStore] Starting sync', ['package' => $pkg, 'app_id' => $application->id]);

        // Mark as syncing
        $application->update([
            'sync_status' => 'syncing',
            'sync_error'  => null,
        ]);

        try {
            $metadata = $this->fetchWithCache($pkg);

            if (! $metadata || $metadata->isEmpty()) {
                Log::warning('[PlayStore] No metadata returned', ['package' => $pkg]);

                $application->update([
                    'sync_status' => 'failed',
                    'sync_error'  => 'No metadata returned from Play Store.',
                    'last_synced_at' => now(),
                ]);

                return null;
            }

            $this->persist($application, $metadata);

            Log::info('[PlayStore] Sync completed', [
                'package' => $pkg,
                'title'   => $metadata->title,
                'icon'    => $metadata->iconUrl ? 'yes' : 'no',
                'rating'  => $metadata->rating,
            ]);

            return $metadata;

        } catch (\Throwable $e) {
            Log::error('[PlayStore] Sync failed', [
                'package' => $pkg,
                'error'   => $e->getMessage(),
            ]);

            $application->update([
                'sync_status' => 'failed',
                'sync_error'  => $e->getMessage(),
                'last_synced_at' => now(),
            ]);

            return null;
        }
    }

    /**
     * Fetch metadata with 24-hour cache.
     * Pass $forceRefresh = true to bypass cache.
     * 
     * Note: We store as array and reconstruct DTO to avoid serialization issues
     * with readonly classes.
     */
    public function fetchWithCache(string $packageName, bool $forceRefresh = false): ?PlayStoreMetadata
    {
        $cacheKey = "play_store_meta_{$packageName}";

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        // Get cached data as array
        $cachedData = Cache::get($cacheKey);

        if ($cachedData && is_array($cachedData) && !$forceRefresh) {
            // Reconstruct DTO from cached array
            return new PlayStoreMetadata(
                packageName: $cachedData['packageName'] ?? $packageName,
                title: $cachedData['title'] ?? null,
                iconUrl: $cachedData['iconUrl'] ?? null,
                bannerUrl: $cachedData['bannerUrl'] ?? null,
                description: $cachedData['description'] ?? null,
                developerName: $cachedData['developerName'] ?? null,
                category: $cachedData['category'] ?? null,
                rating: $cachedData['rating'] ?? null,
                ratingsCount: $cachedData['ratingsCount'] ?? null,
                installs: $cachedData['installs'] ?? null,
                privacyPolicyUrl: $cachedData['privacyPolicyUrl'] ?? null,
                websiteUrl: $cachedData['websiteUrl'] ?? null,
                playStoreUrl: $cachedData['playStoreUrl'] ?? null,
                screenshots: $cachedData['screenshots'] ?? [],
                storeLastUpdated: $cachedData['storeLastUpdated'] ?? null,
            );
        }

        // Fetch fresh data
        $metadata = $this->parser->fetch($packageName);

        if ($metadata) {
            // Store as array to avoid serialization issues
            Cache::put(
                $cacheKey,
                [
                    'packageName' => $metadata->packageName,
                    'title' => $metadata->title,
                    'iconUrl' => $metadata->iconUrl,
                    'bannerUrl' => $metadata->bannerUrl,
                    'description' => $metadata->description,
                    'developerName' => $metadata->developerName,
                    'category' => $metadata->category,
                    'rating' => $metadata->rating,
                    'ratingsCount' => $metadata->ratingsCount,
                    'installs' => $metadata->installs,
                    'privacyPolicyUrl' => $metadata->privacyPolicyUrl,
                    'websiteUrl' => $metadata->websiteUrl,
                    'playStoreUrl' => $metadata->playStoreUrl,
                    'screenshots' => $metadata->screenshots,
                    'storeLastUpdated' => $metadata->storeLastUpdated,
                ],
                now()->addHours(self::CACHE_TTL_HOURS)
            );
        }

        return $metadata;
    }

    /**
     * Persist metadata to the application record.
     * Only updates fields that have changed.
     */
    private function persist(Application $application, PlayStoreMetadata $metadata): void
    {
        $updates = $metadata->toArray();

        // Add sync tracking fields
        $updates['sync_status']   = 'synced';
        $updates['last_synced_at'] = now();
        $updates['sync_error']    = null;

        // Only update fields that actually changed
        $changed = array_filter($updates, function ($value, $key) use ($application) {
            $current = $application->getAttribute($key);

            if (is_array($value)) {
                return json_encode($value) !== json_encode($current);
            }

            return (string) $value !== (string) $current;
        }, ARRAY_FILTER_USE_BOTH);

        if (! empty($changed)) {
            // Use updateQuietly to avoid triggering audit log for every field
            $application->updateQuietly($changed);

            Log::info('[PlayStore] Updated fields', [
                'package' => $application->package_name,
                'fields'  => array_keys($changed),
            ]);
        } else {
            // Still mark as synced
            $application->updateQuietly([
                'sync_status'   => 'synced',
                'last_synced_at' => now(),
            ]);
        }
    }
}
