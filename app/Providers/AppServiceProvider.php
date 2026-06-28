<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register repositories
        $this->app->singleton(\App\Repositories\ApplicationRepository::class);
        $this->app->singleton(\App\Repositories\AdUnitRepository::class);
        $this->app->singleton(\App\Repositories\ApiKeyRepository::class);
        $this->app->singleton(\App\Repositories\AuditLogRepository::class);

        // Register services
        $this->app->singleton(\App\Services\ApplicationService::class);
        $this->app->singleton(\App\Services\AdUnitService::class);
        $this->app->singleton(\App\Services\ApiKeyService::class);
        $this->app->singleton(\App\Services\ConfigService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
