<?php

namespace App\Events;

use App\Models\Dispatch;
use App\Models\PreArrivalForm;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PreArrivalFormSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $dispatch;

    public $preArrival;

    /**
     * Create a new event instance.
     */
    public function __construct(Dispatch $dispatch, PreArrivalForm $preArrival)
    {
        $this->dispatch = $dispatch;
        $this->preArrival = $preArrival;
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
     */
    public function broadcastWith(): array
    {
        return [
            'dispatch_id' => $this->dispatch->id,
            'incident_id' => $this->dispatch->incident_id,
            'responder_id' => $this->dispatch->responder_id,
            'responder_name' => $this->dispatch->responder->name,
            'pre_arrival' => [
                'id' => $this->preArrival->id,
                'caller_name' => $this->preArrival->caller_name,
                'patient_name' => $this->preArrival->patient_name,
                'sex' => $this->preArrival->sex,
                'age' => $this->preArrival->age,
                'incident_type' => $this->preArrival->incident_type,
                'estimated_arrival' => $this->preArrival->estimated_arrival?->toIso8601String(),
                'submitted_at' => $this->preArrival->submitted_at?->toIso8601String(),
            ],
        ];
    }
}
