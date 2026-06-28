<?php

namespace App\Http\Middleware;

use App\Models\ApiLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $response = $next($request);

        $responseTime = (microtime(true) - $startTime) * 1000; // Convert to milliseconds

        // Log in background (queue)
        dispatch(function () use ($request, $response, $responseTime) {
            $this->logRequest($request, $response, $responseTime);
        })->afterResponse();

        return $response;
    }

    private function logRequest(Request $request, Response $response, float $responseTime): void
    {
        try {
            $apiKey = $request->get('api_key_model');
            $application = $request->get('application_model');

            ApiLog::create([
                'api_key_id' => $apiKey?->id,
                'application_id' => $application?->id,
                'endpoint' => $request->path(),
                'method' => $request->method(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'response_code' => $response->getStatusCode(),
                'response_time' => $responseTime,
                'request_headers' => $this->filterSensitiveHeaders($request->headers->all()),
                'request_body' => $request->method() !== 'GET' ? $request->except(['password', 'api_key']) : null,
                'response_body' => $this->getResponseBody($response),
                'error_message' => $response->getStatusCode() >= 400 ? $this->getErrorMessage($response) : null,
            ]);
        } catch (\Exception $e) {
            // Silently fail - don't break the API response
            logger()->error('Failed to log API request', [
                'error' => $e->getMessage(),
                'endpoint' => $request->path(),
            ]);
        }
    }

    private function filterSensitiveHeaders(array $headers): array
    {
        $sensitive = ['x-api-key', 'authorization', 'cookie'];

        foreach ($sensitive as $key) {
            if (isset($headers[$key])) {
                $headers[$key] = ['***REDACTED***'];
            }
        }

        return $headers;
    }

    private function getResponseBody(Response $response): ?array
    {
        $content = $response->getContent();

        if (empty($content)) {
            return null;
        }

        $decoded = json_decode($content, true);

        // Limit response body size
        if ($decoded && strlen($content) > 10000) {
            return ['message' => 'Response too large to log'];
        }

        return $decoded;
    }

    private function getErrorMessage(Response $response): ?string
    {
        $content = $response->getContent();
        $decoded = json_decode($content, true);

        return $decoded['message'] ?? $decoded['error'] ?? 'Unknown error';
    }
}
