<?php

namespace App\Models;

use App\Models\Concerns\HasEncryption;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ConnectedAccount extends Model
{
    use HasEncryption, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'provider',
        'name',
        'encrypted_credentials',
        'account_id',
        'status',
        'last_synced_at',
        'metadata',
    ];

    protected $casts = [
        'last_synced_at' => 'datetime',
        'metadata'       => 'array',
        'created_at'     => 'datetime',
        'updated_at'     => 'datetime',
        'deleted_at'     => 'datetime',
    ];

    protected $encryptable = [
        'encrypted_credentials',
    ];

    // Available providers
    public const PROVIDERS = [
        'google_play_console' => 'Google Play Console',
        'google_ads'          => 'Google Ads',
    ];

    public const STATUS_CONNECTED    = 'connected';
    public const STATUS_DISCONNECTED = 'disconnected';
    public const STATUS_ERROR        = 'error';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getProviderLabelAttribute(): string
    {
        return self::PROVIDERS[$this->provider] ?? ucfirst($this->provider);
    }

    public function isConnected(): bool
    {
        return $this->status === self::STATUS_CONNECTED;
    }

    public function disconnect(): void
    {
        $this->update(['status' => self::STATUS_DISCONNECTED]);
    }

    public function reconnect(): void
    {
        $this->update(['status' => self::STATUS_CONNECTED]);
    }

    public function scopeConnected($query)
    {
        return $query->where('status', self::STATUS_CONNECTED);
    }

    public function scopeProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Safely decode credentials (never return raw encrypted value to frontend).
     */
    public function getCredentialsSummary(): array
    {
        $raw = $this->getDecrypted('encrypted_credentials');

        if (! $raw) {
            return [];
        }

        $data = json_decode($raw, true) ?? [];

        // Mask sensitive fields
        $masked = [];
        foreach ($data as $key => $value) {
            if (is_string($value) && strlen($value) > 8) {
                $masked[$key] = substr($value, 0, 4).str_repeat('*', strlen($value) - 8).substr($value, -4);
            } else {
                $masked[$key] = $value;
            }
        }

        return $masked;
    }
}
