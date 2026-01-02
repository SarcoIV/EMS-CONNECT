<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\User;
use App\Services\DistanceCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class IncidentController extends Controller
{
    private DistanceCalculationService $distanceService;

    public function __construct(DistanceCalculationService $distanceService)
    {
        $this->distanceService = $distanceService;
    }
    /**
     * Create a new emergency incident.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Support both flat format (mobile app) and nested format (backward compatibility)
        $data = $request->all();

        // If location is nested, flatten it for validation
        if (isset($data['location']) && is_array($data['location'])) {
            $data['latitude'] = $data['location']['latitude'] ?? null;
            $data['longitude'] = $data['location']['longitude'] ?? null;
            $data['address'] = $data['location']['address'] ?? $data['address'] ?? null;
        }

        $validator = Validator::make($data, [
            'type' => ['required', 'in:medical,fire,accident,crime,natural_disaster,other'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'address' => ['required', 'string', 'max:500'],
            'description' => ['required', 'string', 'max:1000'],
        ], [
            'type.required' => 'The type field is required.',
            'type.in' => 'The selected type is invalid.',
            'latitude.required' => 'The latitude field is required.',
            'latitude.numeric' => 'The latitude must be a valid number.',
            'latitude.between' => 'The latitude must be between -90 and 90.',
            'longitude.required' => 'The longitude field is required.',
            'longitude.numeric' => 'The longitude must be a valid number.',
            'longitude.between' => 'The longitude must be between -180 and 180.',
            'address.required' => 'The address field is required.',
            'description.required' => 'The description field is required.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = $request->user();

            $incident = Incident::create([
                'user_id' => $user->id,
                'type' => $data['type'],
                'status' => 'pending',
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'address' => $data['address'],
                'description' => $data['description'],
            ]);

            Log::info('[INCIDENTS] 📍 New emergency incident created', [
                'incident_id' => $incident->id,
                'user_id' => $user->id,
                'user_name' => $user->name,
                'type' => $incident->type,
                'latitude' => $incident->latitude,
                'longitude' => $incident->longitude,
                'address' => $incident->address,
                'created_at' => $incident->created_at?->toIso8601String(),
            ]);

            return response()->json([
                'message' => 'Incident reported successfully',
                'incident' => [
                    'id' => $incident->id,
                    'type' => $incident->type,
                    'status' => $incident->status,
                    'latitude' => (float) $incident->latitude,
                    'longitude' => (float) $incident->longitude,
                    'address' => $incident->address,
                    'description' => $incident->description,
                    'created_at' => $incident->created_at?->toIso8601String(),
                ],
            ], 201);

        } catch (\Exception $e) {
            Log::error('[INCIDENTS] ❌ Failed to create incident', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while creating the emergency alert. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all incidents for the authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function myIncidents(Request $request)
    {
        try {
            $user = $request->user();

            $incidents = Incident::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($incident) => $this->formatIncident($incident));

            return response()->json([
                'incidents' => $incidents,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to fetch user incidents: '.$e->getMessage());

            return response()->json([
                'message' => 'An error occurred while fetching incidents.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get a specific incident.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, int $id)
    {
        try {
            $user = $request->user();

            $incident = Incident::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (! $incident) {
                return response()->json([
                    'message' => 'Incident not found.',
                    'errors' => ['incident' => ['The specified incident does not exist or you do not have access to it.']],
                ], 404);
            }

            return response()->json([
                'incident' => $this->formatIncident($incident),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to fetch incident: '.$e->getMessage());

            return response()->json([
                'message' => 'An error occurred while fetching the incident.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Cancel an incident.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel(Request $request, int $id)
    {
        try {
            $user = $request->user();

            $incident = Incident::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (! $incident) {
                return response()->json([
                    'message' => 'Incident not found.',
                    'errors' => ['incident' => ['The specified incident does not exist or you do not have access to it.']],
                ], 404);
            }

            if (! $incident->canBeCancelled()) {
                return response()->json([
                    'message' => 'Incident cannot be cancelled.',
                    'errors' => ['incident' => ['This incident has already been completed or cancelled.']],
                ], 422);
            }

            $incident->update([
                'status' => 'cancelled',
            ]);

            Log::info('Incident cancelled', [
                'incident_id' => $incident->id,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Incident cancelled successfully.',
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to cancel incident: '.$e->getMessage());

            return response()->json([
                'message' => 'An error occurred while cancelling the incident.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get real-time tracking data for incident responders.
     *
     * GET /api/incidents/{id}/tracking
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function tracking(Request $request, int $id)
    {
        try {
            $user = $request->user();

            // Find incident and verify ownership
            $incident = Incident::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (! $incident) {
                return response()->json([
                    'message' => 'Incident not found or access denied.',
                    'tracking_available' => false,
                ], 404);
            }

            // Check if incident is still trackable
            if ($incident->status === 'cancelled') {
                return response()->json([
                    'incident' => $this->formatIncidentBasic($incident),
                    'responders' => [],
                    'tracking_available' => false,
                    'message' => 'This incident has been cancelled.',
                ], 200);
            }

            if ($incident->status === 'completed') {
                return response()->json([
                    'incident' => $this->formatIncidentBasic($incident),
                    'responders' => [],
                    'tracking_available' => false,
                    'message' => 'This incident has been completed.',
                ], 200);
            }

            // Fetch active dispatches with responder data (only after acceptance)
            $dispatches = Dispatch::with([
                'responder:id,name,phone_number,current_latitude,current_longitude,location_updated_at',
            ])
                ->where('incident_id', $incident->id)
                ->whereIn('status', ['accepted', 'en_route', 'arrived'])
                ->get();

            // No responders assigned yet or none have accepted
            if ($dispatches->isEmpty()) {
                return response()->json([
                    'incident' => $this->formatIncidentBasic($incident),
                    'responders' => [],
                    'tracking_available' => false,
                    'message' => 'No responders have accepted yet. Please wait for help to arrive.',
                ], 200);
            }

            // Calculate routes and format responder data
            $respondersData = $dispatches->map(function ($dispatch) use ($incident) {
                $responder = $dispatch->responder;

                // Calculate route if responder has current location
                $routeData = null;
                if ($responder->current_latitude && $responder->current_longitude) {
                    try {
                        $routeData = $this->distanceService->calculateRoadDistance(
                            (float) $responder->current_latitude,
                            (float) $responder->current_longitude,
                            (float) $incident->latitude,
                            (float) $incident->longitude
                        );
                    } catch (\Exception $e) {
                        Log::warning('[TRACKING] Route calculation failed', [
                            'incident_id' => $incident->id,
                            'responder_id' => $responder->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                return $this->formatResponderTracking($dispatch, $responder, $routeData);
            });

            Log::info('[TRACKING] Community user accessed tracking data', [
                'incident_id' => $incident->id,
                'user_id' => $user->id,
                'responder_count' => $respondersData->count(),
            ]);

            return response()->json([
                'incident' => $this->formatIncidentBasic($incident),
                'responders' => $respondersData,
                'tracking_available' => true,
                'message' => 'Tracking data retrieved successfully',
            ], 200);

        } catch (\Exception $e) {
            Log::error('[TRACKING] Failed to fetch tracking data', [
                'incident_id' => $id,
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while fetching tracking data.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Format incident for basic tracking response.
     */
    private function formatIncidentBasic(Incident $incident): array
    {
        return [
            'id' => $incident->id,
            'type' => $incident->type,
            'status' => $incident->status,
            'latitude' => (float) $incident->latitude,
            'longitude' => (float) $incident->longitude,
            'address' => $incident->address,
            'description' => $incident->description,
            'created_at' => $incident->created_at?->toIso8601String(),
        ];
    }

    /**
     * Format responder data for tracking response.
     */
    private function formatResponderTracking(Dispatch $dispatch, User $responder, ?array $routeData): array
    {
        // Format current location
        $currentLocation = null;
        if ($responder->current_latitude && $responder->current_longitude) {
            $currentLocation = [
                'latitude' => (float) $responder->current_latitude,
                'longitude' => (float) $responder->current_longitude,
                'updated_at' => $responder->location_updated_at?->toIso8601String(),
            ];
        }

        // Format distance, ETA, and route from calculated route data
        $distance = null;
        $eta = null;
        $route = null;

        if ($routeData) {
            $distance = [
                'meters' => $routeData['distance_meters'],
                'text' => $routeData['distance_text'],
            ];

            $eta = [
                'seconds' => $routeData['duration_seconds'],
                'text' => $routeData['duration_text'],
            ];

            $route = [
                'coordinates' => $routeData['route_coordinates'] ?? [],
                'encoded_polyline' => $routeData['encoded_polyline'] ?? null,
            ];
        }

        return [
            'id' => $responder->id,
            'name' => $responder->name,
            'phone_number' => $responder->phone_number,
            'dispatch_id' => $dispatch->id,
            'status' => $dispatch->status,
            'current_location' => $currentLocation,
            'distance' => $distance,
            'eta' => $eta,
            'route' => $route,
            'timeline' => [
                'assigned_at' => $dispatch->assigned_at?->toIso8601String(),
                'accepted_at' => $dispatch->accepted_at?->toIso8601String(),
                'en_route_at' => $dispatch->en_route_at?->toIso8601String(),
                'arrived_at' => $dispatch->arrived_at?->toIso8601String(),
                'completed_at' => $dispatch->completed_at?->toIso8601String(),
            ],
        ];
    }

    /**
     * Format incident for API response.
     */
    private function formatIncident(Incident $incident): array
    {
        return [
            'id' => $incident->id,
            'type' => $incident->type,
            'status' => $incident->status,
            'latitude' => (float) $incident->latitude,
            'longitude' => (float) $incident->longitude,
            'address' => $incident->address,
            'description' => $incident->description,
            'created_at' => $incident->created_at?->toIso8601String(),
        ];
    }
}
