<?php

namespace App\Models;

use App\Models\Concerns\HasAuditLog;
use App\Models\Concerns\HasEncryption;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Application extends Model
{
    use HasAuditLog, HasEncryption, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'package_name',
        'platform',
        'icon',
        'description',
        'current_version',
        'minimum_version',
        'latest_version',
        'status',
        'encrypted_api_key',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $encryptable = [
        'encrypted_api_key',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function adUnits(): HasMany
    {
        return $this->hasMany(AdUnit::class);
    }

    public function apiKeys(): HasMany
    {
        return $this->hasMany(ApiKey::class);
    }

    public function settings(): HasMany
    {
        return $this->hasMany(AppSetting::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(AppVersion::class);
    }

    public function apiLogs(): HasMany
    {
        return $this->hasMany(ApiLog::class);
    }

    public function getSetting(string $key, $default = null)
    {
        $setting = $this->settings()->where('key', $key)->first();

        if (! $setting || ! $setting->overrides_global) {
            return GlobalSetting::get($key, $default);
        }

        return $setting->getValue();
    }

    public function setSetting(string $key, $value, string $type = 'string', bool $isEncrypted = false): void
    {
        $this->settings()->updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'type' => $type,
                'is_encrypted' => $isEncrypted,
            ]
        );
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isInMaintenance(): bool
    {
        return $this->status === 'maintenance';
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePlatform($query, string $platform)
    {
        return $query->where('platform', $platform);
    }

    public function getMaskedApiKey(): string
    {
        $decrypted = $this->getDecrypted('encrypted_api_key');

        if (! $decrypted) {
            return '********';
        }

        return substr($decrypted, 0, 8).'********'.substr($decrypted, -4);
    }
}
