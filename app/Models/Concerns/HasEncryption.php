<?php

namespace App\Models\Concerns;

use Illuminate\Support\Facades\Crypt;

trait HasEncryption
{
    /**
     * Boot the trait.
     */
    protected static function bootHasEncryption(): void
    {
        static::saving(function ($model) {
            $model->encryptAttributes();
        });

        static::retrieved(function ($model) {
            // Attributes are decrypted on-demand via accessor
        });
    }

    /**
     * Encrypt attributes before saving.
     */
    protected function encryptAttributes(): void
    {
        if (! property_exists($this, 'encryptable')) {
            return;
        }

        foreach ($this->encryptable as $attribute) {
            if (isset($this->attributes[$attribute]) && ! empty($this->attributes[$attribute])) {
                $value = $this->attributes[$attribute];

                // Don't re-encrypt already encrypted values
                if (! $this->isEncrypted($value)) {
                    $this->attributes[$attribute] = Crypt::encryptString($value);
                }
            }
        }
    }

    /**
     * Get decrypted attribute value.
     */
    public function getDecrypted(string $attribute): ?string
    {
        if (! isset($this->attributes[$attribute]) || empty($this->attributes[$attribute])) {
            return null;
        }

        try {
            return Crypt::decryptString($this->attributes[$attribute]);
        } catch (\Exception $e) {
            return $this->attributes[$attribute];
        }
    }

    /**
     * Set encrypted attribute value.
     */
    public function setEncrypted(string $attribute, ?string $value): void
    {
        if ($value === null) {
            $this->attributes[$attribute] = null;

            return;
        }

        $this->attributes[$attribute] = Crypt::encryptString($value);
    }

    /**
     * Check if a value appears to be encrypted.
     */
    protected function isEncrypted(string $value): bool
    {
        try {
            Crypt::decryptString($value);

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get masked version of encrypted attribute.
     */
    public function getMasked(string $attribute, int $visibleStart = 4, int $visibleEnd = 4): string
    {
        $value = $this->getDecrypted($attribute);

        if (! $value) {
            return str_repeat('*', 12);
        }

        $length = strlen($value);

        if ($length <= ($visibleStart + $visibleEnd)) {
            return str_repeat('*', $length);
        }

        return substr($value, 0, $visibleStart).
            str_repeat('*', $length - $visibleStart - $visibleEnd).
            substr($value, -$visibleEnd);
    }
}
