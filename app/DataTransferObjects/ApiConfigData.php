<?php

namespace App\DataTransferObjects;

readonly class ApiConfigData
{
    public function __construct(
        public bool $success,
        public array $data,
        public ?string $message = null,
        public ?array $errors = null,
    ) {
    }

    public function toArray(): array
    {
        return array_filter([
            'success' => $this->success,
            'data' => $this->data,
            'message' => $this->message,
            'errors' => $this->errors,
        ], fn ($value) => $value !== null);
    }

    public static function success(array $data, ?string $message = null): self
    {
        return new self(
            success: true,
            data: $data,
            message: $message,
        );
    }

    public static function error(array $errors, ?string $message = null): self
    {
        return new self(
            success: false,
            data: [],
            message: $message ?? 'An error occurred',
            errors: $errors,
        );
    }

    public static function fromApplication($application, array $settings = []): self
    {
        $adUnits = $application->adUnits()
            ->with('adNetwork')
            ->enabled()
            ->orderByPriority()
            ->get()
            ->groupBy('ad_type');

        $config = [
            'package_name' => $application->package_name,
            'app_name' => $application->name,
            'status' => $application->status,
            'ads_enabled' => $settings['ads_enabled'] ?? true,
            'maintenance' => $application->status === 'maintenance',
            'force_update' => $settings['force_update'] ?? false,
            'current_version' => $application->current_version,
            'minimum_version' => $application->minimum_version,
            'latest_version' => $application->latest_version,
            'ads' => [],
        ];

        // Add ad unit IDs (encrypted)
        foreach ($adUnits as $type => $units) {
            $primaryUnit = $units->first();
            if ($primaryUnit) {
                $config['ads'][$type] = [
                    'enabled' => $primaryUnit->is_enabled,
                    'ad_unit_id' => $primaryUnit->getDecrypted('encrypted_ad_unit_id'),
                    'frequency' => $primaryUnit->frequency,
                    'refresh_interval' => $primaryUnit->refresh_interval,
                    'network' => $primaryUnit->adNetwork->provider ?? 'admob',
                ];
            }
        }

        // Add specific ad type settings
        $config['banner_enabled'] = isset($config['ads']['banner']);
        $config['interstitial_enabled'] = isset($config['ads']['interstitial']);
        $config['rewarded_enabled'] = isset($config['ads']['rewarded']);
        $config['native_enabled'] = isset($config['ads']['native']);
        $config['app_open_enabled'] = isset($config['ads']['app_open']);

        // Extract IDs for backward compatibility
        $config['banner_id'] = $config['ads']['banner']['ad_unit_id'] ?? null;
        $config['interstitial_id'] = $config['ads']['interstitial']['ad_unit_id'] ?? null;
        $config['rewarded_id'] = $config['ads']['rewarded']['ad_unit_id'] ?? null;
        $config['native_id'] = $config['ads']['native']['ad_unit_id'] ?? null;
        $config['app_open_id'] = $config['ads']['app_open']['ad_unit_id'] ?? null;

        // Add interstitial frequency
        $config['interstitial_interval'] = $config['ads']['interstitial']['frequency'] ?? 3;

        // Add review dialog settings
        $config['review_dialog'] = [
            'enabled' => $settings['review_dialog_enabled'] ?? false,
            'interval_days' => $settings['review_dialog_interval'] ?? 7,
        ];

        return self::success($config);
    }
}
