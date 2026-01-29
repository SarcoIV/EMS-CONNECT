<?php

namespace App\Events;

use App\Models\Dispatch;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PreArrivalFormSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $dispatch;

    public $preArrivalForms;

    /**
     * Create a new event instance.
     */
    public function __construct(Dispatch $dispatch, Collection $preArrivalForms)
    {
        $this->dispatch = $dispatch;
        $this->preArrivalForms = $preArrivalForms;
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
            'patient_count' => $this->preArrivalForms->count(),
            'patients' => $this->preArrivalForms->map(function ($form) {
                return [
                    'id' => $form->id,
                    'caller_name' => $form->caller_name,
                    'patient_name' => $form->patient_name,
                    'sex' => $form->sex,
                    'age' => $form->age,
                    'incident_type' => $form->incident_type,
                    'estimated_arrival' => $form->estimated_arrival?->toIso8601String(),
                    'submitted_at' => $form->submitted_at?->toIso8601String(),
                ];
            })->toArray(),
        ];
    }
}
