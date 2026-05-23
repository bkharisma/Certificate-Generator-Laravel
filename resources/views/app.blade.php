<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ \App\Models\Setting::get('app_name', config('app.name')) }}</title>

        @php $favicon = \App\Models\Setting::get('favicon'); @endphp
        @if($favicon && \Illuminate\Support\Facades\Storage::disk('public')->exists($favicon))
            <link rel="icon" type="{{ str_ends_with($favicon, '.svg') ? 'image/svg+xml' : 'image/png' }}" href="/storage/{{ $favicon }}?v={{ time() }}">
        @else
            <link rel="icon" href="/favicon.ico">
        @endif

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
