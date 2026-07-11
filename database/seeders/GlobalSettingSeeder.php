<?php

namespace Database\Seeders;

use App\Models\GlobalSetting;
use Illuminate\Database\Seeder;

class GlobalSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // General Settings
            [
                'key' => 'app_name',
                'value' => 'Ads Management System',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Application name',
                'is_public' => true,
            ],
            [
                'key' => 'ads_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'ads',
                'description' => 'Global ads enable/disable',
                'is_public' => true,
            ],
            [
                'key' => 'maintenance_mode',
                'value' => 'false',
                'type' => 'boolean',
                'group' => 'general',
                'description' => 'Global maintenance mode',
                'is_public' => true,
            ],
            [
                'key' => 'force_update',
                'value' => 'false',
                'type' => 'boolean',
                'group' => 'updates',
                'description' => 'Force update for all apps',
                'is_public' => true,
            ],

            // Ad Settings
            [
                'key' => 'banner_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'ads',
                'description' => 'Enable banner ads globally',
                'is_public' => true,
            ],
            [
                'key' => 'interstitial_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'ads',
                'description' => 'Enable interstitial ads globally',
                'is_public' => true,
            ],
            [
                'key' => 'rewarded_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'ads',
                'description' => 'Enable rewarded ads globally',
                'is_public' => true,
            ],
            [
                'key' => 'native_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'ads',
                'description' => 'Enable native ads globally',
                'is_public' => true,
            ],
            [
                'key' => 'app_open_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'ads',
                'description' => 'Enable app open ads globally',
                'is_public' => true,
            ],
            [
                'key' => 'interstitial_interval',
                'value' => '3',
                'type' => 'integer',
                'group' => 'ads',
                'description' => 'Default interstitial ad frequency',
                'is_public' => true,
            ],
            [
                'key' => 'global_ads_mode',
                'value' => 'false',
                'type' => 'boolean',
                'group' => 'ads',
                'description' => 'Enable test ads mode globally (true = test ads, false = real ads)',
                'is_public' => true,
            ],
            
            // Test Ad Unit IDs (used when global_ads_mode is true)
            [
                'key' => 'test_banner_id',
                'value' => 'ca-app-pub-3940256099942544/6300978111',
                'type' => 'string',
                'group' => 'ads',
                'description' => 'Test ad unit ID for banner ads',
                'is_public' => true,
            ],
            [
                'key' => 'test_interstitial_id',
                'value' => 'ca-app-pub-3940256099942544/1033173712',
                'type' => 'string',
                'group' => 'ads',
                'description' => 'Test ad unit ID for interstitial ads',
                'is_public' => true,
            ],
            [
                'key' => 'test_rewarded_id',
                'value' => 'ca-app-pub-3940256099942544/5224354917',
                'type' => 'string',
                'group' => 'ads',
                'description' => 'Test ad unit ID for rewarded ads',
                'is_public' => true,
            ],
            [
                'key' => 'test_native_id',
                'value' => 'ca-app-pub-3940256099942544/2247696110',
                'type' => 'string',
                'group' => 'ads',
                'description' => 'Test ad unit ID for native advanced ads',
                'is_public' => true,
            ],
            [
                'key' => 'test_app_open_id',
                'value' => 'ca-app-pub-3940256099942544/9257395921',
                'type' => 'string',
                'group' => 'ads',
                'description' => 'Test ad unit ID for app open ads',
                'is_public' => true,
            ],

            // Review Dialog
            [
                'key' => 'review_dialog_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'reviews',
                'description' => 'Enable review dialog',
                'is_public' => true,
            ],
            [
                'key' => 'review_dialog_interval',
                'value' => '7',
                'type' => 'integer',
                'group' => 'reviews',
                'description' => 'Days between review prompts',
                'is_public' => true,
            ],

            // API Settings
            [
                'key' => 'api_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'api',
                'description' => 'Enable API access',
                'is_public' => false,
            ],
            [
                'key' => 'api_rate_limit',
                'value' => '1000',
                'type' => 'integer',
                'group' => 'api',
                'description' => 'API rate limit per hour',
                'is_public' => false,
            ],
        ];

        foreach ($settings as $setting) {
            GlobalSetting::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
