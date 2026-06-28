<?php

namespace App\Services;

use App\DataTransferObjects\ApiConfigData;
use App\Models\Application;
use App\Models\GlobalSetting;
use Illuminate\Support\Facades\Cache;

class ConfigService
{
    public function __construct(
        private readonly ApplicationService $applicationService
    ) {
    }

    public function getApplicationConfig(string $packageName): ApiConfigData
    {
        $application = $this->applicationService->findByPackageName($packageName);

        if (! $application) {
            return ApiConfigData::error(
                errors: ['application' => 'Application not found'],
                message: 'The requested application does not exist'
            );
        }

        // Get application-specific settings or fallback to global
        $settings = [
            'ads_enabled' => $application->getSetting('ads_enabled', GlobalSetting::get('ads_enabled', true)),
            'force_update' => $application->getSetting('force_update', false),
            'review_dialog_enabled' => $application->getSetting('review_dialog_enabled', false),
            'review_dialog_interval' => $application->getSetting('review_dialog_interval', 7),
        ];

        return ApiConfigData::fromApplication($application, $settings);
    }

    public function refreshGlobalSettings(): void
    {
        Cache::forget('global_settings');
        GlobalSetting::all(); // This will re-cache the settings
    }

    public function setGlobalSetting(string $key, $value, string $type = 'string', bool $isEncrypted = false): void
    {
        GlobalSetting::set($key, $value, $type, $isEncrypted);
        $this->refreshGlobalSettings();
    }

    public function getGlobalSettings(string $group = null): array
    {
        $query = GlobalSetting::query();

        if ($group) {
            $query->group($group);
        }

        return $query->get()->mapWithKeys(function ($setting) {
            return [$setting->key => $setting->getValue()];
        })->toArray();
    }

    public function getPublicSettings(): array
    {
        return GlobalSetting::public()
            ->get()
            ->mapWithKeys(function ($setting) {
                return [$setting->key => $setting->getValue()];
            })
            ->toArray();
    }
}
