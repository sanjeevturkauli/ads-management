<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConnectedAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    /**
     * Display the accounts overview page.
     */
    public function index(): Response
    {
        $accounts = ConnectedAccount::with('user')
            ->orderBy('provider')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($account) => [
                'id'             => $account->id,
                'provider'       => $account->provider,
                'provider_label' => $account->provider_label,
                'name'           => $account->name,
                'account_id'     => $account->account_id,
                'status'         => $account->status,
                'last_synced_at' => $account->last_synced_at?->toISOString(),
                'created_at'     => $account->created_at->toISOString(),
                'user'           => [
                    'id'   => $account->user->id,
                    'name' => $account->user->name,
                ],
            ]);

        $statistics = [
            'total'              => $accounts->count(),
            'connected'          => $accounts->where('status', 'connected')->count(),
            'disconnected'       => $accounts->where('status', 'disconnected')->count(),
            'error'              => $accounts->where('status', 'error')->count(),
            'google_play'        => $accounts->where('provider', 'google_play_console')->count(),
            'google_ads'         => $accounts->where('provider', 'google_ads')->count(),
        ];

        return Inertia::render('Admin/Accounts/Index', [
            'accounts'   => $accounts,
            'statistics' => $statistics,
            'providers'  => ConnectedAccount::PROVIDERS,
        ]);
    }

    /**
     * Store a new connected account.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'provider'    => ['required', 'string', 'in:'.implode(',', array_keys(ConnectedAccount::PROVIDERS))],
            'name'        => ['required', 'string', 'max:255'],
            'account_id'  => ['nullable', 'string', 'max:255'],
            'credentials' => ['required', 'array'],
        ]);

        // Provider-specific credential validation
        $this->validateProviderCredentials($validated['provider'], $validated['credentials']);

        ConnectedAccount::create([
            'user_id'               => $request->user()->id,
            'provider'              => $validated['provider'],
            'name'                  => $validated['name'],
            'account_id'            => $validated['account_id'] ?? null,
            'encrypted_credentials' => json_encode($validated['credentials']),
            'status'                => ConnectedAccount::STATUS_CONNECTED,
            'last_synced_at'        => now(),
        ]);

        return back()->with('success', 'Account connected successfully.');
    }

    /**
     * Update an existing connected account.
     */
    public function update(Request $request, ConnectedAccount $account): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'account_id'  => ['nullable', 'string', 'max:255'],
            'credentials' => ['nullable', 'array'],
        ]);

        $updateData = [
            'name'       => $validated['name'],
            'account_id' => $validated['account_id'] ?? $account->account_id,
        ];

        if (! empty($validated['credentials'])) {
            $this->validateProviderCredentials($account->provider, $validated['credentials']);
            $updateData['encrypted_credentials'] = json_encode($validated['credentials']);
        }

        $account->update($updateData);

        return back()->with('success', 'Account updated successfully.');
    }

    /**
     * Toggle account connection status.
     */
    public function toggleStatus(ConnectedAccount $account): RedirectResponse
    {
        if ($account->isConnected()) {
            $account->disconnect();
            $message = 'Account disconnected.';
        } else {
            $account->reconnect();
            $message = 'Account reconnected.';
        }

        return back()->with('success', $message);
    }

    /**
     * Delete a connected account.
     */
    public function destroy(ConnectedAccount $account): RedirectResponse
    {
        $account->delete();

        return back()->with('success', 'Account removed successfully.');
    }

    /**
     * Validate provider-specific credential fields.
     */
    private function validateProviderCredentials(string $provider, array $credentials): void
    {
        $rules = match ($provider) {
            'google_play_console' => [
                'service_account_email' => ['required', 'string', 'email'],
                'private_key'           => ['required', 'string'],
                'project_id'            => ['required', 'string'],
                'package_names'         => ['nullable', 'string'],
            ],
            'google_ads' => [
                'developer_token'   => ['required', 'string'],
                'client_id'         => ['required', 'string'],
                'client_secret'     => ['required', 'string'],
                'refresh_token'     => ['required', 'string'],
                'manager_id'        => ['nullable', 'string'],
            ],
            default => [],
        };

        if (! empty($rules)) {
            validator($credentials, $rules)->validate();
        }
    }
}
