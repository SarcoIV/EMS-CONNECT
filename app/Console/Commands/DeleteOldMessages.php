<?php

namespace App\Console\Commands;

use App\Models\Message;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DeleteOldMessages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'messages:delete-old {--days=30 : Number of days to retain messages}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete soft-deleted messages older than specified days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        $threshold = Carbon::now()->subDays($days);

        $this->info("Deleting messages soft-deleted before {$threshold->toDateTimeString()}...");

        $oldMessages = Message::onlyTrashed()
            ->where('deleted_at', '<', $threshold)
            ->get();

        $count = 0;
        $imagesDeleted = 0;

        foreach ($oldMessages as $message) {
            if ($message->image_path && Storage::disk('public')->exists($message->image_path)) {
                Storage::disk('public')->delete($message->image_path);
                $imagesDeleted++;
            }
            $message->forceDelete();
            $count++;
        }

        $this->info("Deleted {$count} messages and {$imagesDeleted} images");

        Log::info('[SCHEDULER] 🗑️ Old messages cleanup completed', [
            'messages_deleted' => $count,
            'images_deleted' => $imagesDeleted,
            'threshold_date' => $threshold->toIso8601String(),
        ]);

        return Command::SUCCESS;
    }
}
