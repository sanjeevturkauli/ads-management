<?php

namespace App\Services;

use App\Models\ConnectedAccount;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * GooglePlayService
 *
 * Authenticates with a Google Service Account (JWT → OAuth2 Bearer token)
 * and queries the Google Play Developer / Reporting APIs.
 *
 * Credential keys supported (both old and new naming):
 *   service_account_email  OR  client_email
 *   private_key
 *   project_id             (optional)
 *   package_names          (optional – newline/comma separated fallback list)
 */
class GooglePlayService
{
    // ── Google endpoints ──────────────────────────────────────────────────────
    private const TOKEN_URL      = 'https://oauth2.googleapis.com/token';
    private const REPORTING_URL  = 'https://playdeveloperreporting.googleapis.com/v1beta1';
    private const PUBLISHER_URL  = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

    // Both scopes — androidpublisher (publishing) + playdeveloperreporting (app discovery)
    private const SCOPE = 'https://www.googleapis.com/auth/androidpublisher https://www.googleapis.com/auth/playdeveloperreporting';

    // =========================================================================
    // PUBLIC API  (signatures unchanged)
    // =========================================================================

    /**
     * Fetch all apps for a connected Play Console account.
     *
     * Strategy order:
     *  1. Play Developer Reporting API  (auto, needs developer Account ID)
     *  2. Package names stored in credentials  (manual fallback)
     */
    public function fetchApps(ConnectedAccount $account): array
    {
        $credentials = $this->getCredentials($account);
        $token       = $this->getAccessToken($account, $credentials);

        Log::info('[GooglePlay] fetchApps — token obtained, starting app discovery', [
            'account_id' => $account->id,
        ]);

        // ── Strategy 1: Reporting API apps:search (AUTOMATIC, no input needed) ─
        // This returns every app the service account has access to.
        $apps = $this->searchAccessibleApps($token);
        if (! empty($apps)) {
            Log::info('[GooglePlay] apps:search returned apps', ['count' => count($apps)]);
            return $apps;
        }

        // ── Strategy 2: Reporting API by developer account ID ─────────────────
        $developerAccountId = $account->account_id
            ?? ($credentials['developer_account_id'] ?? null);

        if ($developerAccountId) {
            Log::info('[GooglePlay] Trying Reporting API by developer ID', [
                'developer_account_id' => $developerAccountId,
            ]);

            $apps = $this->fetchViaReportingApi($token, $developerAccountId);
            if (! empty($apps)) {
                Log::info('[GooglePlay] Reporting API returned apps', ['count' => count($apps)]);
                return $apps;
            }
        }

        // ── Strategy 3: Manually stored package names (fallback) ──────────────
        $packageNames = $credentials['package_names'] ?? null;

        if ($packageNames) {
            $packages = array_values(array_filter(
                array_map('trim', preg_split('/[\n,]+/', $packageNames))
            ));

            if (! empty($packages)) {
                Log::info('[GooglePlay] Using manual package list', ['packages' => $packages]);
                return $this->fetchPackageDetails($token, $packages);
            }
        }

        throw new \RuntimeException(
            "No apps found automatically.\n".
            "Make sure the service account is granted access in Play Console → Users & Permissions, ".
            "and that the 'Google Play Developer Reporting API' is enabled in Google Cloud.\n".
            "As a fallback, you can add Package Names manually in the account settings."
        );
    }

