<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApplicationStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('applications.create') || $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'package_name' => ['required', 'string', 'max:255', 'unique:applications,package_name'],
            'platform' => ['required', Rule::in(['android', 'ios', 'both'])],
            'icon' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'current_version' => ['required', 'string', 'max:50'],
            'minimum_version' => ['required', 'string', 'max:50'],
            'latest_version' => ['required', 'string', 'max:50'],
            'status' => ['required', Rule::in(['active', 'inactive', 'maintenance', 'archived'])],
            'create_default_ads' => ['nullable', 'boolean'],
            'ad_network_id' => ['nullable', 'uuid', 'exists:ad_networks,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'package_name.unique' => 'An application with this package name already exists.',
            'package_name.required' => 'The package name is required.',
        ];
    }
}
