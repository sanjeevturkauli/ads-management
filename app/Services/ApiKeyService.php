<?php

namespace App\Services;

use App\Models\ApiKey;
use App\Models\Application;
use App\Repositories\ApiKeyRepository;
use Illuminate\Support\Collection;

class ApiKeyService
{
    public function __construct(
        private readonly ApiKeyRepository $repository
    ) {
    }

    public function findById(string $id): ?ApiKey
    {
        return $this->repository->findById($id);
    }

    public function findByKey(string $key): ?ApiKey
    {
        return $this->repository->findByKey($key);
    }

    public function getByApplication(string $applicationId): Collection
    {
        return $this->repository->getByApplication($applicationId);
    }

    public function generate(Application $application, string $name, ?int $expiresDays = null, ?int $userId = null): array
    {
        return $this->repository->generate($application, $name, $expiresDays, $userId ?? auth()->id());
    }

    public function revoke(ApiKey $apiKey): ApiKey
    {
        return $this->repository->revoke($apiKey);
    }

    public function delete(ApiKey $apiKey): bool
    {
        return $this->repository->delete($apiKey);
    }

    public function validateKey(string $key, string $ip): ?ApiKey
    {
        $apiKey = $this->repository->findByKey($key);

        if (! $apiKey || ! $apiKey->isValid()) {
            return null;
        }

        if (! $apiKey->isIpAllowed($ip)) {
            return null;
        }

        // Update usage statistics
        $this->repository->updateUsage($apiKey, $ip);

        return $apiKey;
    }

    public function checkRateLimit(ApiKey $apiKey): bool
    {
        // Check if the API key has exceeded rate limit
        $key = "rate_limit:{$apiKey->id}";
        $requests = cache()->get($key, 0);

        if ($requests >= $apiKey->rate_limit) {
            return false;
        }

        cache()->put($key, $requests + 1, now()->addHour());

        return true;
    }
}
