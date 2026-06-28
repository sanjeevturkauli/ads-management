<?php

namespace Database\Seeders;

use App\Models\AdNetwork;
use Illuminate\Database\Seeder;

class AdNetworkSeeder extends Seeder
{
    public function run(): void
    {
        $networks = [
            [
                'name' => 'Google AdMob',
                'slug' => 'admob',
                'provider' => 'admob',
                'is_active' => true,
                'priority' => 1,
                'configuration' => [
                    'app_id_prefix' => 'ca-app-pub-',
                    'ad_unit_prefix' => 'ca-app-pub-',
                ],
            ],
            [
                'name' => 'Meta Audience Network',
                'slug' => 'facebook',
                'provider' => 'facebook',
                'is_active' => true,
                'priority' => 2,
                'configuration' => [
                    'app_id_required' => true,
                ],
            ],
            [
                'name' => 'Unity Ads',
                'slug' => 'unity',
                'provider' => 'unity',
                'is_active' => true,
                'priority' => 3,
                'configuration' => [
                    'game_id_required' => true,
                ],
            ],
            [
                'name' => 'AppLovin',
                'slug' => 'applovin',
                'provider' => 'applovin',
                'is_active' => true,
                'priority' => 4,
                'configuration' => [
                    'sdk_key_required' => true,
                ],
            ],
            [
                'name' => 'ironSource',
                'slug' => 'ironsource',
                'provider' => 'ironsource',
                'is_active' => false,
                'priority' => 5,
                'configuration' => [
                    'app_key_required' => true,
                ],
            ],
        ];

        foreach ($networks as $network) {
            AdNetwork::firstOrCreate(
                ['slug' => $network['slug']],
                $network
            );
        }
    }
}
