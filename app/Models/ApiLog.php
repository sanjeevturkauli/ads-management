<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'api_key_id',
        'application_id',
        'endpoint',
        'method',
        'ip_address',
        'user_agent',
        'response_code',
        'response_time',
        'request_headers',
        'request_body',
        'response_body',
        'error_message',
    ];

    protected $casts = [
        'request_headers' => 'array',
        'request_body' => 'array',
        'response_body' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function apiKey(): BelongsTo
    {
        return $this->belongsTo(ApiKey::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function scopeSuccessful($query)
    {
        return $query->whereBetween('response_code', [200, 299]);
    }

    public function scopeFailed($query)
    {
        return $query->where('response_code', '>=', 400);
    }

    public function scopeEndpoint($query, string $endpoint)
    {
        return $query->where('endpoint', $endpoint);
    }
}
