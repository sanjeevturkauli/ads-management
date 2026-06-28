<?php

namespace App\Services;

use App\DataTransferObjects\ApplicationData;
use App\Models\Application;
use App\Repositories\ApplicationRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApplicationService
{
    public function __construct(
        private readonly ApplicationRepository $repository
    ) {
    }

    public function list(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate($perPage, $filters);
    }

    public function findById(string $id): ?Application
    {
        return $this->repository->findById($id);
    }

    public function findByPackageName(string $packageName): ?Application
    {
        return $this->repository->findByPackageName($packageName);
    }

    public function create(ApplicationData $data): Application
    {
        return DB::transaction(function () use ($data) {
            // Generate API key
            $apiKey = Str::random(64);

            $applicationData = new ApplicationData(
                name: $data->name,
                package_name: $data->package_name,
                platform: $data->platform,
                icon: $data->icon,
                description: $data->description,
                current_version: $data->current_version,
                minimum_version: $data->minimum_version,
                latest_version: $data->latest_version,
                status: $data->status,
                encrypted_api_key: $apiKey,
                created_by: $data->created_by ?? auth()->id(),
                updated_by: $data->updated_by ?? auth()->id(),
            );

            return $this->repository->create($applicationData);
        });
    }

    public function update(Application $application, ApplicationData $data): Application
    {
        return DB::transaction(function () use ($application, $data) {
            $updateData = new ApplicationData(
                name: $data->name,
                package_name: $data->package_name,
                platform: $data->platform,
                icon: $data->icon ?? $application->icon,
                description: $data->description,
                current_version: $data->current_version,
                minimum_version: $data->minimum_version,
                latest_version: $data->latest_version,
                status: $data->status,
                encrypted_api_key: $data->encrypted_api_key ?? $application->encrypted_api_key,
                created_by: $application->created_by,
                updated_by: auth()->id(),
            );

            return $this->repository->update($application, $updateData);
        });
    }

    public function delete(Application $application): bool
    {
        return $this->repository->delete($application);
    }

    public function restore(string $id): bool
    {
        return $this->repository->restore($id);
    }

    public function updateStatus(Application $application, string $status): Application
    {
        $data = ApplicationData::fromRequest([
            ...$application->toArray(),
            'status' => $status,
        ]);

        return $this->update($application, $data);
    }

    public function bulkUpdateStatus(array $applicationIds, string $status): int
    {
        return DB::transaction(function () use ($applicationIds, $status) {
            $updated = 0;
            foreach ($applicationIds as $id) {
                $application = $this->repository->findById($id);
                if ($application) {
                    $this->updateStatus($application, $status);
                    $updated++;
                }
            }

            return $updated;
        });
    }

    public function bulkDelete(array $applicationIds): int
    {
        return DB::transaction(function () use ($applicationIds) {
            $deleted = 0;
            foreach ($applicationIds as $id) {
                $application = $this->repository->findById($id);
                if ($application) {
                    $this->delete($application);
                    $deleted++;
                }
            }

            return $deleted;
        });
    }

    public function getStatistics(): array
    {
        return $this->repository->getStatistics();
    }

    public function getActive(): Collection
    {
        return $this->repository->getActive();
    }

    public function duplicateApplication(Application $application, string $newPackageName, string $newName): Application
    {
        return DB::transaction(function () use ($application, $newPackageName, $newName) {
            // Create new application
            $data = ApplicationData::fromRequest([
                'name' => $newName,
                'package_name' => $newPackageName,
                'platform' => $application->platform,
                'description' => $application->description,
                'current_version' => $application->current_version,
                'minimum_version' => $application->minimum_version,
                'latest_version' => $application->latest_version,
                'status' => 'inactive', // Start as inactive
            ]);

            $newApplication = $this->create($data);

            // Copy settings
            foreach ($application->settings as $setting) {
                $newApplication->settings()->create([
                    'key' => $setting->key,
                    'value' => $setting->value,
                    'type' => $setting->type,
                    'is_encrypted' => $setting->is_encrypted,
                    'overrides_global' => $setting->overrides_global,
                ]);
            }

            return $newApplication;
        });
    }
}
