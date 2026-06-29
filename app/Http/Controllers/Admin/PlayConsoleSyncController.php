<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ConnectedAccount;
use App\Services\GooglePlayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlayConsoleSyncController extends Controller
{
    public function __construct(
        private readonly GooglePlayService $playService
    ) {}

    /**
     * Show the sync preview page — lists apps fetched from Play Console.
     */
    public function preview(ConnectedAccount $account): Response|RedirectResponse
    {
        if ($account->provider !== 'google_play_console') {
            return redirect()->route('admin.accounts.index')
                ->with('error', 'This account is not a Google Play Console account.');
        }

        if (! $account->isConnected()) {
            return redirect()->route('admin.accounts.index')
                ->with('error', 'Account is not connected.');
        }

        try {
            $remoteApps   = $this->playService->fetchApps($account);
            $existingPkgs = Application::withTrashed()
                ->pluck('platform', 'package_name')
                ->toArray();

            $apps = collect($remoteApps)->map(function ($app) use ($existingPkgs) {
                $pkg    = $app['packageName'] ?? $app['name'] ?? null;
                $exists = isset($existingPkgs[$pkg]);

                return [
                    'package_name'  => $pkg,
                    'name'          => $app['title'] ?? $app['appName'] ?? $this->nameFromPackage($pkg ?? ''),
                    'icon_url'      => $app['iconUrl'] ?? $app['icon'] ?? null,
                    'status'        => $app['status'] ?? 'ACTIVE',
                    'last_updated'  => $app['lastUpdatedTimestamp'] ?? null,
                    'already_added' => $exists,
                ];
            })->filter(fn($a) => ! empty($a['package_name']))->values()->toArray();

            return Inertia::render('Admin/Accounts/PlayConsoleSync', [
                'account'  => [
                    'id'         => $account->id,
                    'name'       => $account->name,
                    'account_id' => $account->account_id,
                ],
                'apps'     => $apps,
                'fetchError' => null,
            ]);

        } catch (\RuntimeException $e) {
            // Still render the page — show error inline with instructions
            return Inertia::render('Admin/Accounts/PlayConsoleSync', [
                'account'    => [
                    'id'         => $account->id,
                    'name'       => $account->name,
                    'account_id' => $account->account_id,
                ],
                'apps'       => [],
                'fetchError' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Import selected apps from Play Console into Applications.
     */
    public function import(Request $request, ConnectedAccount $account): RedirectResponse
    {
        $validated = $request->validate([
            'packages'   => ['required', 'array', 'min:1'],
            'packages.*' => ['required', 'string'],
        ]);

        $imported = 0;
        $skipped  = 0;
        $errors   = [];

        DB::transaction(function () use ($account, $validated, &$imported, &$skipped, &$errors) {
            foreach ($validated['packages'] as $packageName) {
                // Skip if already exists
                if (Application::where('package_name', $packageName)->withTrashed()->exists()) {
                    $skipped++;
                    continue;
                }

                try {
                    // Try to fetch detailed info for this package
                    $details = $this->tryFetchDetails($account, $packageName);

                    Application::create([
                        'name'            => $details['name'] ?? $this->nameFromPackage($packageName),
                        'package_name'    => $packageName,
                        'platform'        => 'android',
                        'icon_url'        => $details['icon_url'] ?? null,
                        'description'     => $details['description'] ?? null,
                        'current_version' => $details['version'] ?? '1.0.0',
                        'minimum_version' => '1.0.0',
                        'latest_version'  => $details['version'] ?? '1.0.0',
                        'status'          => 'active',
                        'created_by'      => auth()->id(),
                        'updated_by'      => auth()->id(),
                    ]);

                    $imported++;

                } catch (\Exception $e) {
                    $errors[] = "{$packageName}: {$e->getMessage()}";
                }
            }
        });

        // Update last synced
        $account->update(['last_synced_at' => now()]);

        $message = "{$imported} app(s) imported successfully.";
        if ($skipped > 0) {
            $message .= " {$skipped} skipped (already exist).";
        }
        if (! empty($errors)) {
            $message .= ' Some errors occurred.';
        }

        return redirect()->route('admin.applications.index')
            ->with('success', $message);
    }

    /**
     * AJAX endpoint: test connection & return app count.
     */
    public function testConnection(ConnectedAccount $account): JsonResponse
    {
        try {
            $token = $this->playService->getAccessToken($account);
            return response()->json([
                'success' => true,
                'message' => 'Connection successful. Access token obtained.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Attempt to get app details; returns partial data on failure.
     */
    private function tryFetchDetails(ConnectedAccount $account, string $packageName): array
    {
        try {
            $data = $this->playService->fetchAppDetails($account, $packageName);
            return [
                'name'        => $data['title'] ?? null,
                'icon_url'    => $data['iconUrl'] ?? null,
                'description' => $data['description'] ?? null,
                'version'     => $data['latestPublishedVersionCode'] ?? null,
            ];
        } catch (\Exception) {
            return [];
        }
    }

    private function nameFromPackage(string $packageName): string
    {
        $parts = explode('.', $packageName);
        return ucwords(str_replace(['-', '_'], ' ', end($parts)));
    }
}
