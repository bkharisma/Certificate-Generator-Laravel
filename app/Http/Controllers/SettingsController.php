<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Settings/Index', [
            'settings' => [
                'app_name' => Setting::get('app_name', config('app.name')),
                'app_logo' => Setting::get('app_logo'),
                'favicon' => Setting::get('favicon'),
                'mail_mailer' => Setting::get('mail_mailer', 'smtp'),
                'mail_host' => Setting::get('mail_host', 'smtp.gmail.com'),
                'mail_port' => Setting::get('mail_port', '587'),
                'mail_encryption' => Setting::get('mail_encryption', 'tls'),
                'mail_username' => Setting::get('mail_username'),
                'mail_password' => Setting::get('mail_password'),
                'mail_from_address' => Setting::get('mail_from_address'),
                'mail_from_name' => Setting::get('mail_from_name', config('app.name')),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'app_name' => ['required', 'string', 'max:255'],
            'mail_mailer' => ['nullable', 'string', 'in:smtp,sendmail,log'],
            'mail_host' => ['nullable', 'string', 'max:255'],
            'mail_port' => ['nullable', 'numeric', 'min:1', 'max:65535'],
            'mail_encryption' => ['nullable', 'string', 'in:tls,ssl,none'],
            'mail_username' => ['nullable', 'string', 'max:255'],
            'mail_password' => ['nullable', 'string', 'max:255'],
            'mail_from_address' => ['nullable', 'email', 'max:255'],
            'mail_from_name' => ['nullable', 'string', 'max:255'],
        ]);

        Setting::set('app_name', $request->app_name);

        if ($request->hasFile('app_logo')) {
            $request->validate([
                'app_logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:2048'],
            ]);

            $old = Setting::get('app_logo');
            if ($old) {
                Storage::disk('public')->delete($old);
            }

            $path = $request->file('app_logo')->store('settings', 'public');
            Setting::set('app_logo', $path);
        }

        if ($request->hasFile('favicon')) {
            $request->validate([
                'favicon' => ['nullable', 'mimes:png,svg', 'max:1024'],
            ]);

            $old = Setting::get('favicon');
            if ($old) {
                Storage::disk('public')->delete($old);
            }

            $path = $request->file('favicon')->store('settings', 'public');
            Setting::set('favicon', $path);
        }

        Setting::set('mail_mailer', $request->mail_mailer ?? 'smtp');
        Setting::set('mail_host', $request->mail_host);
        Setting::set('mail_port', $request->mail_port);
        Setting::set('mail_encryption', $request->mail_encryption ?? 'tls');
        Setting::set('mail_username', $request->mail_username);
        Setting::set('mail_password', $request->mail_password);
        Setting::set('mail_from_address', $request->mail_from_address);
        Setting::set('mail_from_name', $request->mail_from_name);

        return redirect()->route('settings.index')
            ->with('success', 'Settings updated successfully.');
    }

    public function testMail(Request $request): JsonResponse
    {
        $request->validate([
            'test_email' => ['required', 'email'],
        ]);

        $mailer = Setting::get('mail_mailer', 'smtp');
        if ($mailer === 'log') {
            return response()->json(['error' => 'Mail mailer is set to "log". Configure SMTP first.'], 422);
        }

        try {
            Mail::raw('This is a test email from ' . config('app.name'), function ($message) use ($request) {
                $fromName = Setting::get('mail_from_name', config('app.name'));
                $fromAddress = Setting::get('mail_from_address', config('mail.from.address'));
                $message->to($request->test_email)
                    ->from($fromAddress, $fromName)
                    ->subject('Test Email from ' . $fromName);
            });

            return response()->json(['success' => true, 'message' => 'Test email sent successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }
}
