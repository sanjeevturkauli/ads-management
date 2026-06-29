// Simple route helper function
// Maps Laravel route names to actual URLs

const routes: Record<string, string> = {
    'admin.dashboard': '/admin/dashboard',
    
    // Global Settings
    'admin.settings.index': '/admin/settings',
    'admin.settings.store': '/admin/settings',
    'admin.settings.update': '/admin/settings/update',
    'admin.settings.destroy': '/admin/settings/:id',
    
    // Audit Logs
    'admin.audit-logs.index': '/admin/audit-logs',
    
    // Roles & Permissions
    'admin.roles.index': '/admin/roles',
    'admin.roles.store': '/admin/roles',
    'admin.roles.update': '/admin/roles/:id',
    'admin.roles.destroy': '/admin/roles/:id',
    'admin.roles.sync-permissions': '/admin/roles/:id/permissions',
    
    // Analytics
    'admin.analytics.index': '/admin/analytics',
    
    // API Documentation
    'admin.api-documentation.index': '/admin/api-documentation',
    
    // System Info
    'admin.system-info.index': '/admin/system-info',
    
    // Ad Networks
    'admin.ad-networks.index': '/admin/ad-networks',
    'admin.ad-networks.create': '/admin/ad-networks/create',
    'admin.ad-networks.store': '/admin/ad-networks',
    'admin.ad-networks.edit': '/admin/ad-networks/:id/edit',
    'admin.ad-networks.update': '/admin/ad-networks/:id',
    'admin.ad-networks.destroy': '/admin/ad-networks/:id',
    'admin.ad-networks.toggle': '/admin/ad-networks/:id/toggle',
    
    // Applications
    'admin.applications.index': '/admin/applications',
    'admin.applications.create': '/admin/applications/create',
    'admin.applications.store': '/admin/applications',
    'admin.applications.show': '/admin/applications/:id',
    'admin.applications.edit': '/admin/applications/:id/edit',
    'admin.applications.update': '/admin/applications/:id',
    'admin.applications.destroy': '/admin/applications/:id',
    'admin.applications.bulk-status': '/admin/applications/bulk-status',
    'admin.applications.bulk-delete': '/admin/applications/bulk-delete',
    
    // Ad Units
    'admin.applications.ad-units.index': '/admin/applications/:application/ad-units',
    'admin.applications.ad-units.store': '/admin/applications/:application/ad-units',
    'admin.applications.ad-units.update': '/admin/applications/:application/ad-units/:adUnit',
    'admin.applications.ad-units.destroy': '/admin/applications/:application/ad-units/:adUnit',
    'admin.applications.ad-units.toggle': '/admin/applications/:application/ad-units/:adUnit/toggle',
    'admin.applications.ad-units.bulk-toggle': '/admin/applications/:application/ad-units/bulk-toggle',
    
    // Connected Accounts
    'admin.accounts.index': '/admin/accounts',
    'admin.accounts.store': '/admin/accounts',
    'admin.accounts.update': '/admin/accounts/:id',
    'admin.accounts.destroy': '/admin/accounts/:id',
    'admin.accounts.toggle': '/admin/accounts/:id/toggle',
    'admin.accounts.play-console.sync': '/admin/accounts/:id/play-console/sync',
    'admin.accounts.play-console.import': '/admin/accounts/:id/play-console/import',
    'admin.accounts.play-console.test': '/admin/accounts/:id/play-console/test',

    // API Keys
    'admin.applications.api-keys.index': '/admin/applications/:application/api-keys',
    'admin.applications.api-keys.store': '/admin/applications/:application/api-keys',
    'admin.applications.api-keys.destroy': '/admin/applications/:application/api-keys/:apiKey',
    'admin.applications.api-keys.revoke': '/admin/applications/:application/api-keys/:apiKey/revoke',
};

export function route(name: string, params?: any): string {
    let url = routes[name] || name;
    
    // Replace route parameters
    if (params) {
        if (Array.isArray(params)) {
            // Array of parameters - replace in order
            params.forEach((param, index) => {
                url = url.replace(/:[a-zA-Z]+/, param);
            });
        } else if (typeof params === 'object') {
            // Object with named parameters
            Object.keys(params).forEach(key => {
                url = url.replace(`:${key}`, params[key]);
            });
        } else {
            // Single parameter - replace first placeholder
            url = url.replace(/:[a-zA-Z]+/, params);
        }
    }
    
    return url;
}

// Make route available globally
if (typeof window !== 'undefined') {
    (window as any).route = route;
}
