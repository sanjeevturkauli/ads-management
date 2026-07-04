<?php

namespace App\Services;

use App\DataTransferObjects\PlayStoreMetadata;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * MetadataParser
 *
 * Fetches app metadata from the Google Play Store public page.
 *
 * Strategy:
 *  1. Fetch the Play Store HTML page with a mobile browser user-agent
 *  2. Extract the JSON data blob embedded in the page (AF_initDataCallback)
 *  3. Parse the structured data to extract icon, title, rating, etc.
 *
 * This approach is more reliable than batchexecute because:
 *  - The HTML page is the same one real users see
 *  - The embedded JSON (DS:3prd) contains all app metadata
 *  - No special API keys or authentication required
 */
class MetadataParser
{
    private const PLAY_STORE_URL = 'https://play.google.com/store/apps/details';

    private const USER_AGENT_MOBILE =
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 '.
        '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';

    /**
     * Fetch metadata for a single package name.
     */
    public function fetch(string $packageName, string $locale = 'en', string $country = 'US'): ?PlayStoreMetadata
    {
        try {
            $response = Http::withHeaders([
                'User-Agent'      => self::USER_AGENT_MOBILE,
                'Accept'          => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language' => $locale.'-'.$country.',en;q=0.9',
                'Accept-Encoding' => 'gzip, deflate, br',
                'Cache-Control'   => 'no-cache',
                'Pragma'          => 'no-cache',
                'Sec-Fetch-Dest'  => 'document',
                'Sec-Fetch-Mode'  => 'navigate',
                'Sec-Fetch-Site'  => 'none',
            ])
                ->timeout(20)
                ->retry(2, 2000)
                ->get(self::PLAY_STORE_URL, [
                    'id' => $packageName,
                    'hl' => $locale,
                    'gl' => $country,
                ]);

            Log::info('[MetadataParser] Page fetch', [
                'package' => $packageName,
                'status'  => $response->status(),
                'size'    => strlen($response->body()),
            ]);

            if (! $response->successful()) {
                Log::warning('[MetadataParser] Page not accessible', [
                    'package' => $packageName,
                    'status'  => $response->status(),
                ]);
                return null;
            }

            return $this->parseHtml($response->body(), $packageName);

        } catch (\Throwable $e) {
            Log::error('[MetadataParser] Exception', [
                'package' => $packageName,
                'error'   => $e->getMessage(),
            ]);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private — HTML parsing
    // ─────────────────────────────────────────────────────────────────────────

    private function parseHtml(string $html, string $packageName): ?PlayStoreMetadata
    {
        // Method 1: Extract AF_initDataCallback data blobs
        // Google Play embeds all app data as JS variable assignments
        $data = $this->extractDataBlobs($html);

        if (empty($data)) {
            Log::warning('[MetadataParser] No data blobs found', ['package' => $packageName]);
            // Fall back to simple meta tag extraction
            return $this->parseMetaTags($html, $packageName);
        }

        Log::info('[MetadataParser] Data blobs extracted', [
            'package' => $packageName,
            'blobs'   => count($data),
            'keys'    => array_keys($data),
        ]);

        return $this->extractFromBlobs($data, $packageName, $html);
    }

    /**
     * Extract the AF_initDataCallback JSON blobs embedded in Play Store HTML.
     * These contain the structured app data used to render the page.
     */
    private function extractDataBlobs(string $html): array
    {
        $blobs = [];

        // Pattern: AF_initDataCallback({key: 'ds:X', ...data...})
        preg_match_all(
            '/AF_initDataCallback\s*\(\s*\{[^}]*key\s*:\s*[\'"]([^\'"]+)[\'"][^}]*data\s*:\s*(\[.*?)\}\s*\)\s*;/s',
            $html,
            $matches,
            PREG_SET_ORDER
        );

        foreach ($matches as $match) {
            $key      = $match[1] ?? null;
            $jsonStr  = $match[2] ?? null;

            if ($key && $jsonStr) {
                // Clean up the JSON (remove trailing comma before })
                $jsonStr = rtrim(trim($jsonStr), ',');
                $decoded = json_decode($jsonStr, true);
                if (is_array($decoded)) {
                    $blobs[$key] = $decoded;
                }
            }
        }

        // Also try simpler pattern for newer Play Store versions
        if (empty($blobs)) {
            preg_match_all(
                "/AF_initDataCallback\\(\\{key: '(ds:\\d+)', .*?data:(\\[.+?\\])\\}\\);/s",
                $html,
                $matches2,
                PREG_SET_ORDER
            );
            foreach ($matches2 as $m) {
                $decoded = json_decode($m[2] ?? '', true);
                if (is_array($decoded)) {
                    $blobs[$m[1]] = $decoded;
                }
            }
        }

        return $blobs;
    }

    /**
     * Extract app metadata from the data blobs.
     * ds:5 typically contains the main app details.
     */
    private function extractFromBlobs(array $blobs, string $packageName, string $html): PlayStoreMetadata
    {
        // Try common blob keys that contain app data
        $appData = $blobs['ds:5'] ?? $blobs['ds:3'] ?? $blobs['ds:4'] ?? null;

        // Navigate into nested structure
        $d = null;
        if ($appData) {
            // ds:5 structure: [null, [[null, null, ..., [appDataArray]]]]
            $d = $appData[1][2] ?? $appData[0][2] ?? null;
        }

        // Build metadata from whatever we could extract
        return new PlayStoreMetadata(
            packageName:     $packageName,
            title:           $d ? ($this->safeGet($d, [0, 0]) ?? $this->extractTitle($html)) : $this->extractTitle($html),
            iconUrl:         $d ? $this->safeGet($d, [95, 0, 3, 2]) : $this->extractOgImage($html),
            bannerUrl:       $d ? $this->safeGet($d, [96, 0, 3, 2]) : null,
            description:     $d ? strip_tags((string) ($this->safeGet($d, [10, 0, 1]) ?? '')) : $this->extractDescription($html),
            developerName:   $d ? $this->safeGet($d, [68, 0]) : $this->extractDeveloper($html),
            category:        $d ? $this->safeGet($d, [79, 0, 0, 0]) : null,
            rating:          $d ? $this->extractRating($d) : $this->extractRatingFromHtml($html),
            ratingsCount:    $d ? (int) ($this->safeGet($d, [6, 2, 1]) ?? 0) ?: null : null,
            installs:        $d ? $this->safeGet($d, [13, 0]) : $this->extractInstalls($html),
            privacyPolicyUrl: $d ? $this->safeGet($d, [99, 0, 5, 2]) : null,
            websiteUrl:      $d ? $this->safeGet($d, [69, 0]) : null,
            playStoreUrl:    "https://play.google.com/store/apps/details?id={$packageName}",
            screenshots:     $d ? $this->extractScreenshots($d) : [],
            storeLastUpdated: $d ? $this->extractLastUpdated($d) : null,
        );
    }

    /**
     * Fallback: extract metadata from HTML meta tags only.
     */
    private function parseMetaTags(string $html, string $packageName): PlayStoreMetadata
    {
        return new PlayStoreMetadata(
            packageName:   $packageName,
            title:         $this->extractTitle($html),
            iconUrl:       $this->extractOgImage($html),
            description:   $this->extractDescription($html),
            developerName: $this->extractDeveloper($html),
            installs:      $this->extractInstalls($html),
            rating:        $this->extractRatingFromHtml($html),
            playStoreUrl:  "https://play.google.com/store/apps/details?id={$packageName}",
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Meta tag extractors (reliable fallbacks)
    // ─────────────────────────────────────────────────────────────────────────

    private function extractTitle(string $html): ?string
    {
        if (preg_match('/<title>([^<]+)<\/title>/i', $html, $m)) {
            $title = trim(html_entity_decode($m[1]));
            // Remove " - Apps on Google Play" suffix
            return preg_replace('/\s*-\s*Apps on Google Play\s*$/i', '', $title) ?: null;
        }
        // og:title fallback
        if (preg_match('/<meta[^>]+property=["\']og:title["\'][^>]+content=["\'](.*?)["\']/', $html, $m)) {
            return html_entity_decode(trim($m[1])) ?: null;
        }
        return null;
    }

    private function extractOgImage(string $html): ?string
    {
        // og:image
        if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](https:\/\/play-lh[^"\']+)["\']/', $html, $m)) {
            return $m[1];
        }
        if (preg_match('/content=["\'](https:\/\/play-lh\.googleusercontent\.com[^"\']+)["\'][^>]*property=["\']og:image["\']/', $html, $m)) {
            return $m[1];
        }
        // Any play-lh image
        if (preg_match('/https:\/\/play-lh\.googleusercontent\.com\/[a-zA-Z0-9_\-]+=\w+/', $html, $m)) {
            return $m[0];
        }
        return null;
    }

    private function extractDescription(string $html): ?string
    {
        if (preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']/', $html, $m)) {
            return html_entity_decode(trim($m[1])) ?: null;
        }
        return null;
    }

    private function extractDeveloper(string $html): ?string
    {
        // Look for developer link pattern
        if (preg_match('/href="\/store\/apps\/developer\?id=[^"]+">([^<]+)</', $html, $m)) {
            return html_entity_decode(trim($m[1])) ?: null;
        }
        return null;
    }

    private function extractInstalls(string $html): ?string
    {
        if (preg_match('/(\d[\d,]*\+)\s*(?:downloads|installs)/i', $html, $m)) {
            return $m[1];
        }
        // Pattern like "10,000+" in a structured section
        if (preg_match('/"(\d[\d,.]*[KMB]?\+)"/', $html, $m)) {
            return $m[1];
        }
        return null;
    }

    private function extractRatingFromHtml(string $html): ?float
    {
        if (preg_match('/aria-label="Rated ([0-9.]+) stars/i', $html, $m)) {
            return (float) $m[1];
        }
        if (preg_match('/(\d+\.\d+)\s*(?:star|rating)/i', $html, $m)) {
            return (float) $m[1];
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Blob data extractors
    // ─────────────────────────────────────────────────────────────────────────

    private function extractRating(array $d): ?float
    {
        $r = $this->safeGet($d, [6, 0, 2, 1, 1]);
        return $r ? round((float) $r, 1) : null;
    }

    private function extractScreenshots(array $d): array
    {
        $raw   = $this->safeGet($d, [78]) ?? [];
        $shots = [];

        if (is_array($raw)) {
            foreach (array_slice($raw, 0, 8) as $item) {
                $url = $item[3][2] ?? null;
                if (is_string($url) && str_starts_with($url, 'https')) {
                    $shots[] = $url;
                }
            }
        }

        return $shots;
    }

    private function extractLastUpdated(array $d): ?string
    {
        $raw = $this->safeGet($d, [145, 0, 0]);
        if (! $raw) return null;

        try {
            if (is_numeric($raw)) {
                return date('Y-m-d H:i:s', (int) ($raw / 1000));
            }
            $ts = strtotime((string) $raw);
            return $ts ? date('Y-m-d H:i:s', $ts) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Safely navigate a nested array by path.
     */
    private function safeGet(array $data, array $path): mixed
    {
        $current = $data;
        foreach ($path as $key) {
            if (! is_array($current) || ! array_key_exists($key, $current)) {
                return null;
            }
            $current = $current[$key];
        }
        return $current;
    }
}
