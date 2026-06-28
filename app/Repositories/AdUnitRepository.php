<?php

namespace App\Repositories;

use App\DataTransferObjects\AdUnitData;
use App\Models\AdUnit;
use Illuminate\Support\Collection;

class AdUnitRepository
{
    public function __construct(
        private readonly AdUnit $model
    ) {
    }

    public function findById(string $id): ?AdUnit
    {
        return $this->model
            ->with(['application', 'adNetwork'])
            ->find($id);
    }

    public function getByApplication(string $applicationId): Collection
    {
        return $this->model
            ->with('adNetwork')
            ->where('application_id', $applicationId)
            ->orderBy('ad_type')
            ->orderBy('priority', 'desc')
            ->get();
    }

    public function getByType(string $applicationId, string $adType): Collection
    {
        return $this->model
            ->with('adNetwork')
            ->where('application_id', $applicationId)
            ->where('ad_type', $adType)
            ->enabled()
            ->orderByPriority()
            ->get();
    }

    public function create(AdUnitData $data): AdUnit
    {
        return $this->model->create($data->toArray());
    }

    public function update(AdUnit $adUnit, AdUnitData $data): AdUnit
    {
        $adUnit->update($data->toArray());

        return $adUnit->fresh();
    }

    public function delete(AdUnit $adUnit): bool
    {
        return $adUnit->delete();
    }

    public function toggle(AdUnit $adUnit): AdUnit
    {
        $adUnit->toggle();

        return $adUnit->fresh();
    }

    public function getEnabledByApplication(string $applicationId): Collection
    {
        return $this->model
            ->with('adNetwork')
            ->where('application_id', $applicationId)
            ->enabled()
            ->orderByPriority()
            ->get();
    }
}
