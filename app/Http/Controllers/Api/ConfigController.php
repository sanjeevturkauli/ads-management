<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ApplicationService;
use App\Services\ConfigService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfigController extends Controller
{
    public function __construct(
        private readonly ConfigService $configService,
        private readonly ApplicationService $applicationService
    ) {
    }

    /**
     * Get public application details by package name (no authentication required).
     *
     * @group Public API
     */
    public function getPublicAppDetails(string $packageName): JsonResponse
    {
        try {
            $application = $this->applicationService->findByPackageName($packageName);

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found',
                    'error' => 'APP_NOT_FOUND',
                    'data' => null,
                ], 404);
            }

            // Check if application is active
            if ($application->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Application is not active',
                    'error' => 'APP_NOT_ACTIVE',
                    'data' => [
                        'status' => $application->status,
                    ],
                ], 403);
            }

            // Get application settings
            $adsEnabled = $application->getSetting('ads_enabled', true);
            $forceUpdate = $application->getSetting('force_update', false);
            $maintenanceMode = $application->getSetting('maintenance_mode', false);
            $globalAdsMode = \App\Models\GlobalSetting::get('global_ads_mode', false);
            
            // Check if test mode is enabled (global OR application-specific)
            $isTestModeEnabled = $globalAdsMode || $application->test_mode;

            // Check for active announcements within date range
            $activeAnnouncement = $application->announcements()
                ->active()
                ->current()
                ->latest()
                ->first();

            // Load ad units with network information
            $adUnits = $application->adUnits()
                ->with('adNetwork')
                ->enabled()
                ->orderByPriority()
                ->get()
                ->groupBy('ad_type');

            // Get test ad unit IDs from global settings
            $testAdIds = [
                'banner' => \App\Models\GlobalSetting::get('test_banner_id'),
                'interstitial' => \App\Models\GlobalSetting::get('test_interstitial_id'),
                'rewarded' => \App\Models\GlobalSetting::get('test_rewarded_id'),
                'native' => \App\Models\GlobalSetting::get('test_native_id'),
                'app_open' => \App\Models\GlobalSetting::get('test_app_open_id'),
            ];

            // Build ads configuration
            $adsConfig = [];
            foreach ($adUnits as $type => $units) {
                $primaryUnit = $units->first();
                if ($primaryUnit) {
                    // Use test ID if test mode is enabled (global OR app-specific), otherwise use real ad unit ID
                    $adUnitId = $isTestModeEnabled && isset($testAdIds[$type]) 
                        ? $testAdIds[$type] 
                        : $primaryUnit->getDecrypted('encrypted_ad_unit_id');
                    
                    $adsConfig[$type] = [
                        'enabled' => $primaryUnit->is_enabled,
                        'ad_unit_id' => $adUnitId,
                        'frequency' => $primaryUnit->frequency,
                        'refresh_interval' => $primaryUnit->refresh_interval,
                        'network' => $primaryUnit->adNetwork->provider ?? 'admob',
                    ];
                }
            }

            // Prepare test_ids object (only included when test mode is enabled)
            $testIdsObject = $isTestModeEnabled ? [
                'banner' => $testAdIds['banner'],
                'interstitial' => $testAdIds['interstitial'],
                'rewarded' => $testAdIds['rewarded'],
                'native' => $testAdIds['native'],
                'app_open' => $testAdIds['app_open'],
            ] : null;

            // Return public application details with ads data
            return response()->json([
                'success' => true,
                'message' => 'Application details retrieved successfully',
                'data' => [
                    'app' => [
                        'name' => $application->name,
                        'package_name' => $application->package_name,
                        'platform' => $application->platform,
                        'icon_url' => $application->icon_url,
                        'description' => $application->description,
                        'current_version' => $application->current_version,
                        'minimum_version' => $application->minimum_version,
                        'latest_version' => $application->latest_version,
                        'status' => $application->status,
                        'force_update' => $forceUpdate,
                        'maintenance_mode' => $maintenanceMode,
                    ],
                    'ads' => [
                        'enabled' => $adsEnabled,
                        'global_ads_mode' => (bool) $globalAdsMode,
                        'app_test_mode' => (bool) $application->test_mode,
                        'test_ids' => $testIdsObject,
                        'ad_units' => $adsConfig,
                        // Backward compatibility - individual ad type flags
                        'banner_enabled' => isset($adsConfig['banner']),
                        'interstitial_enabled' => isset($adsConfig['interstitial']),
                        'rewarded_enabled' => isset($adsConfig['rewarded']),
                        'native_enabled' => isset($adsConfig['native']),
                        'app_open_enabled' => isset($adsConfig['app_open']),
                        // Backward compatibility - individual ad unit IDs
                        'banner_id' => $adsConfig['banner']['ad_unit_id'] ?? null,
                        'interstitial_id' => $adsConfig['interstitial']['ad_unit_id'] ?? null,
                        'rewarded_id' => $adsConfig['rewarded']['ad_unit_id'] ?? null,
                        'native_id' => $adsConfig['native']['ad_unit_id'] ?? null,
                        'app_open_id' => $adsConfig['app_open']['ad_unit_id'] ?? null,
                        // Interstitial frequency
                        'interstitial_interval' => $adsConfig['interstitial']['frequency'] ?? 3,
                    ],
                    'announcement' => [
                        'is_announcement' => (bool) $activeAnnouncement,
                        'message' => $activeAnnouncement?->message,
                        'start_date' => $activeAnnouncement?->start_date?->format('Y-m-d'),
                        'end_date' => $activeAnnouncement?->end_date?->format('Y-m-d'),
                    ],
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => 'INTERNAL_ERROR',
                'data' => null,
            ], 500);
        }
    }

    /**
     * Get application configuration.
     *
     * @group API
     */
    public function getConfig(Request $request, string $packageName): JsonResponse
    {
        $config = $this->configService->getApplicationConfig($packageName);

        return response()->json(
            $config->toArray(),
            $config->success ? 200 : 404
        );
    }

    /**
     * Get application configuration (alternative endpoint).
     *
     * @group API
     */
    public function show(Request $request): JsonResponse
    {
        $application = $request->input('application_model');

        if (! $application) {
            return response()->json([
                'success' => false,
                'message' => 'Application not found',
            ], 404);
        }

        $config = $this->configService->getApplicationConfig($application->package_name);

        return response()->json($config->toArray());
    }

    /**
     * Health check endpoint.
     *
     * @group API
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
