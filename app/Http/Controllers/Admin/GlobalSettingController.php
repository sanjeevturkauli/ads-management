<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GlobalSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GlobalSettingController extends Controller
{
    public function index(): Response
    {
        $settings = GlobalSetting::orderBy('group')
            ->orderBy('key')
            ->get()
            ->groupBy('group');

        return Inertia::render('Admin/GlobalSettings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable'],
            'settings.*.type' => ['required', 'string', 'in:string,boolean,integer,float,json'],
        ]);

        foreach ($validated['settings'] as $settingData) {
            GlobalSetting::set(
                $settingData['key'],
                $settingData['value'],
                $settingData['type']
            );
        }

        return back()->with('success', 'Settings updated successfully.');
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:255', 'unique:global_settings,key'],
            'value' => ['required'],
            'type' => ['required', 'string', 'in:string,boolean,integer,float,json'],
            'group' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_encrypted' => ['boolean'],
            'is_public' => ['boolean'],
        ]);

        GlobalSetting::create($validated);

        return back()->with('success', 'Setting created successfully.');
    }

    public function destroy(GlobalSetting $globalSetting): \Illuminate\Http\RedirectResponse
    {
        $globalSetting->delete();

        return back()->with('success', 'Setting deleted successfully.');
    }
}
