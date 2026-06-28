<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = $this->createPermissions();

        // Create roles
        $roles = $this->createRoles();

        // Assign permissions to roles
        $this->assignPermissions($roles, $permissions);
    }

    private function createPermissions(): array
    {
        $permissionGroups = [
            'applications' => [
                'applications.view' => 'View applications',
                'applications.create' => 'Create applications',
                'applications.update' => 'Update applications',
                'applications.delete' => 'Delete applications',
                'applications.restore' => 'Restore applications',
            ],
            'ad_units' => [
                'ad_units.view' => 'View ad units',
                'ad_units.create' => 'Create ad units',
                'ad_units.update' => 'Update ad units',
                'ad_units.delete' => 'Delete ad units',
                'ad_units.toggle' => 'Enable/disable ad units',
            ],
            'api_keys' => [
                'api_keys.view' => 'View API keys',
                'api_keys.create' => 'Generate API keys',
                'api_keys.revoke' => 'Revoke API keys',
                'api_keys.delete' => 'Delete API keys',
                'api_keys.view_full' => 'View full API key values',
            ],
            'settings' => [
                'settings.view' => 'View settings',
                'settings.update' => 'Update settings',
                'settings.global' => 'Manage global settings',
            ],
            'audit_logs' => [
                'audit_logs.view' => 'View audit logs',
                'audit_logs.export' => 'Export audit logs',
            ],
            'users' => [
                'users.view' => 'View users',
                'users.create' => 'Create users',
                'users.update' => 'Update users',
                'users.delete' => 'Delete users',
            ],
            'roles' => [
                'roles.view' => 'View roles',
                'roles.create' => 'Create roles',
                'roles.update' => 'Update roles',
                'roles.delete' => 'Delete roles',
            ],
        ];

        $permissions = [];

        foreach ($permissionGroups as $group => $groupPermissions) {
            foreach ($groupPermissions as $name => $displayName) {
                $permissions[$name] = Permission::firstOrCreate(
                    ['name' => $name],
                    ['guard_name' => 'web']
                );
            }
        }

        return $permissions;
    }

    private function createRoles(): array
    {
        $rolesData = [
            'admin' => 'Administrator',
            'manager' => 'Manager',
            'editor' => 'Editor',
            'viewer' => 'Viewer',
        ];

        $roles = [];

        foreach ($rolesData as $name => $displayName) {
            $roles[$name] = Role::firstOrCreate(
                ['name' => $name],
                ['guard_name' => 'web']
            );
        }

        return $roles;
    }

    private function assignPermissions(array $roles, array $permissions): void
    {
        // Admin - All permissions
        $roles['admin']->givePermissionTo(Permission::all());

        // Manager - Application and ad unit management
        $roles['manager']->givePermissionTo([
            'applications.view',
            'applications.create',
            'applications.update',
            'ad_units.view',
            'ad_units.create',
            'ad_units.update',
            'ad_units.toggle',
            'api_keys.view',
            'api_keys.create',
            'settings.view',
        ]);

        // Editor - Edit access only
        $roles['editor']->givePermissionTo([
            'applications.view',
            'applications.update',
            'ad_units.view',
            'ad_units.update',
            'ad_units.toggle',
            'settings.view',
        ]);

        // Viewer - Read-only access
        $roles['viewer']->givePermissionTo([
            'applications.view',
            'ad_units.view',
            'api_keys.view',
            'settings.view',
            'audit_logs.view',
        ]);
    }
}
