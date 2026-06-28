<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ApiDocumentationController extends Controller
{
    public function index(): Response
    {
        $apiEndpoints = [
            [
                'group' => 'Configuration',
                'endpoints' => [
                    [
                        'method' => 'GET',
                        'path' => '/api/v1/config',
                        'description' => 'Get application configuration including ad units, settings, and app versions',
                        'auth' => true,
                        'parameters' => [
                            ['name' => 'app_version', 'type' => 'string', 'required' => false, 'description' => 'Current app version'],
                            ['name' => 'platform', 'type' => 'string', 'required' => false, 'description' => 'Platform (android/ios)'],
                        ],
                        'response' => [
                            'ad_units' => 'Array of ad unit configurations',
                            'app_settings' => 'Application-specific settings',
                            'global_settings' => 'System-wide settings',
                            'app_version' => 'Latest version information',
                        ],
                    ],
                ],
            ],
            [
                'group' => 'Authentication',
                'endpoints' => [
                    [
                        'method' => 'POST',
                        'path' => '/api/v1/auth/verify',
                        'description' => 'Verify API key and get application details',
                        'auth' => true,
                        'parameters' => [],
                        'response' => [
                            'application' => 'Application details',
                            'api_key' => 'API key information',
                        ],
                    ],
                ],
            ],
        ];

        return Inertia::render('Admin/ApiDocumentation/Index', [
            'apiEndpoints' => $apiEndpoints,
            'baseUrl' => url('/'),
        ]);
    }
}
