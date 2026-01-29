<?php

namespace App\Http\Controllers\Api;

use App\Events\PreArrivalFormSubmitted;
use App\Events\ResponderLocationUpdated;
use App\Http\Controllers\Controller;
use App\Models\Dispatch;
use App\Models\PreArrivalForm;
use App\Services\DispatchService;
use App\Services\DistanceCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Responder Controller (Mobile API)
 *
 * Handles API endpoints for responder mobile app:
 * - Location updates (real-time GPS)
 * - Duty status management
 * - Viewing assigned incidents
 * - Updating dispatch status
 */
class ResponderController extends Controller
{
    private DispatchService $dispatchService;

    private DistanceCalculationService $distanceService;

    public function __construct(
        DispatchService $dispatchService,
        DistanceCalculationService $distanceService
    ) {
        $this->dispatchService = $dispatchService;
        $this->distanceService = $distanceService;
    }

    /**
     * Update responder's current location (real-time GPS).
     *
     * POST /api/responder/location
     */
    public function updateLocation(Request $request)
    {
        try {
            $user = $request->user();

            // Validate user is a responder
            if (! $user || ! $user->isResponder()) {
                return response()->json([
                    'message' => 'Unauthorized. Only responders can update location.',
                ], 403);
            }

            // Validate request
            $validated = $request->validate([
                'latitude' => ['required', 'numeric', 'between:-90,90'],
                'longitude' => ['required', 'numeric', 'between:-180,180'],
                'accuracy' => ['nullable', 'numeric', 'min:0'], // GPS accuracy in meters
            ]);

            // Only update location if responder is on duty
            if (! $user->is_on_duty) {
                return response()->json([
                    'message' => 'Location updates are only accepted when on duty',
                ], 422);
            }

            // Update current location
            $user->current_latitude = $validated['latitude'];
            $user->current_longitude = $validated['longitude'];
            $user->location_updated_at = now();

            // Update last active timestamp (location updates indicate responder is active)
            $user->last_active_at = now();

            $user->save();

            // Store location history if responder has active dispatch
            $activeDispatch = $user->activeDispatch;
            if ($activeDispatch) {
                \App\Models\ResponderLocationHistory::create([
                    'responder_id' => $user->id,
                    'dispatch_id' => $activeDispatch->id,
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                    'accuracy' => null, // Mobile app can send this if available
                ]);
            }

            Log::info('[RESPONDER] 📍 Location updated', [
                'responder_id' => $user->id,
                'responder_name' => $user->name,
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'has_active_dispatch' => $activeDispatch !== null,
                'dispatch_id' => $activeDispatch?->id,
                'request_ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Broadcast location update to admin dashboard (real-time map)
            broadcast(new ResponderLocationUpdated($user))->toOthers();

            return response()->json([
                'message' => 'Location updated successfully',
                'location' => [
                    'latitude' => (float) $user->current_latitude,
                    'longitude' => (float) $user->current_longitude,
                    'updated_at' => $user->location_updated_at->toIso8601String(),
                    'last_active_at' => $user->last_active_at?->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('[RESPONDER] ❌ Failed to update location', [
                'responder_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Failed to update location',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update responder's duty status.
     *
     * POST /api/responder/status
     */
    public function updateStatus(Request $request)
    {
        try {
            // LOG: Request received
            Log::info('[RESPONDER] 🔔 Status update request received', [
                'headers' => $request->headers->all(),
                'body' => $request->all(),
                'user_id' => $request->user()?->id,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $user = $request->user();

            // LOG: User details
            Log::info('[RESPONDER] 👤 User attempting status update', [
                'user_id' => $user?->id,
                'email' => $user?->email,
                'role' => $user?->role,
                'user_role' => $user?->user_role,
                'current_is_on_duty' => $user?->is_on_duty,
                'current_status' => $user?->responder_status,
            ]);

            // Validate user is a responder
            if (! $user || ! $user->isResponder()) {
                Log::warning('[RESPONDER] ⚠️ Unauthorized status update attempt', [
                    'user_id' => $user?->id,
                    'role' => $user?->role,
                    'is_responder' => $user?->isResponder(),
                ]);

                return response()->json([
                    'message' => 'Unauthorized. Only responders can update status.',
                ], 403);
            }

            // Validate request
            $validated = $request->validate([
                'is_on_duty' => ['required', 'boolean'],
                'responder_status' => ['required', 'in:offline,idle,assigned,en_route,busy'],
            ]);

            $previousStatus = $user->responder_status;
            $previousOnDuty = $user->is_on_duty;

            // Update status
            $user->is_on_duty = $validated['is_on_duty'];
            $user->responder_status = $validated['responder_status'];

            // Track duty start/end times
            if ($validated['is_on_duty'] && ! $previousOnDuty) {
                $user->duty_started_at = now();
                $user->duty_ended_at = null;
            } elseif (! $validated['is_on_duty'] && $previousOnDuty) {
                $user->duty_ended_at = now();
            }

            // Update last active timestamp (for automatic offline detection)
            $user->last_active_at = now();

            $user->save();

            Log::info('[RESPONDER] 🔄 Status updated', [
                'responder_id' => $user->id,
                'responder_name' => $user->name,
                'previous_on_duty' => $previousOnDuty,
                'new_on_duty' => $validated['is_on_duty'],
                'previous_status' => $previousStatus,
                'new_status' => $validated['responder_status'],
            ]);

            return response()->json([
                'message' => 'Status updated successfully',
                'status' => [
                    'is_on_duty' => $user->is_on_duty,
                    'responder_status' => $user->responder_status,
                    'duty_started_at' => $user->duty_started_at?->toIso8601String(),
                    'duty_ended_at' => $user->duty_ended_at?->toIso8601String(),
                    'last_active_at' => $user->last_active_at?->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('[RESPONDER] ❌ Failed to update status', [
                'responder_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Failed to update status',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all dispatches assigned to the responder AND nearby incidents within 3km.
     *
     * GET /api/responder/dispatches
     *
     * Returns:
     * - assigned_dispatches: Incidents already assigned to this responder
     * - nearby_incidents: Pending incidents within 3km that could be accepted
     */
    public function getAssignedIncidents(Request $request)
    {
        try {
            $user = $request->user();

            // Validate user is a responder
            if (! $user || ! $user->isResponder()) {
                return response()->json([
                    'message' => 'Unauthorized. Only responders can view dispatches.',
                ], 403);
            }

            // Check if responder has current location
            $hasLocation = $user->current_latitude && $user->current_longitude;

            // Check if location is stale (> 5 minutes old)
            $locationStale = false;
            if ($hasLocation && $user->location_updated_at) {
                $locationStale = $user->location_updated_at->diffInMinutes(now()) > 5;
            }

            // Get active dispatches already assigned to this responder
            $dispatches = Dispatch::with(['incident.user'])
                ->where('responder_id', $user->id)
                ->active()
                ->orderBy('assigned_at', 'desc')
                ->get();

            // Format dispatches for mobile app
            $dispatchesData = $dispatches->map(function ($dispatch) use ($user) {
                // Calculate current route (if responder has location)
                $routeData = null;

                if ($user->current_latitude && $user->current_longitude) {
                    try {
                        $routeData = $this->distanceService->calculateRoadDistance(
                            (float) $user->current_latitude,
                            (float) $user->current_longitude,
                            (float) $dispatch->incident->latitude,
                            (float) $dispatch->incident->longitude
                        );

                        // Log route details for debugging
                        Log::info('[RESPONDER] 🗺️ Route calculated for dispatch', [
                            'dispatch_id' => $dispatch->id,
                            'coordinates_count' => count($routeData['route_coordinates'] ?? []),
                            'distance' => $routeData['distance_text'] ?? 'N/A',
                            'method' => $routeData['method'] ?? 'unknown',
                        ]);
                    } catch (\Exception $e) {
                        Log::warning('[RESPONDER] Failed to calculate route for dispatch', [
                            'dispatch_id' => $dispatch->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                return [
                    'id' => $dispatch->id,
                    'incident_id' => $dispatch->incident_id,
                    'status' => $dispatch->status,

                    // Original distance at assignment time
                    'distance_meters' => $dispatch->distance_meters,
                    'distance_text' => $dispatch->formatted_distance,
                    'estimated_duration_seconds' => $dispatch->estimated_duration_seconds,
                    'duration_text' => $dispatch->formatted_duration,

                    // Current route data (if available)
                    'route' => $routeData ? [
                        'distance_meters' => $routeData['distance_meters'],
                        'duration_seconds' => $routeData['duration_seconds'],
                        'distance_text' => $routeData['distance_text'],
                        'duration_text' => $routeData['duration_text'],
                        'coordinates' => $routeData['route_coordinates'], // Array of {latitude, longitude}
                        'encoded_polyline' => $routeData['encoded_polyline'] ?? null, // For efficiency
                        'method' => $routeData['method'], // google_maps, openrouteservice, or haversine
                    ] : null,

                    'assigned_at' => $dispatch->assigned_at->toIso8601String(),
                    'accepted_at' => $dispatch->accepted_at?->toIso8601String(),
                    'en_route_at' => $dispatch->en_route_at?->toIso8601String(),
                    'arrived_at' => $dispatch->arrived_at?->toIso8601String(),

                    'incident' => [
                        'id' => $dispatch->incident->id,
                        'type' => $dispatch->incident->type,
                        'status' => $dispatch->incident->status,
                        'latitude' => (float) $dispatch->incident->latitude,
                        'longitude' => (float) $dispatch->incident->longitude,
                        'address' => $dispatch->incident->address,
                        'description' => $dispatch->incident->description,
                        'created_at' => $dispatch->incident->created_at->toIso8601String(),
                        'reporter' => [
                            'name' => $dispatch->incident->user->name,
                            'phone_number' => $dispatch->incident->user->phone_number,
                        ],
                    ],
                ];
            });

            // Get nearby pending incidents within 3km (if location available and fresh)
            $nearbyIncidentsData = [];

            if ($hasLocation && ! $locationStale && $user->is_on_duty) {
                $nearbyIncidents = $this->getNearbyPendingIncidents($user, 3000); // 3km = 3000m

                $nearbyIncidentsData = $nearbyIncidents->map(function ($incident) use ($user) {
                    // Check if already assigned to this responder
                    $alreadyAssigned = $dispatches->contains(function ($dispatch) use ($incident) {
                        return $dispatch->incident_id === $incident->id;
                    });

                    if ($alreadyAssigned) {
                        return null; // Skip if already assigned
                    }

                    // Calculate current distance and route
                    $routeData = $this->distanceService->calculateRoadDistance(
                        (float) $user->current_latitude,
                        (float) $user->current_longitude,
                        (float) $incident->latitude,
                        (float) $incident->longitude
                    );

                    return [
                        'incident_id' => $incident->id,
                        'type' => $incident->type,
                        'status' => $incident->status,
                        'distance_meters' => $routeData['distance_meters'],
                        'distance_text' => $routeData['distance_text'],
                        'estimated_duration_seconds' => $routeData['duration_seconds'],
                        'duration_text' => $routeData['duration_text'],
                        'latitude' => (float) $incident->latitude,
                        'longitude' => (float) $incident->longitude,
                        'address' => $incident->address,
                        'description' => $incident->description,
                        'created_at' => $incident->created_at->toIso8601String(),
                        'can_accept' => true, // Responder can request to be assigned
                        'reporter' => [
                            'name' => $incident->user->name,
                            'phone_number' => $incident->user->phone_number,
                        ],
                        'route' => [
                            'coordinates' => $routeData['route_coordinates'],
                            'method' => $routeData['method'],
                        ],
                    ];
                })->filter()->values(); // Remove nulls and reindex
            }

            Log::info('[RESPONDER] 📋 Fetched dispatches and nearby incidents', [
                'responder_id' => $user->id,
                'assigned_dispatch_count' => $dispatches->count(),
                'nearby_incident_count' => $nearbyIncidentsData->count(),
                'has_location' => $hasLocation,
                'location_stale' => $locationStale,
            ]);

            return response()->json([
                'assigned_dispatches' => $dispatchesData,
                'nearby_incidents' => $nearbyIncidentsData,
                'responder_location' => [
                    'latitude' => $hasLocation ? (float) $user->current_latitude : null,
                    'longitude' => $hasLocation ? (float) $user->current_longitude : null,
                    'updated_at' => $user->location_updated_at?->toIso8601String(),
                    'is_stale' => $locationStale,
                    'needs_update' => ! $hasLocation || $locationStale,
                ],
                'warnings' => array_filter([
                    ! $hasLocation ? 'Location not set. Please enable GPS to see nearby incidents.' : null,
                    $locationStale ? 'Location data is stale. Please update GPS to see accurate results.' : null,
                ]),
            ]);
        } catch (\Exception $e) {
            Log::error('[RESPONDER] ❌ Failed to fetch dispatches', [
                'responder_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch assigned incidents',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get nearby pending incidents within specified radius.
     *
     * @param  User  $responder  The responder
     * @param  int  $radiusMeters  Radius in meters (default 3000 = 3km)
     * @return Collection Collection of nearby incidents
     */
    private function getNearbyPendingIncidents($responder, $radiusMeters = 3000)
    {
        // Get all pending/dispatched incidents with location
        $incidents = \App\Models\Incident::with('user')
            ->whereIn('status', ['pending', 'dispatched'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        // Filter by radius using Haversine distance
        $nearbyIncidents = $incidents->filter(function ($incident) use ($responder, $radiusMeters) {
            $distance = DistanceCalculationService::calculateHaversineDistance(
                (float) $responder->current_latitude,
                (float) $responder->current_longitude,
                (float) $incident->latitude,
                (float) $incident->longitude
            );

            return $distance <= $radiusMeters;
        });

        // Sort by distance (nearest first)
        return $nearbyIncidents->sortBy(function ($incident) use ($responder) {
            return DistanceCalculationService::calculateHaversineDistance(
                (float) $responder->current_latitude,
                (float) $responder->current_longitude,
                (float) $incident->latitude,
                (float) $incident->longitude
            );
        });
    }

    /**
     * Update dispatch status (accept, en route, arrived, completed).
     *
     * POST /api/responder/dispatches/{id}/status
     */
    public function updateDispatchStatus(Request $request, $id)
    {
        try {
            $user = $request->user();

            // Validate user is a responder
            if (! $user || ! $user->isResponder()) {
                return response()->json([
                    'message' => 'Unauthorized. Only responders can update dispatch status.',
                ], 403);
            }

            $dispatch = Dispatch::findOrFail($id);

            // Verify dispatch belongs to this responder
            if ($dispatch->responder_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized. This dispatch is not assigned to you.',
                ], 403);
            }

            // Validate request
            $validated = $request->validate([
                'status' => ['required', 'in:accepted,declined,en_route,arrived,completed'],
            ]);

            // Update dispatch status using service
            $updatedDispatch = $this->dispatchService->updateDispatchStatus(
                $dispatch,
                $validated['status']
            );

            return response()->json([
                'message' => 'Dispatch status updated successfully',
                'dispatch' => [
                    'id' => $updatedDispatch->id,
                    'status' => $updatedDispatch->status,
                    'accepted_at' => $updatedDispatch->accepted_at?->toIso8601String(),
                    'en_route_at' => $updatedDispatch->en_route_at?->toIso8601String(),
                    'arrived_at' => $updatedDispatch->arrived_at?->toIso8601String(),
                    'completed_at' => $updatedDispatch->completed_at?->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('[RESPONDER] ❌ Failed to update dispatch status', [
                'dispatch_id' => $id,
                'responder_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Failed to update dispatch status',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 422);
        }
    }

    /**
     * Store or update pre-arrival information for a dispatch.
     *
     * IMPORTANT: This form is OPTIONAL and can be submitted at any time
     * during en_route or arrived status. It does NOT block status transitions.
     *
     * Mobile apps should present this as a non-blocking feature (e.g., floating
     * button, optional modal) that responders can choose to fill out while
     * traveling to the incident scene.
     *
     * POST /api/responder/dispatches/{dispatchId}/pre-arrival
     *
     * @param Request $request
     * @param int $dispatchId
     * @return JsonResponse
     */
    public function storePreArrival(Request $request, $dispatchId)
    {
        try {
            $user = $request->user();

            // Validate user is a responder
            if (! $user || ! $user->isResponder()) {
                return response()->json([
                    'message' => 'Unauthorized. Only responders can submit pre-arrival forms.',
                ], 403);
            }

            // Detect format and normalize to array
            $patientsData = [];
            if ($request->has('patients')) {
                // New format: array of patients
                $validated = $request->validate([
                    'patients' => ['required', 'array', 'min:1', 'max:20'],
                    'patients.*.caller_name' => ['nullable', 'string', 'max:255'],
                    'patients.*.patient_name' => ['required', 'string', 'max:255'],
                    'patients.*.sex' => ['required', 'in:Male,Female,Other'],
                    'patients.*.age' => ['required', 'integer', 'min:0', 'max:150'],
                    'patients.*.incident_type' => ['required', 'string', 'max:100'],
                    'patients.*.estimated_arrival' => ['nullable', 'date'],
                ]);
                $patientsData = $validated['patients'];
            } else {
                // Old format: single patient (DEPRECATED but supported)
                $validated = $request->validate([
                    'caller_name' => ['nullable', 'string', 'max:255'],
                    'patient_name' => ['required', 'string', 'max:255'],
                    'sex' => ['required', 'in:Male,Female,Other'],
                    'age' => ['required', 'integer', 'min:0', 'max:150'],
                    'incident_type' => ['required', 'string', 'max:100'],
                    'estimated_arrival' => ['nullable', 'date'],
                ]);
                $patientsData = [$validated]; // Convert to array format
            }

            // Verify dispatch exists and belongs to this responder
            $dispatch = Dispatch::where('id', $dispatchId)
                ->where('responder_id', $user->id)
                ->firstOrFail();

            // Transaction to replace all patients
            DB::transaction(function () use ($dispatch, $user, $patientsData) {
                // Delete existing forms
                PreArrivalForm::where('dispatch_id', $dispatch->id)->delete();

                // Create new forms
                foreach ($patientsData as $patientData) {
                    PreArrivalForm::create([
                        'dispatch_id' => $dispatch->id,
                        'responder_id' => $user->id,
                        'caller_name' => $patientData['caller_name'] ?? null,
                        'patient_name' => $patientData['patient_name'],
                        'sex' => $patientData['sex'],
                        'age' => $patientData['age'],
                        'incident_type' => $patientData['incident_type'],
                        'estimated_arrival' => $patientData['estimated_arrival'] ?? null,
                        'submitted_at' => now(),
                    ]);
                }
            });

            // Load created forms
            $preArrivalForms = PreArrivalForm::where('dispatch_id', $dispatch->id)
                ->orderBy('id', 'asc')
                ->get();

            Log::info('[RESPONDER] 📋 Pre-arrival form submitted', [
                'dispatch_id' => $dispatchId,
                'responder_id' => $user->id,
                'responder_name' => $user->name,
                'patient_count' => $preArrivalForms->count(),
                'patients' => $preArrivalForms->pluck('patient_name')->toArray(),
            ]);

            // Broadcast to admin dashboard
            broadcast(new PreArrivalFormSubmitted($dispatch->load('responder'), $preArrivalForms))->toOthers();

            return response()->json([
                'message' => 'Pre-arrival information saved successfully',
                'patient_count' => $preArrivalForms->count(),
                'patients' => $preArrivalForms->map(function ($form) {
                    return [
                        'id' => $form->id,
                        'dispatch_id' => $form->dispatch_id,
                        'caller_name' => $form->caller_name,
                        'patient_name' => $form->patient_name,
                        'sex' => $form->sex,
                        'age' => $form->age,
                        'incident_type' => $form->incident_type,
                        'estimated_arrival' => $form->estimated_arrival?->toIso8601String(),
                        'submitted_at' => $form->submitted_at?->toIso8601String(),
                    ];
                })->toArray(),
            ]);
        } catch (\Exception $e) {
            Log::error('[RESPONDER] ❌ Failed to submit pre-arrival form', [
                'dispatch_id' => $dispatchId,
                'responder_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Failed to submit pre-arrival form',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 422);
        }
    }
}
