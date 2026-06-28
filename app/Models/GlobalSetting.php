<?php

namespace App\Models;

use App\Models\Concerns\HasEncryption;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class GlobalSetting extends Model
{
    use HasEncryption, HasFactory, HasUuids;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description',
        'is_encrypted',
        'is_public',
    ];

    protected $casts = [
        'is_encrypted' => 'boolean',
        'is_public' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saved(function () {
            Cache::forget('global_settings');
        });

        static::deleted(function () {
            Cache::forget('global_settings');
        });
    }

    public static function get(string $key, $default = null)
    {
        $settings = Cache::rememberForever('global_settings', function () {
            return self::all()->mapWithKeys(function ($setting) {
                return [$setting->key => [
                    'value' => $setting->getValue(),
                    'type' => $setting->type,
                    'is_public' => $setting->is_public,
                ]];
            })->toArray();
        });

        if (! isset($settings[$key])) {
            return $default;
        }

        return $settings[$key]['value'];
    }

    public static function set(string $key, $value, string $type = 'string', bool $isEncrypted = false): void
    {
        self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'type' => $type,
                'is_encrypted' => $isEncrypted,
            ]
        );
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

    public function scopeGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }
}
