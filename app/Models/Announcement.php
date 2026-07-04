<?php

namespace App\Models;

use App\Models\Concerns\HasAuditLog;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use HasAuditLog, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'application_id',
        'message',
        'start_date',
        'end_date',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
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

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCurrent($query)
    {
        $today = today();
        return $query->where('start_date', '<=', $today)
                     ->where('end_date', '>=', $today);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isCurrent(): bool
    {
        $today = today();
        return $this->start_date <= $today && $this->end_date >= $today;
    }

    public function isValid(): bool
    {
        return $this->isActive() && $this->isCurrent();
    }
}
