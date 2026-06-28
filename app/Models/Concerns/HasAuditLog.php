<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasAuditLog
{
    /**
     * Boot the trait.
     */
    protected static function bootHasAuditLog(): void
    {
        static::created(function ($model) {
            $model->logAudit('create', $model->getDirty());
        });

        static::updated(function ($model) {
            if ($model->wasChanged() && ! empty($model->getChanges())) {
                $model->logAudit('update', $model->getOriginal(), $model->getChanges());
            }
        });

        static::deleted(function ($model) {
            $model->logAudit('delete', $model->getOriginal());
        });
    }

    /**
     * Get all audit logs for the model.
     */
    public function auditLogs(): MorphMany
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }

    /**
     * Log an audit event.
     */
    protected function logAudit(string $action, ?array $oldValues = null, ?array $newValues = null): void
    {
        // Don't log if in testing environment (unless explicitly enabled)
        if (app()->environment('testing') && ! config('audit.log_in_testing', false)) {
            return;
        }

        // Filter out sensitive attributes
        $oldValues = $this->filterSensitiveData($oldValues ?? []);
        $newValues = $this->filterSensitiveData($newValues ?? []);

        // Remove unchanged values from update logs
        if ($action === 'update') {
            $newValues = array_filter($newValues, function ($value, $key) use ($oldValues) {
                return ! isset($oldValues[$key]) || $oldValues[$key] !== $value;
            }, ARRAY_FILTER_USE_BOTH);

            // Don't log if nothing actually changed
            if (empty($newValues)) {
                return;
            }
        }

        AuditLog::log(
            action: $action,
            module: $this->getAuditModule(),
            auditable: $this,
            oldValues: $oldValues,
            newValues: $newValues,
            description: $this->getAuditDescription($action)
        );
    }

    /**
     * Get the module name for audit logging.
     */
    protected function getAuditModule(): string
    {
        return property_exists($this, 'auditModule')
            ? $this->auditModule
            : class_basename($this);
    }

    /**
     * Get audit description.
     */
    protected function getAuditDescription(string $action): string
    {
        $module = $this->getAuditModule();
        $identifier = $this->getAuditIdentifier();

        return match ($action) {
            'create' => "Created {$module}: {$identifier}",
            'update' => "Updated {$module}: {$identifier}",
            'delete' => "Deleted {$module}: {$identifier}",
            default => "{$action} {$module}: {$identifier}",
        };
    }

    /**
     * Get a human-readable identifier for audit logs.
     */
    protected function getAuditIdentifier(): string
    {
        if (method_exists($this, 'getAuditName')) {
            return $this->getAuditName();
        }

        // Try common name attributes
        foreach (['name', 'title', 'display_name', 'label'] as $attr) {
            if (isset($this->$attr)) {
                return (string) $this->$attr;
            }
        }

        // Fall back to primary key
        return (string) $this->getKey();
    }

    /**
     * Filter out sensitive data from audit logs.
     */
    protected function filterSensitiveData(array $data): array
    {
        $sensitiveAttributes = property_exists($this, 'auditExclude')
            ? $this->auditExclude
            : ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];

        // Also exclude encrypted attributes - keep them as "***encrypted***"
        if (property_exists($this, 'encryptable')) {
            foreach ($this->encryptable as $attr) {
                if (isset($data[$attr])) {
                    $data[$attr] = '***encrypted***';
                }
            }
        }

        // Remove sensitive attributes entirely
        return array_diff_key($data, array_flip($sensitiveAttributes));
    }
}
