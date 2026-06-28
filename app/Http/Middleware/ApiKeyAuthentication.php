<?php

namespace App\Http\Middleware;

use App\Services\ApiKeyService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyAuthentication
{
    public function __construct(
        private readonly ApiKeyService $apiKeyService
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-API-Key') ?? $request->get('api_key');

        if (! $apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'API key is required',
            ], 401);
        }

        $validApiKey = $this->apiKeyService->validateKey($apiKey, $request->ip());

        if (! $validApiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired API key',
            ], 401);
        }

        // Check rate limit
        if (! $this->apiKeyService->checkRateLimit($validApiKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Rate limit exceeded',
            ], 429);
        }

        // Attach the API key and application to the request
        $request->merge([
            'api_key_model' => $validApiKey,
            'application_model' => $validApiKey->application,
        ]);

        return $next($request);
    }
}
