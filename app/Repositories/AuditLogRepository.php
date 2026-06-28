<?php

namespace App\Repositories;

use App\Models\AuditLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class AuditLogRepository
{
    public function __construct(
        private readonly AuditLog $model
    ) {
    }

    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator
    {
        return $this->query($filters)
            ->with('user:id,name,email')
            ->latest()
            ->paginate($perPage);
    }

    public function getByModule(string $module, int $perPage = 50): LengthAwarePaginator
    {
        return $this->model
            ->module($module)
            ->with('user:id,name,email')
            ->latest()
            ->paginate($perPage);
    }

    public function getByUser(int $userId, int $perPage = 50): LengthAwarePaginator
    {
        return $this->model
            ->user($userId)
            ->with('user:id,name,email')
            ->latest()
            ->paginate($perPage);
    }

    public function getByAuditable(string $type, string $id): LengthAwarePaginator
    {
        return $this->model
            ->where('auditable_type', $type)
            ->where('auditable_id', $id)
            ->with('user:id,name,email')
            ->latest()
            ->paginate(50);
    }

    protected function query(array $filters = []): Builder
    {
        $query = $this->model->newQuery();

        if (! empty($filters['module'])) {
            $query->module($filters['module']);
        }

        if (! empty($filters['action'])) {
            $query->action($filters['action']);
        }

        if (! empty($filters['user_id'])) {
            $query->user($filters['user_id']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('description', 'like', "%{$filters['search']}%")
                    ->orWhere('module', 'like', "%{$filters['search']}%")
                    ->orWhere('action', 'like', "%{$filters['search']}%");
            });
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query;
    }
}
