<?php

namespace App\Services;

use App\DataTransferObjects\AdUnitData;
use App\Models\AdUnit;
use App\Models\Application;
use App\Repositories\AdUnitRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AdUnitService
{
    public function __construct(
        private readonly AdUnitRepository $repository
    ) {
    }

    public function findById(string $id): ?AdUnit
    {
        return $this->repository->findById($id);
    }

    public function getByApplication(string $applicationId): Collection
    {
        return $this->repository->getByApplication($applicationId);
    }

    public function getByType(string $applicationId, string $adType): Collection
    {
        return $this->repository->getByType($applicationId, $adType);
    }

    public function create(AdUnitData $data): AdUnit
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->create($data);
        });
    }

    public function update(AdUnit $adUnit, AdUnitData $data): AdUnit
    {
        return DB::transaction(function () use ($adUnit, $data) {
            return $this->repository->update($adUnit, $data);
        });
    }

    public function delete(AdUnit $adUnit): bool
    {
        return $this->repository->delete($adUnit);
    }

    public function toggle(AdUnit $adUnit): AdUnit
    {
        return DB::transaction(function () use ($adUnit) {
            return $this->repository->toggle($adUnit);
        });
    }

    public function bulkToggle(array $adUnitIds, bool $enabled): int
    {
        return DB::transaction(function () use ($adUnitIds, $enabled) {
            $updated = 0;
            foreach ($adUnitIds as $id) {
                $adUnit = $this->repository->findById($id);
                if ($adUnit) {
                    $adUnit->update(['is_enabled' => $enabled]);
                    $updated++;
                }
            }

            return $updated;
        });
    }

    public function createDefaultAdUnits(Application $application, string $adNetworkId): void
    {
        DB::transaction(function () use ($application, $adNetworkId) {
            $adTypes = [
                'banner' => ['frequency' => 1, 'priority' => 1],
                'interstitial' => ['frequency' => 3, 'priority' => 2],
                'rewarded' => ['frequency' => 1, 'priority' => 3],
                'native' => ['frequency' => 1, 'priority' => 1],
                'app_open' => ['frequency' => 1, 'priority' => 5],
            ];

            foreach ($adTypes as $type => $config) {
                $data = new AdUnitData(
                    application_id: $application->id,
                    ad_network_id: $adNetworkId,
                    ad_type: $type,
                    encrypted_ad_unit_id: 'PLACEHOLDER_'.$type.'_ID',
                    is_enabled: false, // Disabled by default
                    frequency: $config['frequency'],
                    priority: $config['priority'],
                );

                $this->repository->create($data);
            }
        });
    }

    public function getEnabledByApplication(string $applicationId): Collection
    {
        return $this->repository->getEnabledByApplication($applicationId);
    }
}
