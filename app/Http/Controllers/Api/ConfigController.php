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
        $application = $request->get('application_model');

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
