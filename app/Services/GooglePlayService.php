<?php

namespace App\Services;

use App\Models\ConnectedAccount;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GooglePlayService
{
    private const TOKEN_URL    = 'https://oauth2.googleapis.com/token';
    private const REPORTING_URL = 'https://playdeveloperreporting.googleapis.com/v1beta1';
    private const PUBLISHER_URL = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
    private const SCOPE         = 'https://www.googleapis.com/auth/androidpublisher';

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Fetch all apps for a connected account.
     *
     * Strategy (in order of preference):
     *  1. Play Developer Reporting API  (needs developer account ID)
     *  2. Package names stored manually in credentials
     */
    public function fetchApps(ConnectedAccount $account): array
    {
        $credentials = $this->getCredentials($account);
        $token       = $this->getAccessToken($account, $credentials);

        // ── Strategy 1: Play Developer Reporting API ─────────────────────────
        $developerAccountId = $account->account_id
            ?? ($credentials['developer_account_id'] ?? null);

        if ($developerAccountId) {
            $apps = $this->fetchViaReportingApi($token, $developerAccountId);
            if (! empty($apps)) {
                return $apps;
            }
        }

        // ── Strategy 2: Manually stored package names ─────────────────────────
        $packageNames = $credentials['package_names'] ?? null;

        if ($packageNames) {
            $packages = array_filter(
                array_map('trim', preg_split('/[\n,]+/', $packageNames))
            );

            if (! empty($packages)) {
                return $this->fetchPackageDetails($token, $packages);
            }
        }

        throw new \RuntimeException(
            'Could not find any apps. Please make sure either:'.PHP_EOL.
            '• Your Account ID (Developer Account ID) is set correctly, OR'.PHP_EOL.
            '• You have added Package Names in the account credentials.'
        );
    }

    /**
     * Fetch details for a single package.
     */
    public function fetchAppDetails(ConnectedAccount $account, string $packageName): array
    {
        $credentials = $this->getCredentials($account);
        $token       = $this->getAccessToken($account, $credentials);

        return $this->getPackageInfo($token, $packageName);
    }

    /**
     * Get (or generate + cache) the OAuth2 access token.
     */
    public function getAccessToken(ConnectedAccount $account, ?array $credentials = null): string
    {
        $cacheKey = "google_play_token_{$account->id}";

        return Cache::remember($cacheKey, now()->addMinutes(55), function () use ($account, $credentials) {
            $creds = $credentials ?? $this->getCredentials($account);
            return $this->generateJwtToken($creds);
        });
    }

    /**
     * Decode and return the stored credentials array.
     */
    public function getCredentials(ConnectedAccount $account): array
    {
        $raw = $account->getDecrypted('encrypted_credentials');

        if (! $raw) {
            throw new \RuntimeException('No credentials found for this account.');
        }

        $data = json_decode($raw, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Invalid credentials format.');
        }

        return $data;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Use Play Developer Reporting API to list all apps in a developer account.
     * Endpoint: GET /v1beta1/developers/{devAccount}/apps
     */
    private function fetchViaReportingApi(string $token, string $developerAccountId): array
    {
        $cleanId = preg_replace('/[^0-9]/', '', $developerAccountId);

        $response = Http::withToken($token)
            ->get(self::REPORTING_URL."/developers/{$cleanId}/apps");

        Log::debug('Play Reporting API response', [
            'status' => $response->status(),
            'body'   => $response->body(),
        ]);

        if (! $response->successful()) {
            return [];
        }

        $rawApps = $response->json('apps') ?? [];

        return collect($rawApps)->map(fn($app) => [
            'packageName' => $app['packageName'] ?? $app['name'] ?? null,
            'title'       => $app['displayName'] ?? $app['packageName'] ?? null,
            'iconUrl'     => null,
            'status'      => 'ACTIVE',
        ])->filter(fn($a) => ! empty($a['packageName']))->values()->toArray();
    }

    /**
     * Given a list of package names, fetch basic details for each.
     */
    private function fetchPackageDetails(string $token, array $packages): array
    {
        $results = [];

        foreach ($packages as $pkg) {
            try {
                $info      = $this->getPackageInfo($token, $pkg);
                $results[] = [
                    'packageName' => $pkg,
                    'title'       => $info['title'] ?? $this->nameFromPackage($pkg),
                    'iconUrl'     => $info['iconUrl'] ?? null,
                    'status'      => $info['status'] ?? 'ACTIVE',
                ];
            } catch (\Exception $e) {
                // Still include it — user explicitly listed it
                $results[] = [
                    'packageName' => $pkg,
                    'title'       => $this->nameFromPackage($pkg),
                    'iconUrl'     => null,
                    'status'      => 'UNKNOWN',
                ];
            }
        }

        return $results;
    }

    /**
     * GET app details from androidpublisher API.
     * Returns details like title, icon, version tracks, etc.
     */
    private function getPackageInfo(string $token, string $packageName): array
    {
        // Get app listing details from a specific track edit
        // The simplest call: GET /applications/{packageName}/reviews — always allowed
        // Better: GET /applications/{packageName}/details (not in v3)
        // Best available: check app tracks
        $response = Http::withToken($token)
            ->get(self::PUBLISHER_URL."/applications/{$packageName}/tracks");

        if ($response->successful()) {
            $tracks = $response->json('tracks') ?? [];
            $version = null;
            foreach ($tracks as $track) {
                if (! empty($track['releases'])) {
                    $version = $track['releases'][0]['versionCodes'][0] ?? null;
                    break;
                }
            }

            return [
                'title'   => $this->nameFromPackage($packageName),
                'iconUrl' => null,
                'version' => $version,
                'status'  => 'ACTIVE',
                'tracks'  => $tracks,
            ];
        }

        throw new \RuntimeException(
            "Cannot access package '{$packageName}': ".
            $response->json('error.message', 'Permission denied or package not found.')
        );
    }

    /**
     * Build JWT and exchange for access token via Google OAuth2.
     */
    private function generateJwtToken(array $credentials): string
    {
        $privateKey          = $credentials['private_key'] ?? null;
        $serviceAccountEmail = $credentials['service_account_email'] ?? null;

        if (! $privateKey || ! $serviceAccountEmail) {
            throw new \RuntimeException(
                'Missing private_key or service_account_email in credentials.'
            );
        }

        $now = time();

        $header = $this->base64UrlEncode((string) json_encode([
            'alg' => 'RS256',
            'typ' => 'JWT',
        ]));

        $payload = $this->base64UrlEncode((string) json_encode([
            'iss'   => $serviceAccountEmail,
            'scope' => self::SCOPE,
            'aud'   => self::TOKEN_URL,
            'exp'   => $now + 3600,
            'iat'   => $now,
        ]));

        $signingInput       = "{$header}.{$payload}";
        $privateKeyResource = openssl_pkey_get_private($privateKey);

        if (! $privateKeyResource) {
            throw new \RuntimeException(
                'Invalid private key. Ensure it is a valid PEM RSA private key.'
            );
        }

        openssl_sign($signingInput, $signature, $privateKeyResource, 'SHA256');

        $jwt = $signingInput.'.'.$this->base64UrlEncode($signature);

        $response = Http::asForm()->post(self::TOKEN_URL, [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException(
                'Failed to get access token: '.
                $response->json('error_description', $response->body())
            );
        }

        return $response->json('access_token');
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function nameFromPackage(string $packageName): string
    {
        $parts = explode('.', $packageName);
        return ucwords(str_replace(['-', '_'], ' ', end($parts)));
    }
}
