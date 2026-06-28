<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApplicationUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('applications.update') || $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        $applicationId = $this->route('application')->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'package_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('applications', 'package_name')->ignore($applicationId),
            ],
            'platform' => ['required', Rule::in(['android', 'ios', 'both'])],
            'icon' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'current_version' => ['required', 'string', 'max:50'],
            'minimum_version' => ['required', 'string', 'max:50'],
            'latest_version' => ['required', 'string', 'max:50'],
            'status' => ['required', Rule::in(['active', 'inactive', 'maintenance', 'archived'])],
        ];
    }
}
