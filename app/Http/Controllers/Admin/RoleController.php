<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): Response
    {
        $roles = Role::withCount('users', 'permissions')
            ->with('permissions:id,name')
            ->paginate(10);

        $permissions = Permission::orderBy('name')->get()->groupBy(function ($permission) {
            // Group permissions by prefix (e.g., "applications" from "applications.view")
            $parts = explode('.', $permission->name);
            return \count($parts) > 1 ? $parts[0] : 'general';
        });

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $role = Role::create(['name' => $validated['name']]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return back()->with('success', 'Role created successfully.');
    }

    public function update(Request $request, Role $role): \Illuminate\Http\RedirectResponse
    {
        // Prevent editing default roles
        if (\in_array($role->name, ['admin', 'manager', 'editor', 'viewer'])) {
            return back()->withErrors(['error' => 'Cannot edit default system roles.']);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', "unique:roles,name,{$role->id}"],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $role->update(['name' => $validated['name']]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role): \Illuminate\Http\RedirectResponse
    {
        // Prevent deleting default roles
        if (\in_array($role->name, ['admin', 'manager', 'editor', 'viewer'])) {
            return back()->withErrors(['error' => 'Cannot delete default system roles.']);
        }

        if ($role->users()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete role with assigned users.']);
        }

        $role->delete();

        return back()->with('success', 'Role deleted successfully.');
    }

    public function syncPermissions(Request $request, Role $role): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $role->syncPermissions($validated['permissions']);

        return back()->with('success', 'Permissions updated successfully.');
    }
}
