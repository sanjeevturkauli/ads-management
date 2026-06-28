<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdUnitUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('ad_units.update') || $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'ad_network_id' => ['required', 'uuid', 'exists:ad_networks,id'],
            'ad_type' => ['required', Rule::in([
                'banner',
                'interstitial',
                'rewarded',
                'rewarded_interstitial',
                'native',
                'app_open',
            ])],
            'encrypted_ad_unit_id' => ['required', 'string', 'max:500'],
            'is_enabled' => ['boolean'],
            'frequency' => ['integer', 'min:1', 'max:100'],
            'refresh_interval' => ['integer', 'min:1', 'max:3600'],
            'priority' => ['integer', 'min:1', 'max:100'],
            'daily_cap' => ['nullable', 'integer', 'min:1'],
            'hourly_cap' => ['nullable', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
