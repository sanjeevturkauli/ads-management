<?php

namespace App\Models;

use App\Models\Concerns\HasEncryption;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppSetting extends Model
{
    use HasEncryption, HasFactory, HasUuids;

    protected $fillable = [
        'application_id',
        'key',
        'value',
        'type',
        'is_encrypted',
        'overrides_global',
    ];

    protected $casts = [
        'is_encrypted' => 'boolean',
        'overrides_global' => 'boolean',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function getValue()
    {
        if ($this->is_encrypted) {
            return $this->getDecrypted('value');
        }

        return match ($this->type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $this->value,
            'float' => (float) $this->value,
            'json' => json_decode($this->value, true),
            default => $this->value,
        };
    }
}
