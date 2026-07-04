<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Process queued jobs — runs every minute via cron
// This ensures sync jobs execute even without a persistent queue worker
Schedule::command('queue:work --stop-when-empty --tries=3 --timeout=60')
    ->everyMinute()
    ->withoutOverlapping(5)
    ->runInBackground();
