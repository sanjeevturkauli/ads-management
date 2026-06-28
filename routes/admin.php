<?php

use App\Http\Controllers\Admin\AdUnitController;
use App\Http\Controllers\Admin\ApiKeyController;
use App\Http\Controllers\Admin\ApplicationController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\GlobalSettingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| All admin panel routes are defined here. These routes are protected
| by authentication and role-based access control middleware.
|
*/

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Global Settings
    Route::get('settings', [GlobalSettingController::class, 'index'])->name('settings.index');
    Route::post('settings', [GlobalSettingController::class, 'store'])->name('settings.store');
    Route::post('settings/update', [GlobalSettingController::class, 'update'])->name('settings.update');
    Route::delete('settings/{globalSetting}', [GlobalSettingController::class, 'destroy'])->name('settings.destroy');

    // Audit Logs
    Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

    // Roles & Permissions
    Route::resource('roles', \App\Http\Controllers\Admin\RoleController::class)
        ->except(['show', 'create', 'edit']);
    
    Route::post('roles/{role}/permissions', [\App\Http\Controllers\Admin\RoleController::class, 'syncPermissions'])
        ->name('roles.sync-permissions');

    // Analytics
    Route::get('analytics', [\App\Http\Controllers\Admin\AnalyticsController::class, 'index'])->name('analytics.index');

    // API Documentation
    Route::get('api-documentation', [\App\Http\Controllers\Admin\ApiDocumentationController::class, 'index'])->name('api-documentation.index');

    // System Info
    Route::get('system-info', [\App\Http\Controllers\Admin\SystemInfoController::class, 'index'])->name('system-info.index');

    // Ad Networks Management
    Route::resource('ad-networks', \App\Http\Controllers\Admin\AdNetworkController::class)
        ->except(['show']);
    
    Route::post('ad-networks/{adNetwork}/toggle', [\App\Http\Controllers\Admin\AdNetworkController::class, 'toggle'])
        ->name('ad-networks.toggle');

    // Applications Management
    Route::resource('applications', ApplicationController::class);
    
    Route::post('applications/bulk-status', [ApplicationController::class, 'bulkUpdateStatus'])
        ->name('applications.bulk-status');
    
    Route::post('applications/bulk-delete', [ApplicationController::class, 'bulkDelete'])
        ->name('applications.bulk-delete');

    // Ad Units Management (nested under applications)
    Route::prefix('applications/{application}')->group(function () {
        
        // Ad Units
        Route::resource('ad-units', AdUnitController::class)
            ->except(['show'])
            ->names([
                'index' => 'applications.ad-units.index',
                'create' => 'applications.ad-units.create',
                'store' => 'applications.ad-units.store',
                'edit' => 'applications.ad-units.edit',
                'update' => 'applications.ad-units.update',
                'destroy' => 'applications.ad-units.destroy',
            ]);

        Route::post('ad-units/{adUnit}/toggle', [AdUnitController::class, 'toggle'])
            ->name('applications.ad-units.toggle');
            
        Route::post('ad-units/bulk-toggle', [AdUnitController::class, 'bulkToggle'])
            ->name('applications.ad-units.bulk-toggle');

        // API Keys Management
        Route::resource('api-keys', ApiKeyController::class)
            ->only(['index', 'store', 'destroy'])
            ->names([
                'index' => 'applications.api-keys.index',
                'store' => 'applications.api-keys.store',
                'destroy' => 'applications.api-keys.destroy',
            ]);

        Route::post('api-keys/{apiKey}/revoke', [ApiKeyController::class, 'revoke'])
            ->name('applications.api-keys.revoke');
    });
});
