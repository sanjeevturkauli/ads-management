<?php

use App\Http\Controllers\Api\ConfigController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public health check (no authentication required)
Route::get('/health', [ConfigController::class, 'health'])->name('api.health');

// Public API - Get application details by package name (no authentication required)
Route::get('/v1/app/{packageName}', [ConfigController::class, 'getPublicAppDetails'])->name('api.app.details');

// API routes with key authentication
Route::middleware(['api.key', 'api.log'])->prefix('v1')->group(function () {
    // Get application configuration
    Route::get('/config/{packageName}', [ConfigController::class, 'getConfig'])->name('api.config.get');

    // Alternative config endpoint (uses authenticated application)
    Route::get('/config', [ConfigController::class, 'show'])->name('api.config.show');
});
