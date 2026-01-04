<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class IncidentOverviewController extends Controller
{
    /**
     * Display comprehensive incident overview for monitoring.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function show(Request $request, $id)
    {
        $user = Auth::user();

        // Fetch incident with comprehensive eager loading
        $incident = Incident::with([
            'user:id,name,email,phone_number',
            'assignedAdmin:id,name,email',
            'dispatches' => function ($query) {
                $query->orderBy('assigned_at', 'asc');
            },
            'dispatches.responder:id,name,email,phone_number,responder_status,current_latitude,current_longitude,location_updated_at',
            'dispatches.preArrivalForm',
            'dispatches.assignedBy:id,name',
            'calls' => function ($query) {
                $query->orderBy('started_at', 'desc');
            },
            'calls.user:id,name,phone_number',
            'calls.receiver:id,name',
        ])->findOrFail($id);

        return Inertia::render('Admin/IncidentOverview/index', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'incident' => [
                'id' => $incident->id,
                'type' => $incident->type,
                'status' => $incident->status,
                'latitude' => (float) $incident->latitude,
                'longitude' => (float) $incident->longitude,
                'address' => $incident->address,
                'description' => $incident->description,
                'created_at' => $incident->created_at->toIso8601String(),
                'dispatched_at' => $incident->dispatched_at?->toIso8601String(),
                'completed_at' => $incident->completed_at?->toIso8601String(),
                'responders_assigned' => $incident->responders_assigned,
                'responders_en_route' => $incident->responders_en_route,
                'responders_arrived' => $incident->responders_arrived,
                'reporter' => [
                    'id' => $incident->user->id,
                    'name' => $incident->user->name,
                    'email' => $incident->user->email,
                    'phone_number' => $incident->user->phone_number,
                ],
                'assigned_admin' => $incident->assignedAdmin ? [
                    'id' => $incident->assignedAdmin->id,
                    'name' => $incident->assignedAdmin->name,
                ] : null,
                'dispatches' => $incident->dispatches->map(function ($dispatch) {
                    return [
                        'id' => $dispatch->id,
                        'status' => $dispatch->status,
                        'distance_meters' => $dispatch->distance_meters,
                        'distance_text' => $dispatch->formatted_distance,
                        'estimated_duration_seconds' => $dispatch->estimated_duration_seconds,
                        'duration_text' => $dispatch->formatted_duration,
                        'assigned_at' => $dispatch->assigned_at?->toIso8601String(),
                        'accepted_at' => $dispatch->accepted_at?->toIso8601String(),
                        'en_route_at' => $dispatch->en_route_at?->toIso8601String(),
                        'arrived_at' => $dispatch->arrived_at?->toIso8601String(),
                        'completed_at' => $dispatch->completed_at?->toIso8601String(),
                        'cancelled_at' => $dispatch->cancelled_at?->toIso8601String(),
                        'cancellation_reason' => $dispatch->cancellation_reason,
                        'responder' => [
                            'id' => $dispatch->responder->id,
                            'name' => $dispatch->responder->name,
                            'email' => $dispatch->responder->email,
                            'phone_number' => $dispatch->responder->phone_number,
                            'responder_status' => $dispatch->responder->responder_status,
                            'current_latitude' => $dispatch->responder->current_latitude,
                            'current_longitude' => $dispatch->responder->current_longitude,
                            'location_updated_at' => $dispatch->responder->location_updated_at?->toIso8601String(),
                        ],
                        'assigned_by' => $dispatch->assignedBy ? [
                            'id' => $dispatch->assignedBy->id,
                            'name' => $dispatch->assignedBy->name,
                        ] : null,
                        'pre_arrival_form' => $dispatch->preArrivalForm ? [
                            'caller_name' => $dispatch->preArrivalForm->caller_name,
                            'patient_name' => $dispatch->preArrivalForm->patient_name,
                            'sex' => $dispatch->preArrivalForm->sex,
                            'age' => $dispatch->preArrivalForm->age,
                            'incident_type' => $dispatch->preArrivalForm->incident_type,
                            'estimated_arrival' => $dispatch->preArrivalForm->estimated_arrival?->toIso8601String(),
                            'submitted_at' => $dispatch->preArrivalForm->submitted_at?->toIso8601String(),
                        ] : null,
                    ];
                }),
                'calls' => $incident->calls->map(function ($call) {
                    return [
                        'id' => $call->id,
                        'channel_name' => $call->channel_name,
                        'status' => $call->status,
                        'initiator_type' => $call->initiator_type,
                        'started_at' => $call->started_at?->toIso8601String(),
                        'answered_at' => $call->answered_at?->toIso8601String(),
                        'ended_at' => $call->ended_at?->toIso8601String(),
                        'caller' => [
                            'id' => $call->user->id,
                            'name' => $call->user->name,
                            'phone_number' => $call->user->phone_number,
                        ],
                        'receiver' => $call->receiver ? [
                            'id' => $call->receiver->id,
                            'name' => $call->receiver->name,
                        ] : null,
                    ];
                }),
            ],
        ]);
    }
}
