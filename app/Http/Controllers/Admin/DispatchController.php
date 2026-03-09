<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\User;
use App\Services\DispatchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DispatchController extends Controller
{
    private DispatchService $dispatchService;

    public function __construct(DispatchService $dispatchService)
    {
        $this->dispatchService = $dispatchService;
    }

    /**
     * Display the dispatch page for a specific incident.
     *
     * GET /admin/dispatch/{id}
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (! $user || ! $user->isAdmin()) {
                return redirect('/')->with('error', 'Unauthorized access');
            }

            // Load incident with relationships
            $incident = Incident::with(['user', 'assignedAdmin', 'dispatches.responder'])
                ->findOrFail($id);

            // Check if incident can be dispatched
            if (! $incident->canAssignMoreResponders()) {
                return redirect()
                    ->route('admin.dashboard')
                    ->with('error', 'This incident is already completed or cancelled');
            }

            Log::info('[DISPATCH] Admin accessed dispatch page', [
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'incident_id' => $incident->id,
            ]);

            // Render Inertia dispatch page
            return Inertia::render('Admin/Dispatch/index', [
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
                    'user' => [
                        'id' => $incident->user->id,
                        'name' => $incident->user->name,
                        'phone_number' => $incident->user->phone_number,
                        'email' => $incident->user->email,
                    ],
                    'dispatches' => $incident->dispatches->map(function ($dispatch) {
                        return [
                            'id' => $dispatch->id,
                            'status' => $dispatch->status,
                            'responder' => [
                                'id' => $dispatch->responder->id,
                                'name' => $dispatch->responder->name,
                                'phone_number' => $dispatch->responder->phone_number,
                            ],
                            'distance_text' => $dispatch->formatted_distance,
                            'duration_text' => $dispatch->formatted_duration,
                            'assigned_at' => $dispatch->assigned_at->toIso8601String(),
                        ];
                    }),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('[DISPATCH] ❌ Failed to load dispatch page', [
                'incident_id' => $id,
                'admin_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()
                ->route('admin.dashboard')
                ->with('error', 'Failed to load dispatch page');
        }
    }

    /**
     * Get available responders for an incident with calculated distances.
     *
     * GET /admin/incidents/{id}/available-responders
     */
    public function getAvailableResponders(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (! $user || ! $user->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $incident = Incident::findOrFail($id);

            // Get available responders with distances
            $responders = $this->dispatchService->getAvailableResponders($incident);

            if ($responders->isEmpty()) {
                $diagnostics = $this->dispatchService->getAvailabilityDiagnostics($incident);

                return response()->json([
                    'responders' => [],
                    'diagnostics' => $diagnostics,
                    'message' => 'No available responders found. Please ensure responders are on duty and have location enabled.',
                ]);
            }

            // Format responder data for frontend
            $respondersData = $responders->map(function ($responder) {
                return [
                    'id' => $responder->id,
                    'name' => $responder->name,
                    'email' => $responder->email,
                    'phone_number' => $responder->phone_number,
                    'responder_status' => $responder->responder_status,
                    'is_on_duty' => $responder->is_on_duty,
                    'current_latitude' => $responder->current_latitude,
                    'current_longitude' => $responder->current_longitude,
                    'base_latitude' => $responder->base_latitude,
                    'base_longitude' => $responder->base_longitude,
                    'location_updated_at' => $responder->location_updated_at?->toIso8601String(),
                    'distance_meters' => $responder->distance_meters,
                    'distance_text' => $responder->distance_text,
                    'duration_seconds' => $responder->duration_seconds,
                    'duration_text' => $responder->duration_text,
                    'route_coordinates' => $responder->route_coordinates ?? null,
                    'distance_method' => $responder->distance_method ?? null,
                ];
            })->values();

            Log::info('[DISPATCH] Fetched available responders', [
                'incident_id' => $incident->id,
                'responder_count' => $responders->count(),
                'admin_id' => $user->id,
            ]);

            return response()->json([
                'responders' => $respondersData,
                'incident_id' => $incident->id,
            ]);
        } catch (\Exception $e) {
            Log::error('[DISPATCH] ❌ Failed to fetch available responders', [
                'incident_id' => $id,
                'admin_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to load responder list. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Assign a responder to an incident.
     *
     * POST /admin/dispatch/assign
     */
    public function assignResponder(Request $request)
    {
        try {
            $user = $request->user();

            if (! $user || ! $user->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Validate request
            $validated = $request->validate([
                'incident_id' => ['required', 'exists:incidents,id'],
                'responder_id' => ['required', 'exists:users,id'],
            ]);

            $incident = Incident::findOrFail($validated['incident_id']);
            $responder = User::findOrFail($validated['responder_id']);

            // Assign responder using service
            $dispatch = $this->dispatchService->assignResponder($incident, $responder, $user);

            return response()->json([
                'message' => 'Responder assigned successfully',
                'dispatch' => [
                    'id' => $dispatch->id,
                    'incident_id' => $dispatch->incident_id,
                    'responder_id' => $dispatch->responder_id,
                    'status' => $dispatch->status,
                    'distance_text' => $dispatch->formatted_distance,
                    'duration_text' => $dispatch->formatted_duration,
                    'assigned_at' => $dispatch->assigned_at->toIso8601String(),
                    'responder' => [
                        'name' => $responder->name,
                        'phone_number' => $responder->phone_number,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('[DISPATCH] ❌ Failed to assign responder', [
                'incident_id' => $request->incident_id ?? null,
                'responder_id' => $request->responder_id ?? null,
                'admin_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => $e->getMessage(),
                'error' => config('app.debug') ? $e->getMessage() : 'Failed to assign responder',
            ], 422);
        }
    }

    /**
     * Cancel a dispatch assignment.
     *
     * POST /admin/dispatch/{id}/cancel
     */
    public function cancelDispatch(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (! $user || ! $user->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $dispatch = Dispatch::findOrFail($id);

            // Validate request
            $validated = $request->validate([
                'reason' => ['nullable', 'string', 'max:500'],
            ]);

            $reason = $validated['reason'] ?? 'Cancelled by admin';

            // Cancel dispatch using service
            $this->dispatchService->updateDispatchStatus($dispatch, 'cancelled', $reason);

            Log::info('[DISPATCH] ✅ Dispatch cancelled by admin', [
                'dispatch_id' => $dispatch->id,
                'incident_id' => $dispatch->incident_id,
                'responder_id' => $dispatch->responder_id,
                'admin_id' => $user->id,
                'reason' => $reason,
            ]);

            return response()->json([
                'message' => 'Dispatch cancelled successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('[DISPATCH] ❌ Failed to cancel dispatch', [
                'dispatch_id' => $id,
                'admin_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to cancel dispatch',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
