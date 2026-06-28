<?php

namespace App\Models;

use App\Models\Concerns\HasAuditLog;
use App\Models\Concerns\HasEncryption;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AdUnit extends Model
{
    use HasAuditLog, HasEncryption, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'application_id',
        'ad_network_id',
        'ad_type',
        'encrypted_ad_unit_id',
        'is_enabled',
        'frequency',
        'refresh_interval',
        'priority',
        'daily_cap',
        'hourly_cap',
        'description',
        'metadata',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $encryptable = [
        'encrypted_ad_unit_id',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function adNetwork(): BelongsTo
    {
        return $this->belongsTo(AdNetwork::class);
    }

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    public function scopeAdType($query, string $type)
    {
        return $query->where('ad_type', $type);
    }

    public function scopeOrderByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }

    public function getMaskedAdUnitId(): string
    {
        $decrypted = $this->getDecrypted('encrypted_ad_unit_id');

        if (! $decrypted) {
            return '********';
        }

        $length = strlen($decrypted);
        $visibleChars = min(8, (int) ($length * 0.2));

        return substr($decrypted, 0, $visibleChars).str_repeat('*', $length - $visibleChars * 2).substr($decrypted, -$visibleChars);
    }

    public function toggle(): void
    {
        $this->update(['is_enabled' => ! $this->is_enabled]);
    }
}