    /**
     * AUTOMATIC app discovery via Play Developer Reporting API.
     * Endpoint: GET /v1beta1/apps:search
     * Returns every app the service account is allowed to see — no IDs needed.
     * Docs: https://developers.google.com/play/developer/reporting/reference/rest/v1beta1/apps/search
     */
    private function searchAccessibleApps(string $token): array
    {
        $url = self::REPORTING_URL.'/apps:search';

        Log::info('[GooglePlay] apps:search URL', ['url' => $url]);

        $allApps  = [];
        $pageToken = null;

        do {
            $response = Http::withToken($token)
                ->timeout(20)
                ->get($url, array_filter(['pageToken' => $pageToken]));

            Log::info('[GooglePlay] apps:search response', [
                'status'    => $response->status(),
                'json_keys' => array_keys($response->json() ?? []),
                'body_start' => $response->status() !== 200 ? substr($response->body(), 0, 400) : '(ok)',
            ]);

            if (! $response->successful()) {
                Log::warning('[GooglePlay] apps:search failed', [
                    'status' => $response->status(),
                    'error'  => $response->json('error.message', substr($response->body(), 0, 300)),
                ]);
                break;
            }

            $apps = $response->json('apps') ?? [];

            Log::info('[GooglePlay] apps:search raw apps', ['apps' => $apps]);

            foreach ($apps as $app) {
                // "name" comes as "apps/{packageName}"
                $pkg = $app['packageName']
                    ?? (isset($app['name']) ? str_replace('apps/', '', $app['name']) : null);

                if ($pkg) {
                    // Fetch real status via Edits API + icon via Play Store
                    [$status, $iconUrl] = $this->fetchAppDetails2($token, $pkg);

                    $allApps[] = [
                        'packageName' => $pkg,
                        'title'       => $app['displayName'] ?? $this->nameFromPackage($pkg),
                        'iconUrl'     => $iconUrl,
                        'status'      => $status,
                    ];
                }
            }

            $pageToken = $response->json('nextPageToken');
        } while ($pageToken);

        return $allApps;
    }

    /**
     * Fetch both real status AND icon for an app.
     * Returns [status, iconUrl].
     *
     * Status: derived from Edits API release tracks (most accurate available source).
     * Icon: constructed from Google's Play CDN using known URL pattern.
     *
     * @return array{0: string, 1: string|null}
     */
    private function fetchAppDetails2(string $token, string $packageName): array
    {
        $status  = $this->fetchAppStatus($token, $packageName);

        // Google Play CDN icon URL — works without auth, no scraping needed.
        // Format: https://play-lh.googleusercontent.com/{appId}=s180-rw
        // We derive this from the Play Store's structured data API.
        $iconUrl = $this->fetchIconViaStructuredData($packageName);

        return [$status, $iconUrl];
    }

    /**
     * Fetch icon URL using Google's internal Play Store structured data endpoint.
     * This is the same endpoint used by google-play-scraper and similar tools.
     * Returns a play-lh.googleusercontent.com URL directly.
     */
    private function fetchIconViaStructuredData(string $packageName): ?string
    {
        try {
            // Google's internal Play Store details API
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent'      => 'Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
                    'Accept-Language' => 'en-US,en;q=0.9',
                    'Referer'         => 'https://play.google.com/',
                ])
                ->get("https://play.google.com/store/apps/details", [
                    'id'     => $packageName,
                    'hl'     => 'en',
                    'gl'     => 'US',
                    'pcampaignid' => 'pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1',
                ]);

            Log::info('[GooglePlay] Play Store page fetch', [
                'package' => $packageName,
                'status'  => $response->status(),
                'size'    => strlen($response->body()),
            ]);

            if (! $response->successful()) {
                return null;
            }

            $html = $response->body();

