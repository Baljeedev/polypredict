<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Schema::defaultStringLength(191);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function ($user, string $token) {
            $front = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');
            return $front.'/reset-password/?token='.urlencode($token).'&email='.urlencode($user->getEmailForPasswordReset());
        });
    }
}
