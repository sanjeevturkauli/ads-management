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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    use HasAuditLog, HasEncryption, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'application_id',
        'name',
        'encrypted_key',
        'key_hash',
        'status',
        'last_used_at',
        'last_used_ip',
        'total_requests',
        'expires_at',
        'allowed_ips',
        'allowed_domains',
        'rate_limit',
        'created_by',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
        'allowed_ips' => 'array',
        'allowed_domains' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $encryptable = [
        'encrypted_key',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function apiLogs(): HasMany
    {
        return $this->hasMany(ApiLog::class);
    }

    public static function generate(Application $application, string $name, ?int $expiresDays = null, ?int $userId = null): array
    {
        $plainKey = 'ak_'.Str::random(64);
        $hash = hash('sha256', $plainKey);
        
        $expiresAt = $expiresDays ? now()->addDays($expiresDays) : null;

        $apiKey = self::create([
            'application_id' => $application->id,
            'name' => $name,
            'encrypted_key' => $plainKey,
            'key_hash' => $hash,
            'status' => 'active',
            'expires_at' => $expiresAt,
            'created_by' => $userId,
        ]);

        return [
            'api_key' => $apiKey,
            'plain_key' => $plainKey,
        ];
    }

    public static function findByKey(string $key): ?self
    {
        $hash = hash('sha256', $key);

        return self::where('key_hash', $hash)
            ->where('status', 'active')
            ->first();
    }

    public function isValid(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    public function isIpAllowed(string $ip): bool
    {
        if (empty($this->allowed_ips)) {
            return true;
        }

        return in_array($ip, $this->allowed_ips, true);
    }

    public function recordUsage(string $ip): void
    {
        $this->increment('total_requests');
        $this->update([
            'last_used_at' => now(),
            'last_used_ip' => $ip,
        ]);
    }

    public function revoke(): void
    {
        $this->update(['status' => 'revoked']);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function getMaskedKey(): string
    {
        return 'ak_'.str_repeat('*', 56).substr($this->key_hash, -8);
    }
}
