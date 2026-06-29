<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SyncApplicationMetadataJob;
use App\Models\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ApplicationSyncController
 *
 * Handles dispatching metadata sync jobs for applications.
 * All actual fetching happens in the queue — not during HTTP requests.
 */
class ApplicationSyncController extends Controller
{
    /**
     * Dispatch a sync job for a single application.
     * Accepts optional ?force=1 to bypass 24-hour cache.
     */
    public function syncOne(Request $request, Application $application): JsonResponse
    {
        $force = $request->boolean('force', false);

        // Mark as pending immediately so UI reflects it
        $application->update([
            'sync_status' => 'pending',
            'sync_error'  => null,
        ]);

        SyncApplicationMetadataJob::dispatch($application, $force)
            ->onQueue('default');

        return response()->json([
            'message'    => 'Sync queued for '.$application->name,
            'package'    => $application->package_name,
            'sync_status' => 'pending',
        ]);
    }

    /**
     * Dispatch sync jobs for ALL android applications.
     */
    public function syncAll(Request $request): JsonResponse
    {
        $force = $request->boolean('force', false);

        $apps = Application::where('platform', 'android')
            ->whereNull('deleted_at')
            ->get();

        $count = 0;
        foreach ($apps as $app) {
            $app->update(['sync_status' => 'pending', 'sync_error' => null]);

            // Stagger jobs 2 seconds apart to avoid rate limiting
            SyncApplicationMetadataJob::dispatch($app, $force)
                ->onQueue('default')
                ->delay(now()->addSeconds($count * 2));

            $count++;
        }

        return response()->json([
            'message' => "Sync queued for {$count} application(s)",
            'count'   => $count,
        ]);
    }

    /**
     * Get the current sync status for a single application.
     */
    public function status(Application $application): JsonResponse
    {
        return response()->json([
            'id'             => $application->id,
            'sync_status'    => $application->sync_status,
            'last_synced_at' => $application->last_synced_at?->toISOString(),
            'sync_error'     => $application->sync_error,
            'icon_url'       => $application->icon_url,
            'rating'         => $application->rating,
            'installs'       => $application->installs,
            'category'       => $application->category,
            'developer_name' => $application->developer_name,
            'play_status'    => $application->play_status,
        ]);
    }
}
