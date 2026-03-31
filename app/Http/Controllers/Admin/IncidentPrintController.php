<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;

class IncidentPrintController extends Controller
{
    /**
     * Return a print-ready HTML view for a single incident.
     * Opens in a new tab — the browser's native print dialog handles PDF output.
     */
    public function show(Request $request, int $id)
    {
        $incident = Incident::with([
            'user:id,name,email,phone_number',
            'assignedAdmin:id,name,email',
            'dispatches' => fn ($q) => $q->orderBy('assigned_at', 'asc'),
            'dispatches.responder:id,name,email,phone_number,responder_status',
            'dispatches.preArrivalForms',
            'dispatches.assignedBy:id,name',
            'calls'      => fn ($q) => $q->orderBy('started_at', 'desc'),
            'calls.user:id,name,phone_number',
            'calls.receiver:id,name',
        ])->findOrFail($id);

        // Build a flat array identical to what IncidentOverviewController provides,
        // so the blade template mirrors the Inertia page structure.
        $data = [
            'id'                  => $incident->id,
            'type'                => $incident->type,
            'status'              => $incident->status,
            'latitude'            => $incident->latitude ? (float) $incident->latitude : null,
            'longitude'           => $incident->longitude ? (float) $incident->longitude : null,
            'address'             => $incident->address,
            'description'         => $incident->description,
            'created_at'          => $incident->created_at?->toIso8601String(),
            'dispatched_at'       => $incident->dispatched_at?->toIso8601String(),
            'completed_at'        => $incident->completed_at?->toIso8601String(),
            'responders_assigned' => $incident->dispatches->whereNotIn('status', ['cancelled', 'declined'])->count(),
            'responders_en_route' => $incident->dispatches->whereIn('status', ['en_route', 'transporting_to_hospital'])->count(),
            'responders_arrived'  => $incident->dispatches->whereIn('status', ['arrived', 'completed'])->count(),

            'reporter' => [
                'name'         => $incident->user?->name,
                'email'        => $incident->user?->email,
                'phone_number' => $incident->user?->phone_number,
            ],

            'assigned_admin' => $incident->assignedAdmin ? [
                'name' => $incident->assignedAdmin->name,
            ] : null,

            'dispatches' => $incident->dispatches->map(function ($dispatch) {
                return [
                    'id'                          => $dispatch->id,
                    'status'                      => $dispatch->status,
                    'distance_text'               => $dispatch->formatted_distance ?? null,
                    'duration_text'               => $dispatch->formatted_duration ?? null,
                    'assigned_at'                 => $dispatch->assigned_at?->toIso8601String(),
                    'accepted_at'                 => $dispatch->accepted_at?->toIso8601String(),
                    'en_route_at'                 => $dispatch->en_route_at?->toIso8601String(),
                    'arrived_at'                  => $dispatch->arrived_at?->toIso8601String(),
                    'completed_at'                => $dispatch->completed_at?->toIso8601String(),
                    'cancelled_at'                => $dispatch->cancelled_at?->toIso8601String(),
                    'cancellation_reason'         => $dispatch->cancellation_reason,

                    'responder' => [
                        'name'         => $dispatch->responder?->name,
                        'email'        => $dispatch->responder?->email,
                        'phone_number' => $dispatch->responder?->phone_number,
                    ],

                    'pre_arrival_forms' => $dispatch->preArrivalForms->map(function ($form) {
                        return [
                            'caller_name'        => $form->caller_name,
                            'patient_name'       => $form->patient_name,
                            'sex'                => $form->sex,
                            'age'                => $form->age,
                            'incident_type'      => $form->incident_type,
                            'estimated_arrival'  => $form->estimated_arrival?->toIso8601String(),
                            'submitted_at'       => $form->submitted_at?->toIso8601String(),
                        ];
                    })->toArray(),
                ];
            })->toArray(),

            'calls' => $incident->calls->map(function ($call) {
                return [
                    'channel_name'   => $call->channel_name,
                    'status'         => $call->status,
                    'initiator_type' => $call->initiator_type,
                    'started_at'     => $call->started_at?->toIso8601String(),
                    'answered_at'    => $call->answered_at?->toIso8601String(),
                    'ended_at'       => $call->ended_at?->toIso8601String(),
                    'caller'         => [
                        'name'         => $call->user?->name,
                        'phone_number' => $call->user?->phone_number,
                    ],
                    'receiver' => $call->receiver ? [
                        'name' => $call->receiver->name,
                    ] : null,
                ];
            })->toArray(),
        ];

        return view('admin.incident-print', ['incident' => $data]);
    }
}