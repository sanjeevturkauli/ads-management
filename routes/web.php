<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Root route shows login page directly (no redirect)
Route::get('/', function () {
    if (auth()->check()) {
        return redirect('/admin/dashboard');
    }
    
    // Show login page directly on root
    return Inertia::render('auth/login', [
        'canResetPassword' => Features::enabled(Features::resetPasswords()),
        'status' => session('status'),
    ]);
})->middleware('guest')->name('home');

// Include admin routes
require __DIR__.'/admin.php';

// Include settings routes
require __DIR__.'/settings.php';
