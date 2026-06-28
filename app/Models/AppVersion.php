<?php

namespace App\Models;

use App\Models\Concerns\HasAuditLog;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AppVersion extends Model
{
    use HasAuditLog, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'application_id',
        'version',
        'version_code',
        'platform',
        'is_forced',
        'is_latest',
        'release_notes',
        'download_url',
        'released_at',
        'created_by',
    ];

    protected $casts = [
        'is_forced' => 'boolean',
        'is_latest' => 'boolean',
        'released_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeLatest($query)
    {
        return $query->where('is_latest', true);
    }

    public function scopePlatform($query, string $platform)
    {
        return $query->where('platform', $platform);
    }

    public function markAsLatest(): void
    {
        // Remove latest flag from other versions
        self::where('application_id', $this->application_id)
            ->where('platform', $this->platform)
            ->where('id', '!=', $this->id)
            ->update(['is_latest' => false]);

        $this->update(['is_latest' => true]);
    }
}
