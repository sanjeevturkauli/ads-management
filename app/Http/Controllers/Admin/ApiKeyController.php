<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\Application;
use App\Services\ApiKeyService;
use Illuminate\Http\Request;

class ApiKeyController extends Controller
{
    public function __construct(
        private readonly ApiKeyService $apiKeyService
    ) {
    }

    public function index(Application $application)
    {
        $application->load('apiKeys.creator');

        return inertia('Admin/ApiKeys/Index', [
            'application' => $application,
            'apiKeys' => $application->apiKeys->map(function ($apiKey) {
                return [
                    'id' => $apiKey->id,
                    'name' => $apiKey->name,
                    'key_preview' => $apiKey->getMaskedKey(),
                    'last_used_at' => $apiKey->last_used_at,
                    'expires_at' => $apiKey->expires_at,
                    'is_active' => $apiKey->is_active,
                    'created_at' => $apiKey->created_at,
                    'creator' => $apiKey->creator ? [
                        'name' => $apiKey->creator->name,
                        'email' => $apiKey->creator->email,
                    ] : null,
                ];
            }),
        ]);
    }

    public function store(Request $request, Application $application)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'expires_days' => ['nullable', 'integer', 'min:1'],
        ]);

        $result = $this->apiKeyService->generate(
            $application, 
            $validated['name'],
            $validated['expires_days'] ?? null
        );

        // Return JSON response with the plain key
        return response()->json([
            'success' => true,
            'message' => 'API key generated successfully.',
            'plain_key' => $result['plain_key'],
            'api_key' => [
                'id' => $result['api_key']->id,
                'name' => $result['api_key']->name,
                'key_preview' => $result['api_key']->getMaskedKey(),
                'created_at' => $result['api_key']->created_at,
            ],
        ]);
    }

    public function destroy(Application $application, ApiKey $apiKey)
    {
        $this->apiKeyService->delete($apiKey);

        return back()->with('success', 'API key deleted successfully.');
    }

    public function revoke(Application $application, ApiKey $apiKey)
    {
        $this->apiKeyService->revoke($apiKey);

        return back()->with('success', 'API key revoked successfully.');
    }
}
