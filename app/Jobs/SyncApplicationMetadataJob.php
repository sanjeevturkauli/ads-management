<?php

namespace App\Jobs;

use App\Models\Application;
use App\Services\PlayStoreMetadataService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * SyncApplicationMetadataJob
 *
 * Fetches Play Store metadata for a single application in the background.
 * Dispatched from the sync controller — never runs during HTTP requests.
 */
class SyncApplicationMetadataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Maximum number of attempts before marking as failed.
     */
    public int $tries = 3;

    /**
     * Seconds to wait before retrying after a failure.
     */
    public int $backoff = 30;

    /**
     * Seconds before the job times out.
     */
    public int $timeout = 60;

    public function __construct(
        public readonly Application $application,
        public readonly bool $forceRefresh = false,
    ) {}

    public function handle(PlayStoreMetadataService $metadataService): void
    {
        Log::info('[SyncJob] Processing', [
            'app_id'  => $this->application->id,
            'package' => $this->application->package_name,
            'attempt' => $this->attempts(),
        ]);

        // Reload to get latest state (app may have been updated since dispatch)
        $application = Application::find($this->application->id);

        if (! $application) {
            Log::warning('[SyncJob] Application not found, skipping', [
                'app_id' => $this->application->id,
            ]);
            return;
        }

        // Skip if already synced recently and not a forced refresh
        if (! $this->forceRefresh
            && $application->sync_status === 'synced'
            && $application->last_synced_at
            && $application->last_synced_at->gt(now()->subHours(24))
        ) {
            Log::info('[SyncJob] Skipping — recently synced', [
                'package'       => $application->package_name,
                'last_synced'   => $application->last_synced_at,
            ]);
            return;
        }

        $metadataService->syncApplication($application);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('[SyncJob] Job failed permanently', [
            'app_id'  => $this->application->id,
            'package' => $this->application->package_name,
            'error'   => $exception->getMessage(),
        ]);

        // Mark as failed in DB
        Application::where('id', $this->application->id)->update([
            'sync_status' => 'failed',
            'sync_error'  => 'Job failed: '.$exception->getMessage(),
        ]);
    }
}
