<?php

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\ApplicationData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApplicationStoreRequest;
use App\Http\Requests\Admin\ApplicationUpdateRequest;
use App\Models\Application;
use App\Services\AdUnitService;
use App\Services\ApplicationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    public function __construct(
        private readonly ApplicationService $applicationService,
        private readonly AdUnitService $adUnitService
    ) {
    }

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'platform']);

        $applications = $this->applicationService->list(10, $filters);
        $statistics = $this->applicationService->getStatistics();

        return Inertia::render('Admin/Applications/Index', [
            'applications' => $applications,
            'statistics' => $statistics,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Applications/Create');
    }

    public function store(ApplicationStoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        $data = ApplicationData::fromRequest($request->validated());

        $application = $this->applicationService->create($data);
        
        // Save application-specific settings
        $settingsToSave = [
            'ads_enabled' => $request->boolean('ads_enabled', true),
            'maintenance_mode' => $request->boolean('maintenance_mode', false),
            'force_update' => $request->boolean('force_update', false),
            'review_dialog_enabled' => $request->boolean('review_dialog_enabled', false),
        ];
        
        foreach ($settingsToSave as $key => $value) {
            $application->settings()->create([
                'key' => $key,
                'value' => $value ? 'true' : 'false',
                'type' => 'boolean',
                'is_encrypted' => false,
                'overrides_global' => true,
            ]);
        }

        // Create default ad units if ad network is provided
        if ($request->has('create_default_ads') && $request->ad_network_id) {
            $this->adUnitService->createDefaultAdUnits($application, $request->ad_network_id);
        }

        return redirect()
            ->route('admin.applications.show', $application)
            ->with('success', 'Application created successfully.');
    }

    public function show(Application $application): Response
    {
        $application->load([
            'creator',
            'updater',
            'adUnits.adNetwork',
            'apiKeys.creator',
            'settings',
            'versions',
            'announcements.creator',
        ]);
        
        // Get boolean settings from app_settings table
        $settingsMap = $application->settings->pluck('value', 'key');
        
        $additionalData = [
            'ads_enabled' => filter_var($settingsMap->get('ads_enabled', 'true'), FILTER_VALIDATE_BOOLEAN),
            'maintenance_mode' => filter_var($settingsMap->get('maintenance_mode', 'false'), FILTER_VALIDATE_BOOLEAN),
            'force_update' => filter_var($settingsMap->get('force_update', 'false'), FILTER_VALIDATE_BOOLEAN),
            'review_dialog_enabled' => filter_var($settingsMap->get('review_dialog_enabled', 'false'), FILTER_VALIDATE_BOOLEAN),
        ];
        
        // Transform ad units to include decrypted ad_unit_id
        $adUnitsData = $application->adUnits->map(function ($adUnit) {
            return [
                'id' => $adUnit->id,
                'ad_type' => $adUnit->ad_type,
                'ad_unit_id' => $adUnit->getDecrypted('encrypted_ad_unit_id'),
                'is_enabled' => $adUnit->is_enabled,
                'frequency' => $adUnit->frequency,
                'ad_network' => [
                    'name' => $adUnit->adNetwork->name,
                    'platform' => $adUnit->adNetwork->provider,
                ],
            ];
        });

        return Inertia::render('Admin/Applications/Show', [
            'application' => array_merge($application->toArray(), $additionalData, [
                'ad_units' => $adUnitsData,
            ]),
        ]);
    }

    public function edit(Application $application): Response
    {
        // Load settings relationship
        $application->load('settings');
        
        // Get boolean settings with proper type casting
        $settingsMap = $application->settings->pluck('value', 'key');
        
        $additionalData = [
            'ads_enabled' => filter_var($settingsMap->get('ads_enabled', 'true'), FILTER_VALIDATE_BOOLEAN),
            'maintenance_mode' => filter_var($settingsMap->get('maintenance_mode', 'false'), FILTER_VALIDATE_BOOLEAN),
            'force_update' => filter_var($settingsMap->get('force_update', 'false'), FILTER_VALIDATE_BOOLEAN),
            'review_dialog_enabled' => filter_var($settingsMap->get('review_dialog_enabled', 'false'), FILTER_VALIDATE_BOOLEAN),
        ];
        
        return Inertia::render('Admin/Applications/Edit', [
            'application' => array_merge($application->toArray(), $additionalData),
        ]);
    }

    public function update(ApplicationUpdateRequest $request, Application $application): \Illuminate\Http\RedirectResponse
    {
        $data = ApplicationData::fromRequest($request->validated());

        $this->applicationService->update($application, $data);
        
        // Update application-specific settings
        $settingsToUpdate = [
            'ads_enabled' => $request->boolean('ads_enabled', true),
            'maintenance_mode' => $request->boolean('maintenance_mode', false),
            'force_update' => $request->boolean('force_update', false),
            'review_dialog_enabled' => $request->boolean('review_dialog_enabled', false),
        ];
        
        foreach ($settingsToUpdate as $key => $value) {
            $application->settings()->updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value ? 'true' : 'false',
                    'type' => 'boolean',
                    'is_encrypted' => false,
                    'overrides_global' => true,
                ]
            );
        }

        return redirect()
            ->route('admin.applications.show', $application)
            ->with('success', 'Application updated successfully.');
    }

    public function destroy(Application $application): \Illuminate\Http\RedirectResponse
    {
        $this->applicationService->delete($application);

        return redirect()
            ->route('admin.applications.index')
            ->with('success', 'Application deleted successfully.');
    }

    public function bulkUpdateStatus(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'application_ids' => ['required', 'array'],
            'application_ids.*' => ['required', 'uuid', 'exists:applications,id'],
            'status' => ['required', 'in:active,inactive,maintenance,archived'],
        ]);

        $count = $this->applicationService->bulkUpdateStatus(
            $validated['application_ids'],
            $validated['status']
        );

        return back()->with('success', "{$count} applications updated successfully.");
    }

    public function bulkDelete(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'application_ids' => ['required', 'array'],
            'application_ids.*' => ['required', 'uuid', 'exists:applications,id'],
        ]);

        $count = $this->applicationService->bulkDelete($validated['application_ids']);

        return back()->with('success', "{$count} applications deleted successfully.");
    }
}
