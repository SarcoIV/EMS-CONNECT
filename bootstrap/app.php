<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LogCallRequests;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Add call request logging middleware globally
        $middleware->append(LogCallRequests::class);

        // Register middleware aliases for API routes
        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'role' => CheckRole::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule) {
        // Mark responders as offline if inactive for 5+ minutes
        $schedule->command('responders:mark-inactive-offline')
            ->everyFiveMinutes()
            ->withoutOverlapping()
            ->runInBackground();

        // Delete messages older than 30 days (daily at 2 AM)
        $schedule->command('messages:delete-old')
            ->dailyAt('02:00')
            ->withoutOverlapping()
            ->runInBackground();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
