<?php

namespace App\Console\Commands;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MarkInactiveRespondersOffline extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'responders:mark-inactive-offline';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark responders as offline if they haven\'t been active for 5 minutes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Find responders who are on duty but haven't been active for 5 minutes
        $inactiveThreshold = Carbon::now()->subMinutes(5);

        $inactiveResponders = User::where('role', 'responder')
            ->where('is_on_duty', true)
            ->where(function ($query) use ($inactiveThreshold) {
                $query->whereNull('last_active_at')
                    ->orWhere('last_active_at', '<', $inactiveThreshold);
            })
            ->get();

        $count = 0;

        foreach ($inactiveResponders as $responder) {
            $responder->update([
                'is_on_duty' => false,
                'responder_status' => 'offline',
                'duty_ended_at' => now(),
            ]);

            Log::info('[SCHEDULER] 🔴 Marked inactive responder as offline', [
                'responder_id' => $responder->id,
                'responder_name' => $responder->name,
                'last_active_at' => $responder->last_active_at?->toIso8601String(),
                'inactive_for_minutes' => $responder->last_active_at
                    ? $responder->last_active_at->diffInMinutes(now())
                    : 'never',
            ]);

            $count++;
        }

        $this->info("Marked {$count} inactive responders as offline");

        Log::info('[SCHEDULER] ✅ Inactive responder cleanup completed', [
            'responders_marked_offline' => $count,
        ]);

        return Command::SUCCESS;
    }
}