            // Method 1: og:image (most reliable)
            if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](https:\/\/play-lh[^"\']+)["\']/', $html, $m)) {
                return $m[1];
            }

            // Method 2: reversed attribute order
            if (preg_match('/content=["\'](https:\/\/play-lh\.googleusercontent\.com[^"\'?]+)["\'][^>]*property=["\']og:image["\']/', $html, $m)) {
                return $m[1];
            }

            // Method 3: Find icon in script tags (hydration JSON)
            if (preg_match_all('/https:\\\\u002F\\\\u002Fplay-lh\.googleusercontent\.com\\\\u002F([^"\\\\]+)/', $html, $m)) {
                return 'https://play-lh.googleusercontent.com/'.$m[1][0];
            }

            // Method 4: Direct CDN URL pattern from any image reference
            if (preg_match('/https:\/\/play-lh\.googleusercontent\.com\/([a-zA-Z0-9_\-]+)/', $html, $m)) {
                return 'https://play-lh.googleusercontent.com/'.$m[1].'=w180-h180-rw';
            }

            return null;

        } catch (\Exception $e) {
            Log::warning('[GooglePlay] Structured data icon fetch failed', [
                'package' => $packageName,
                'error'   => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Fetch the app icon URL from the Google Play Store public page.
     *
     * Uses browser-like headers to avoid 404/403 blocks.
     * Tries multiple URL patterns to extract the icon.
     */
    private function fetchPlayStoreIcon(string $packageName): ?string
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent'      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept'          => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language' => 'en-US,en;q=0.9',
                    'Accept-Encoding' => 'gzip, deflate, br',
                    'Cache-Control'   => 'no-cache',
                    'Pragma'          => 'no-cache',
                    'Sec-Fetch-Dest'  => 'document',
                    'Sec-Fetch-Mode'  => 'navigate',
                    'Sec-Fetch-Site'  => 'none',
                    'Upgrade-Insecure-Requests' => '1',
                ])
                ->get("https://play.google.com/store/apps/details?id={$packageName}&hl=en&gl=US");

            Log::info('[GooglePlay] Play Store page fetch', [
                'package' => $packageName,
                'status'  => $response->status(),
                'size'    => strlen($response->body()),
            ]);

            if (! $response->successful()) {
                return null;
            }

            $html = $response->body();

            // Try 1: og:image meta tag
            if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](https[^"\']+)["\']/', $html, $m)) {
                return $m[1];
            }

            // Try 2: og:image with reversed attribute order
            if (preg_match('/<meta[^>]+content=["\'](https://play-lh\.googleusercontent\.com[^"\']+)["\'][^>]+property=["\']og:image["\']/', $html, $m)) {
                return $m[1];
            }

            // Try 3: Find any play-lh.googleusercontent.com image used as an icon
            if (preg_match_all('/https:\/\/play-lh\.googleusercontent\.com\/[^"\'&\s]+/', $html, $matches)) {
                // Filter out screenshots (usually wider) — icon is square
                foreach ($matches[0] as $url) {
                    // Icons typically have =w240-h240 or similar square dimensions
                    if (str_contains($url, '=w') && str_contains($url, '-h')) {
                        return $url;
                    }
                }
                // Return first one as fallback
                if (! empty($matches[0])) {
                    return $matches[0][0];
                }
            }

            Log::info('[GooglePlay] No icon found on Play Store page', ['package' => $packageName]);
            return null;

        } catch (\Exception $e) {
            Log::warning('[GooglePlay] Icon fetch failed', [
                'package' => $packageName,
                'error'   => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Determine an app's real publish status using the Android Publisher Edits API.
     *
     * Flow: create edit → read tracks → derive status → delete edit (cleanup).
     * Best-effort: returns 'UNKNOWN' if the API is not accessible.
     */
    private function fetchAppStatus(string $token, string $packageName): string
    {
        try {
            // 1. Create an edit
            $editResp = Http::withToken($token)
                ->timeout(15)
                ->post(self::PUBLISHER_URL."/{$packageName}/edits");

            if (! $editResp->successful()) {
                $code    = $editResp->status();
                $errMsg  = strtolower($editResp->json('error.message', ''));

                Log::warning('[GooglePlay] Could not create edit for status', [
                    'package' => $packageName,
                    'status'  => $code,
                    'error'   => $errMsg,
                ]);

                // Detect "Removed by Google" — edit returns 403 with specific messages
                if ($code === 403 && (
                    str_contains($errMsg, 'removed') ||
                    str_contains($errMsg, 'suspended') ||
                    str_contains($errMsg, 'terminated') ||
                    str_contains($errMsg, 'policy')
                )) {
                    return 'REMOVED';
                }

                // 404 = package doesn't exist at all
                if ($code === 404) {
                    return 'NOT_FOUND';
                }

                return 'UNKNOWN';
            }

            $editId = $editResp->json('id');

            // 2. Read tracks
            $tracksResp = Http::withToken($token)
                ->timeout(15)
                ->get(self::PUBLISHER_URL."/{$packageName}/edits/{$editId}/tracks");

            $status = 'DRAFT'; // default — edit created but no published release

            if ($tracksResp->successful()) {
                $tracks = $tracksResp->json('tracks') ?? [];

                Log::info('[GooglePlay] Tracks raw data', [
                    'package'     => $packageName,
                    'tracks_json' => json_encode($tracks),
                    'count'       => count($tracks),
                ]);

                $status = $this->resolveStatus($tracks);
            } else {
                Log::warning('[GooglePlay] Tracks fetch failed', [
                    'package' => $packageName,
                    'status'  => $tracksResp->status(),
                    'body'    => substr($tracksResp->body(), 0, 300),
                ]);
            }

            // 3. Cleanup — delete the edit (we never commit it)
            Http::withToken($token)
                ->timeout(15)
                ->delete(self::PUBLISHER_URL."/{$packageName}/edits/{$editId}");

            Log::info('[GooglePlay] App status resolved', [
                'package' => $packageName,
                'status'  => $status,
            ]);

            return $status;

        } catch (\Exception $e) {
            Log::warning('[GooglePlay] Status fetch exception', [
                'package' => $packageName,
                'error'   => $e->getMessage(),
            ]);
            return 'UNKNOWN';
        }
    }


    /**
     * Fetch details for a single package name.
     */
    public function fetchAppDetails(ConnectedAccount $account, string $packageName): array
    {
        $credentials = $this->getCredentials($account);
        $token       = $this->getAccessToken($account, $credentials);

        return $this->getPackageInfo($token, $packageName);
    }

    /**
     * Get (or generate + cache) the OAuth2 access token.
     * Cached for 55 minutes — tokens expire after 60 min.
     */
    public function getAccessToken(ConnectedAccount $account, ?array $credentials = null): string
    {
        // FIX: clear cache on every call during debugging can be done by
        // setting GOOGLE_PLAY_DISABLE_TOKEN_CACHE=true in .env
        $cacheKey = "google_play_token_{$account->id}";

        if (config('app.debug') && request()->has('nocache')) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, now()->addMinutes(55), function () use ($account, $credentials) {
            $creds = $credentials ?? $this->getCredentials($account);
            return $this->generateAccessToken($creds);
        });
    }

    /**
     * Decode and return the stored credentials array.
     * Supports both raw JSON (pasted from Google Cloud) and field-by-field storage.
     */
    public function getCredentials(ConnectedAccount $account): array
    {
        $raw = $account->getDecrypted('encrypted_credentials');

        if (! $raw) {
            throw new \RuntimeException('No credentials found for this account.');
        }

        // ── Support direct Google Service Account JSON paste ──────────────────
        // If the user pasted the full JSON downloaded from Google Cloud Console,
        // it will have keys like "client_email", "private_key", "type", etc.
        $data = json_decode($raw, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException(
                'Credentials are not valid JSON. Please re-save the account.'
            );
        }

        // Normalize: support both "client_email" (Google JSON) and
        // "service_account_email" (our custom field name)
        if (! isset($data['service_account_email']) && isset($data['client_email'])) {
            $data['service_account_email'] = $data['client_email'];
        }

        Log::info('[GooglePlay] Credentials loaded', [
            'service_account_email' => $data['service_account_email'] ?? $data['client_email'] ?? '(missing)',
            'has_private_key'       => ! empty($data['private_key']),
            'has_package_names'     => ! empty($data['package_names']),
        ]);

        return $data;
    }

    // =========================================================================
    // PRIVATE — Authentication
    // =========================================================================

    /**
     * Full JWT → access-token flow for a Google Service Account.
     *
     * FIX: The most common cause of "Invalid private key" is that the stored
     * key has literal "\n" strings instead of real newlines (happens when the
     * JSON was parsed with single-quotes or stored as a one-liner).
     * We normalize before passing to OpenSSL.
     */
    private function generateAccessToken(array $credentials): string
    {
        // ── 1. Extract & validate service account email ───────────────────────
        $serviceAccountEmail = $credentials['service_account_email']
            ?? $credentials['client_email']
            ?? null;

        if (! $serviceAccountEmail) {
            throw new \RuntimeException(
                'Missing service account email. Expected key: "service_account_email" or "client_email".'
            );
        }

        Log::info('[GooglePlay] JWT — using service account', [
            'email' => $serviceAccountEmail,
        ]);

        // ── 2. Extract & normalise private key ───────────────────────────────
        $rawKey = $credentials['private_key'] ?? null;

        if (! $rawKey) {
            throw new \RuntimeException('Missing "private_key" in credentials.');
        }

        $privateKey = $this->normalizePrivateKey($rawKey);

        // ── 3. Build & sign JWT ───────────────────────────────────────────────
        $now = time();

        $header = $this->b64url((string) json_encode([
            'alg' => 'RS256',
            'typ' => 'JWT',
        ]));

        $payload = $this->b64url((string) json_encode([
            'iss'   => $serviceAccountEmail,
            'scope' => self::SCOPE,
            'aud'   => self::TOKEN_URL,
            'iat'   => $now,
            'exp'   => $now + 3600,
        ]));

        $signingInput = "{$header}.{$payload}";

        Log::info('[GooglePlay] JWT — signing input prepared, attempting OpenSSL sign');

        $pkeyResource = openssl_pkey_get_private($privateKey);

        if ($pkeyResource === false) {
            $opensslError = openssl_error_string() ?: 'unknown OpenSSL error';
            Log::error('[GooglePlay] openssl_pkey_get_private failed', [
                'openssl_error'    => $opensslError,
                'key_starts_with'  => substr($privateKey, 0, 40),
                'key_ends_with'    => substr($privateKey, -30),
            ]);
            throw new \RuntimeException(
                "Invalid private key — OpenSSL could not parse it.\n".
                "OpenSSL error: {$opensslError}\n".
                "Ensure the key is a valid PEM RSA/EC private key starting with:\n".
                "-----BEGIN PRIVATE KEY----- (PKCS#8) or -----BEGIN RSA PRIVATE KEY----- (PKCS#1)"
            );
        }

        openssl_sign($signingInput, $signature, $pkeyResource, OPENSSL_ALGO_SHA256);

        $jwt = $signingInput.'.'.$this->b64url($signature);

        Log::info('[GooglePlay] JWT — signed successfully, exchanging for access token');

        // ── 4. Exchange JWT for access token ─────────────────────────────────
        $response = Http::asForm()
            ->timeout(15)
            ->post(self::TOKEN_URL, [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]);

        Log::info('[GooglePlay] Token endpoint response', [
            'status' => $response->status(),
            'body'   => $response->status() !== 200 ? $response->body() : '(ok)',
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException(
                'Failed to get access token from Google: '.
                $response->json('error_description', $response->body())
            );
        }

        $token = $response->json('access_token');

        if (! $token) {
            throw new \RuntimeException('Google returned a successful response but no access_token.');
        }

        Log::info('[GooglePlay] Access token obtained successfully');

        return $token;
    }

    /**
     * Normalise a private key string coming from various storage formats.
     *
     * Problems this fixes:
     *  - Literal "\n" escape sequences  → real newlines
     *  - Leading / trailing whitespace
     *  - Windows \r\n line endings
     */
    private function normalizePrivateKey(string $raw): string
    {
        // Step 1 — convert escaped newlines to real newlines
        $key = str_replace(['\\n', '\n'], "\n", $raw);

        // Step 2 — strip carriage returns
        $key = str_replace("\r", '', $key);

        // Step 3 — trim surrounding whitespace
        $key = trim($key);

        // Step 4 — validate PEM structure
        $validHeaders = [
            '-----BEGIN PRIVATE KEY-----',      // PKCS#8 (Google service accounts)
            '-----BEGIN RSA PRIVATE KEY-----',  // PKCS#1
            '-----BEGIN EC PRIVATE KEY-----',
        ];

        $validFooters = [
            '-----END PRIVATE KEY-----',
            '-----END RSA PRIVATE KEY-----',
            '-----END EC PRIVATE KEY-----',
        ];

        $hasValidHeader = false;
        $hasValidFooter = false;

        foreach ($validHeaders as $h) {
            if (str_starts_with($key, $h)) {
                $hasValidHeader = true;
                break;
            }
        }

        foreach ($validFooters as $f) {
            if (str_ends_with($key, $f)) {
                $hasValidFooter = true;
                break;
            }
        }

        if (! $hasValidHeader) {
            throw new \RuntimeException(
                "Private key is missing a valid PEM header.\n".
                "Expected one of: ".implode(' / ', $validHeaders)."\n".
                "Got: ".substr($key, 0, 40).'…'
            );
        }

        if (! $hasValidFooter) {
            throw new \RuntimeException(
                "Private key is missing a valid PEM footer.\n".
                "Expected one of: ".implode(' / ', $validFooters)."\n".
                "Got (last 40 chars): …".substr($key, -40)
            );
        }

        Log::info('[GooglePlay] Private key normalised and validated', [
            'header' => substr($key, 0, 27),
            'length' => strlen($key),
        ]);

        return $key;
    }

    // =========================================================================
    // PRIVATE — App discovery
    // =========================================================================

    /**
     * Play Developer Reporting API — lists apps in a developer account.
     * Correct endpoint: https://playdeveloperreporting.googleapis.com/v1beta1/developers/{id}/apps
     */
    private function fetchViaReportingApi(string $token, string $developerAccountId): array
    {
        // Strip non-numeric chars — account IDs are pure integers
        $cleanId = preg_replace('/[^0-9]/', '', $developerAccountId);

        $url = self::REPORTING_URL . "/developers/{$cleanId}/apps";

        Log::info('[GooglePlay] Reporting API URL', ['url' => $url]);

        $response = Http::withToken($token)
            ->timeout(15)
            ->get($url);

        Log::info('[GooglePlay] Reporting API response', [
            'status'     => $response->status(),
            'body_start' => $response->status() !== 200 ? substr($response->body(), 0, 500) : '(ok)',
            'json_keys'  => array_keys($response->json() ?? []),
        ]);

        if (! $response->successful()) {
            Log::warning('[GooglePlay] Reporting API failed', [
                'status' => $response->status(),
                'error'  => $response->json('error.message', substr($response->body(), 0, 300)),
            ]);
            return [];
        }

        $rawApps = $response->json('apps') ?? [];

        Log::info('[GooglePlay] Reporting API apps found', ['count' => count($rawApps)]);

        return collect($rawApps)
            ->map(fn($app) => [
                'packageName' => $app['packageName'] ?? $app['name'] ?? null,
                'title'       => $app['displayName'] ?? $app['packageName'] ?? null,
                'iconUrl'     => null,
                'status'      => 'ACTIVE',
            ])
            ->filter(fn($a) => ! empty($a['packageName']))
            ->values()
            ->toArray();
    }

    /**
     * Fetch details for each package name individually via the
     * Android Publisher API and return normalised app records.
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
                    // Map track names to a readable status
                    'status'      => $this->resolveStatus($info['tracks'] ?? []),
                ];
            } catch (\Exception $e) {
                Log::warning('[GooglePlay] Could not fetch details for package', [
                    'package' => $pkg,
                    'error'   => $e->getMessage(),
                ]);

                // Still include — user explicitly listed this package.
                // Status is genuinely unknown — do NOT assume published.
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
     * Query the Android Publisher API for a single package's release tracks.
     * This is the most reliable authenticated call for package verification.
     */
    private function getPackageInfo(string $token, string $packageName): array
    {
        // Correct URL: https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{pkg}/tracks
        $url = self::PUBLISHER_URL . "/{$packageName}/tracks";

        Log::info('[GooglePlay] Package tracks URL', ['url' => $url]);

        $response = Http::withToken($token)
            ->timeout(15)
            ->get($url);

        Log::info('[GooglePlay] Package tracks response', [
            'package' => $packageName,
            'status'  => $response->status(),
            'body'    => $response->status() !== 200 ? $response->body() : '(ok)',
        ]);

        if (! $response->successful()) {
            // 403 = auth ok but service account not granted access to this app
            // 404 = package does not exist
            $code    = $response->status();
            $message = $response->json('error.message', 'unknown error');

            if ($code === 403) {
                Log::warning('[GooglePlay] Service account lacks edit permission — status cannot be determined', [
                    'package' => $packageName,
                    'hint'    => 'Grant "Release manager" role in Play Console to see real track status.',
                ]);
                return [
                    'title'         => $this->nameFromPackage($packageName),
                    'iconUrl'       => null,
                    'version'       => null,
                    'status'        => 'UNKNOWN',
                    'status_reason' => 'Service account lacks permission to read release tracks.',
                    'tracks'        => [],
                ];
            }

            throw new \RuntimeException(
                "Cannot access '{$packageName}' (HTTP {$code}): {$message}"
            );
        }

        $tracks  = $response->json('tracks') ?? [];
        $version = null;

        foreach ($tracks as $track) {
            $versionCode = $track['releases'][0]['versionCodes'][0] ?? null;
            if ($versionCode) {
                $version = $versionCode;
                break;
            }
        }

        return [
            'title'   => $this->nameFromPackage($packageName),
            'iconUrl' => null,
            'version' => $version,
            'status'  => $this->resolveStatus($tracks),
            'tracks'  => $tracks,
        ];
    }

    /**
     * Derive status from Edits API track data.
     *
     * Note: "Removed by Google" and "In Review" visibility states are NOT
     * available via the Edits API — those are Play Console UI states.
     * This method returns the most accurate status derivable from track data.
     *
     * completed in production = last release was published to production.
     * Whether it's currently visible depends on Play's review/policy status.
     */
    private function resolveStatus(array $tracks): string
    {
        if (empty($tracks)) {
            return 'DRAFT';
        }

        // Check production track first
        foreach ($tracks as $track) {
            if (strtolower($track['track'] ?? '') !== 'production') continue;

            $releases = $track['releases'] ?? [];
            if (empty($releases)) continue;

            // Find the most recent non-draft release
            foreach ($releases as $release) {
                $releaseStatus = strtolower($release['status'] ?? '');

                if ($releaseStatus === 'completed') return 'PUBLISHED';
                if ($releaseStatus === 'inprogress') return 'IN_REVIEW';
                if ($releaseStatus === 'halted') return 'HALTED';
                // 'draft' in production = not yet submitted
            }
        }

        // Check other tracks in priority order
        foreach (['beta', 'alpha', 'internal'] as $trackName) {
            foreach ($tracks as $track) {
                if (strtolower($track['track'] ?? '') !== $trackName) continue;
                $releases = $track['releases'] ?? [];
                foreach ($releases as $release) {
                    $s = strtolower($release['status'] ?? '');
                    if ($s === 'completed') return strtoupper($trackName);
                    if ($s === 'inprogress') return strtoupper($trackName).'_REVIEW';
                }
            }
        }

        return 'DRAFT';
    }

    // =========================================================================
    // PRIVATE — Utilities
    // =========================================================================

    /** RFC 4648 §5 URL-safe Base64 without padding. */
    private function b64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function nameFromPackage(string $packageName): string
    {
        $parts = explode('.', $packageName);
        return ucwords(str_replace(['-', '_'], ' ', end($parts)));
    }
}
