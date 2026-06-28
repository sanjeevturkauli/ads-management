<?php

namespace App\Repositories;

use App\DataTransferObjects\ApplicationData;
use App\Models\Application;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ApplicationRepository
{
    public function __construct(
        private readonly Application $model
    ) {
    }

    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->query($filters)
            ->with(['creator', 'adUnits', 'apiKeys'])
            ->withCount(['adUnits', 'apiKeys'])
            ->latest()
            ->paginate($perPage);
    }

    public function findByPackageName(string $packageName): ?Application
    {
        return $this->model
            ->with(['adUnits.adNetwork', 'settings'])
            ->where('package_name', $packageName)
            ->first();
    }

    public function findById(string $id): ?Application
    {
        return $this->model
            ->with(['creator', 'updater', 'adUnits', 'apiKeys', 'settings', 'versions'])
            ->find($id);
    }

    public function create(ApplicationData $data): Application
    {
        return $this->model->create($data->toArray());
    }

    public function update(Application $application, ApplicationData $data): Application
    {
        $application->update($data->toArray());

        return $application->fresh();
    }

    public function delete(Application $application): bool
    {
        return $application->delete();
    }

    public function restore(string $id): bool
    {
        $application = $this->model->withTrashed()->find($id);

        return $application?->restore() ?? false;
    }

    public function all(array $filters = []): Collection
    {
        return $this->query($filters)->get();
    }

    public function getActive(): Collection
    {
        return $this->model
            ->active()
            ->orderBy('name')
            ->get();
    }

    public function getStatistics(): array
    {
        return [
            'total' => $this->model->count(),
            'active' => $this->model->where('status', 'active')->count(),
            'inactive' => $this->model->where('status', 'inactive')->count(),
            'maintenance' => $this->model->where('status', 'maintenance')->count(),
            'archived' => $this->model->where('status', 'archived')->count(),
            'android' => $this->model->whereIn('platform', ['android', 'both'])->count(),
            'ios' => $this->model->whereIn('platform', ['ios', 'both'])->count(),
            'with_ads' => $this->model->has('adUnits')->count(),
        ];
    }

    protected function query(array $filters = []): Builder
    {
        $query = $this->model->newQuery();

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                    ->orWhere('package_name', 'like', "%{$filters['search']}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['platform'])) {
            $query->where('platform', $filters['platform']);
        }

        if (! empty($filters['created_by'])) {
            $query->where('created_by', $filters['created_by']);
        }

        return $query;
    }
}
