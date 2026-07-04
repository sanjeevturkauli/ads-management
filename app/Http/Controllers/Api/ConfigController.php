<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ConfigService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfigController extends Controller
{
    public function __construct(
        private readonly ConfigService $configService
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

            // Return public application details
            return response()->json([
                'success' => true,
                'message' => 'Application details retrieved successfully',
                'data' => [
                    'name' => $application->name,
                    'package_name' => $application->package_name,
                    'platform' => $application->platform,
                    'icon_url' => $application->icon_url,
                    'description' => $application->description,
                    'current_version' => $application->current_version,
                    'minimum_version' => $application->minimum_version,
                    'latest_version' => $application->latest_version,
                    'status' => $application->status,
                    'force_update' => $application->getSetting('force_update', false),
                    'maintenance_mode' => $application->getSetting('maintenance_mode', false),
                    'ads_enabled' => $application->getSetting('ads_enabled', true),
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
