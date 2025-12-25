<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dispatch;
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
            if (!$user || !$user->isResponder()) {
                return response()->json([
                    'message' => 'Unauthorized. Only responders can update location.',
                ], 403);
            }

            // Validate request
            $validated = $request->validate([
                'latitude' => ['required', 'numeric', 'between:-90,90'],
                'longitude' => ['required', 'numeric', 'between:-180,180'],
            ]);

            // Only update location if responder is on duty
            if (!$user->is_on_duty) {
                return response()->json([
                    'message' => 'Location updates are only accepted when on duty',
                ], 422);
            }

            // Update current location
            $user->current_latitude = $validated['latitude'];
            $user->current_longitude = $validated['longitude'];
            $user->location_updated_at = now();
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

            return response()->json([
                'message' => 'Location updated successfully',
                'location' => [
                    'latitude' => (float) $user->current_latitude,
                    'longitude' => (float) $user->current_longitude,
                    'updated_at' => $user->location_updated_at->toIso8601String(),
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
            $user = $request->user();

            // Validate user is a responder
            if (!$user || !$user->isResponder()) {
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
            if ($validated['is_on_duty'] && !$previousOnDuty) {
                $user->duty_started_at = now();
                $user->duty_ended_at = null;
            } elseif (!$validated['is_on_duty'] && $previousOnDuty) {
                $user->duty_ended_at = now();
            }

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
     * Get all dispatches assigned to the responder.
     *
     * GET /api/responder/dispatches
     */
    public function getAssignedIncidents(Request $request)
    {
        try {
            $user = $request->user();

            // Validate user is a responder
            if (!$user || !$user->isResponder()) {
                return response()->json([
                    'message' => 'Unauthorized. Only responders can view dispatches.',
                ], 403);
            }

            // Get active dispatches for this responder
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

            Log::info('[RESPONDER] 📋 Fetched assigned dispatches', [
                'responder_id' => $user->id,
                'dispatch_count' => $dispatches->count(),
            ]);

            return response()->json([
                'dispatches' => $dispatchesData,
                'responder_location' => [
                    'latitude' => (float) $user->current_latitude,
                    'longitude' => (float) $user->current_longitude,
                    'updated_at' => $user->location_updated_at?->toIso8601String(),
                ],
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
     * Update dispatch status (accept, en route, arrived, completed).
     *
     * POST /api/responder/dispatches/{id}/status
     */
    public function updateDispatchStatus(Request $request, $id)
    {
        try {
            $user = $request->user();

            // Validate user is a responder
            if (!$user || !$user->isResponder()) {
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
                'status' => ['required', 'in:accepted,en_route,arrived,completed'],
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
}
