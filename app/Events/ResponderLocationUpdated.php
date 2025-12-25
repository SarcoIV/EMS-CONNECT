<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ResponderLocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $responder;

    /**
     * Create a new event instance.
     */
    public function __construct(User $responder)
    {
        $this->responder = $responder;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('admin-dashboard'),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'responder_id' => $this->responder->id,
            'name' => $this->responder->name,
            'latitude' => (float) $this->responder->current_latitude,
            'longitude' => (float) $this->responder->current_longitude,
            'status' => $this->responder->responder_status,
            'is_on_duty' => $this->responder->is_on_duty,
            'updated_at' => $this->responder->location_updated_at?->toIso8601String(),
        ];
    }
}
