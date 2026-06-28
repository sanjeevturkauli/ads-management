<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdNetwork;
use Illuminate\Http\Request;
use Inertia\Response;

class AdNetworkController extends Controller
{
    public function index(): Response
    {
        $adNetworks = AdNetwork::withCount('adUnits')
            ->orderBy('priority', 'desc')
            ->orderBy('name')
            ->paginate(10);

        return inertia('Admin/AdNetworks/Index', [
            'adNetworks' => $adNetworks,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:ad_networks,slug'],
            'provider' => ['required', 'string', 'in:admob,facebook,unity,applovin,ironsource,custom'],
            'is_active' => ['boolean'],
            'priority' => ['integer', 'min:1', 'max:100'],
            'configuration' => ['nullable', 'array'],
        ]);

        AdNetwork::create($validated);

        return back()->with('success', 'Ad network created successfully.');
    }

    public function update(Request $request, AdNetwork $adNetwork)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:ad_networks,slug,' . $adNetwork->id],
            'provider' => ['required', 'string', 'in:admob,facebook,unity,applovin,ironsource,custom'],
            'is_active' => ['boolean'],
            'priority' => ['integer', 'min:1', 'max:100'],
            'configuration' => ['nullable', 'array'],
        ]);

        $adNetwork->update($validated);

        return back()->with('success', 'Ad network updated successfully.');
    }

    public function destroy(AdNetwork $adNetwork)
    {
        if ($adNetwork->adUnits()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete ad network with active ad units.']);
        }

        $adNetwork->delete();

        return back()->with('success', 'Ad network deleted successfully.');
    }

    public function toggle(AdNetwork $adNetwork)
    {
        $adNetwork->update(['is_active' => !$adNetwork->is_active]);

        return back()->with('success', 'Ad network status updated successfully.');
    }
}
