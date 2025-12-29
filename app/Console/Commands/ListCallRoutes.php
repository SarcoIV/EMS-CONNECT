<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

class ListCallRoutes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'routes:call-list';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all call-related routes for debugging';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $routes = collect(Route::getRoutes())->filter(function ($route) {
            return str_contains($route->uri(), 'call');
        });

        if ($routes->isEmpty()) {
            $this->warn('No call-related routes found!');

            return 1;
        }

        $this->info('Call-related routes:');
        $this->newLine();

        foreach ($routes as $route) {
            $this->line(sprintf(
                '%s %s -> %s',
                str_pad($route->methods()[0], 8),
                str_pad($route->uri(), 35),
                $route->getActionName()
            ));
        }

        $this->newLine();
        $this->info("Total: {$routes->count()} route(s) found");

        return 0;
    }
}
