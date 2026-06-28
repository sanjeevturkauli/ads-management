<?php

namespace App\Repositories;

use App\Models\ApiKey;
use App\Models\Application;
use Illuminate\Support\Collection;

class ApiKeyRepository
{
    public function __construct(
        private readonly ApiKey $model
    ) {
    }

    public function findById(string $id): ?ApiKey
    {
        return $this->model
            ->with(['application', 'creator'])
            ->find($id);
    }

    public function findByKey(string $key): ?ApiKey
    {
        return $this->model->findByKey($key);
    }

    public function getByApplication(string $applicationId): Collection
    {
        return $this->model
            ->where('application_id', $applicationId)
            ->with('creator')
            ->latest()
            ->get();
    }

    public function generate(Application $application, string $name, ?int $expiresDays = null, ?int $userId = null): array
    {
        return $this->model::generate($application, $name, $expiresDays, $userId);
    }

    public function revoke(ApiKey $apiKey): ApiKey
    {
        $apiKey->revoke();

        return $apiKey->fresh();
    }

    public function delete(ApiKey $apiKey): bool
    {
        return $apiKey->delete();
    }

    public function updateUsage(ApiKey $apiKey, string $ip): void
    {
        $apiKey->recordUsage($ip);
    }

    public function getActive(): Collection
    {
        return $this->model
            ->active()
            ->with('application')
            ->get();
    }
}
