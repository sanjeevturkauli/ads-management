<?php

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\AdUnitData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdUnitStoreRequest;
use App\Http\Requests\Admin\AdUnitUpdateRequest;
use App\Models\AdUnit;
use App\Models\Application;
use App\Services\AdUnitService;
use Illuminate\Http\Request;
use Inertia\Response;

class AdUnitController extends Controller
{
    public function __construct(
        private readonly AdUnitService $adUnitService
    ) {
    }

    public function index(Application $application): Response
    {
        $application->load('adUnits.adNetwork');
        $adNetworks = \App\Models\AdNetwork::active()->orderBy('name')->get();

        // Map ad units with decrypted ad_unit_id
        $adUnits = $application->adUnits->map(function ($adUnit) {
            return [
                'id' => $adUnit->id,
                'ad_type' => $adUnit->ad_type,
                'ad_unit_id' => $adUnit->getDecrypted('encrypted_ad_unit_id'),
                'is_enabled' => $adUnit->is_enabled,
                'frequency' => $adUnit->frequency,
                'priority' => $adUnit->priority,
                'description' => $adUnit->description,
                'ad_network' => [
                    'id' => $adUnit->adNetwork->id,
                    'name' => $adUnit->adNetwork->name,
                    'provider' => $adUnit->adNetwork->provider,
                ],
            ];
        });

        return inertia('Admin/AdUnits/Index', [
            'application' => $application,
            'adUnits' => $adUnits,
            'adNetworks' => $adNetworks,
        ]);
    }

    public function store(AdUnitStoreRequest $request, Application $application): \Illuminate\Http\RedirectResponse
    {
        $data = AdUnitData::fromRequest([
            ...$request->validated(),
            'application_id' => $application->id,
        ]);

        $this->adUnitService->create($data);

        return back()->with('success', 'Ad unit created successfully.');
    }

    public function update(AdUnitUpdateRequest $request, Application $application, AdUnit $adUnit): \Illuminate\Http\RedirectResponse
    {
        $data = AdUnitData::fromRequest([
            ...$request->validated(),
            'application_id' => $application->id,
        ]);

        $this->adUnitService->update($adUnit, $data);

        return back()->with('success', 'Ad unit updated successfully.');
    }

    public function destroy(Application $application, AdUnit $adUnit): \Illuminate\Http\RedirectResponse
    {
        $this->adUnitService->delete($adUnit);

        return back()->with('success', 'Ad unit deleted successfully.');
    }

    public function toggle(Application $application, AdUnit $adUnit): \Illuminate\Http\RedirectResponse
    {
        $this->adUnitService->toggle($adUnit);

        $status = $adUnit->fresh()->is_enabled ? 'enabled' : 'disabled';

        return back()->with('success', "Ad unit {$status} successfully.");
    }

    public function bulkToggle(Request $request, Application $application): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'ad_unit_ids' => ['required', 'array'],
            'ad_unit_ids.*' => ['required', 'uuid', 'exists:ad_units,id'],
            'enabled' => ['required', 'boolean'],
        ]);

        $count = $this->adUnitService->bulkToggle(
            $validated['ad_unit_ids'],
            $validated['enabled']
        );

        $status = $validated['enabled'] ? 'enabled' : 'disabled';

        return back()->with('success', "{$count} ad units {$status} successfully.");
    }
}
