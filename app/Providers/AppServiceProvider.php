<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $mailer = Setting::get('mail_mailer');
        if ($mailer) {
            Config::set('mail.default', $mailer);
        }

        $host = Setting::get('mail_host');
        $port = Setting::get('mail_port');
        $encryption = Setting::get('mail_encryption');
        $username = Setting::get('mail_username');
        $password = Setting::get('mail_password');

        if ($host || $port || $username || $password) {
            Config::set('mail.mailers.smtp', [
                'transport' => 'smtp',
                'host' => $host ?: config('mail.mailers.smtp.host'),
                'port' => $port ?: config('mail.mailers.smtp.port'),
                'encryption' => $encryption === 'none' ? null : ($encryption ?: config('mail.mailers.smtp.encryption')),
                'username' => $username ?: config('mail.mailers.smtp.username'),
                'password' => $password ?: config('mail.mailers.smtp.password'),
                'timeout' => null,
                'local_domain' => config('mail.mailers.smtp.local_domain'),
            ]);
        }

        $fromAddress = Setting::get('mail_from_address');
        $fromName = Setting::get('mail_from_name');
        if ($fromAddress || $fromName) {
            Config::set('mail.from', [
                'address' => $fromAddress ?: config('mail.from.address'),
                'name' => $fromName ?: config('mail.from.name'),
            ]);
        }
    }
}
