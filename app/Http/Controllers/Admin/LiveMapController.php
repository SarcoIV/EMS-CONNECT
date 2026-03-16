<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\Dispatch;
use App\Models\Hospital;
use App\Models\Incident;
use App\Models\User;
use App\Services\DistanceCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LiveMapController extends Controller
{
    /**
     * Display the live map page.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Get all incidents with location data
        $incidents = $this->getIncidentsForMap();

        // Get active calls
        $activeCalls = $this->getActiveCalls();

        // Get active dispatches with responders
        $activeDispatches = $this->getActiveDispatches();

        // Get active responders
        $activeResponders = $this->getActiveResponders();

        // Get hospitals
        $hospitals = $this->getHospitalsForMap();

        // Get focused incident if specified
        $focusedIncidentId = $request->query('incident');

        // Get focused hospital if specified
        $focusedHospitalId = $request->query('hospital');

        return Inertia::render('Admin/LiveMap', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'incidents' => $incidents,
            'activeCalls' => $activeCalls,
            'activeDispatches' => $activeDispatches,
            'activeResponders' => $activeResponders,
            'hospitals' => $hospitals,
            'focusedIncidentId' => $focusedIncidentId ? (int) $focusedIncidentId : null,
            'focusedHospitalId' => $focusedHospitalId ? (int) $focusedHospitalId : null,
        ]);
    }

    /**
     * Get real-time map data via AJAX.
     */
    public function data(Request $request)
    {
        try {
            $user = $request->user();

            if (! $user || ! $user->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::debug('[LIVEMAP] Fetching map data');

            $incidents = $this->getIncidentsForMap();
            $activeCalls = $this->getActiveCalls();
            $activeDispatches = $this->getActiveDispatches();
            $activeResponders = $this->getActiveResponders();
            $hospitals = $this->getHospitalsForMap();

            return response()->json([
                'incidents' => $incidents,
                'activeCalls' => $activeCalls,
                'activeDispatches' => $activeDispatches,
                'activeResponders' => $activeResponders,
                'hospitals' => $hospitals,
            ]);
        } catch (\Exception $e) {
            Log::error('[LIVEMAP] Failed to fetch map data', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch map data',
            ], 500);
        }
    }

    /**
     * Get incidents formatted for map display.
     */
    private function getIncidentsForMap(): array
    {
        // Get incidents from last 30 days
        $incidents = Incident::with(['user:id,name,email,phone_number'])
            ->where('created_at', '>=', now()->subDays(30))
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->orderBy('created_at', 'desc')
            ->get();

        return $incidents->map(function ($incident) {
            // Check if incident has an active call
            $activeCall = Call::where('incident_id', $incident->id)
                ->where('status', 'active')
                ->first();

            return [
                'id' => $incident->id,
                'type' => $incident->type,
                'status' => $incident->status,
                'latitude' => (float) $incident->latitude,
                'longitude' => (float) $incident->longitude,
                'address' => $incident->address,
                'description' => $incident->description,
                'created_at' => $incident->created_at?->toIso8601String(),
                'dispatched_at' => $incident->dispatched_at?->toIso8601String(),
                'completed_at' => $incident->completed_at?->toIso8601String(),
                'user' => $incident->user ? [
                    'id' => $incident->user->id,
                    'name' => $incident->user->name,
                    'email' => $incident->user->email,
                    'phone_number' => $incident->user->phone_number,
                ] : null,
                'has_active_call' => $activeCall !== null,
                'call_answered' => $activeCall?->receiver_admin_id !== null,
            ];
        })->toArray();
    }

    /**
     * Get active calls for map overlay.
     */
    private function getActiveCalls(): array
    {
        $calls = Call::with(['user:id,name,email,phone_number', 'incident'])
            ->where('status', 'active')
            ->orderBy('started_at', 'desc')
            ->get();

        return $calls->map(function ($call) {
            return [
                'id' => $call->id,
                'channel_name' => $call->channel_name,
                'status' => $call->status,
                'started_at' => $call->started_at?->toIso8601String(),
                'is_answered' => $call->receiver_admin_id !== null,
                'user' => $call->user ? [
                    'id' => $call->user->id,
                    'name' => $call->user->name,
                    'email' => $call->user->email,
                    'phone_number' => $call->user->phone_number,
                ] : null,
                'incident' => $call->incident ? [
                    'id' => $call->incident->id,
                    'type' => $call->incident->type,
                    'latitude' => (float) $call->incident->latitude,
                    'longitude' => (float) $call->incident->longitude,
                    'address' => $call->incident->address,
                ] : null,
            ];
        })->toArray();
    }

    /**
     * Get active dispatches with responder and incident data.
     */
    private function getActiveDispatches(): array
    {
        $dispatches = Dispatch::with([
            'responder:id,name,email,phone_number,current_latitude,current_longitude,base_latitude,base_longitude,responder_status,location_updated_at',
            'incident:id,type,status,latitude,longitude,address',
        ])
            ->whereIn('status', ['assigned', 'accepted', 'en_route', 'arrived', 'transporting_to_hospital'])
            ->orderBy('assigned_at', 'desc')
            ->get();

        return $dispatches->map(function ($dispatch) {
            return [
                'id' => $dispatch->id,
                'incident_id' => $dispatch->incident_id,
                'responder_id' => $dispatch->responder_id,
                'status' => $dispatch->status,
                'distance_meters' => $dispatch->distance_meters,
                'distance_text' => $dispatch->formatted_distance,
                'duration_text' => $dispatch->formatted_duration,
                'assigned_at' => $dispatch->assigned_at?->toIso8601String(),
                'accepted_at' => $dispatch->accepted_at?->toIso8601String(),
                'en_route_at' => $dispatch->en_route_at?->toIso8601String(),
                'arrived_at' => $dispatch->arrived_at?->toIso8601String(),
                'responder' => $dispatch->responder ? [
                    'id' => $dispatch->responder->id,
                    'name' => $dispatch->responder->name,
                    'email' => $dispatch->responder->email,
                    'phone_number' => $dispatch->responder->phone_number,
                    'current_latitude' => $dispatch->responder->current_latitude ? (float) $dispatch->responder->current_latitude : null,
                    'current_longitude' => $dispatch->responder->current_longitude ? (float) $dispatch->responder->current_longitude : null,
                    'base_latitude' => $dispatch->responder->base_latitude ? (float) $dispatch->responder->base_latitude : null,
                    'base_longitude' => $dispatch->responder->base_longitude ? (float) $dispatch->responder->base_longitude : null,
                    'responder_status' => $dispatch->responder->responder_status,
                    'location_updated_at' => $dispatch->responder->location_updated_at?->toIso8601String(),
                ] : null,
                'incident' => $dispatch->incident ? [
                    'id' => $dispatch->incident->id,
                    'type' => $dispatch->incident->type,
                    'status' => $dispatch->incident->status,
                    'latitude' => (float) $dispatch->incident->latitude,
                    'longitude' => (float) $dispatch->incident->longitude,
                    'address' => $dispatch->incident->address,
                ] : null,
            ];
        })->toArray();
    }

    /**
     * Get all active responders with their current locations.
     * Only shows responders within 3km of any active incident.
     */
    private function getActiveResponders(): array
    {
        // Get all active/pending incidents
        $activeIncidents = Incident::whereIn('status', ['pending', 'dispatched'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        // Get all on-duty responders
        $responders = User::where('role', 'responder')
            ->where('is_on_duty', true)
            ->where(function ($query) {
                $query->whereNotNull('current_latitude')
                    ->whereNotNull('current_longitude')
                    ->orWhere(function ($q) {
                        $q->whereNotNull('base_latitude')
                            ->whereNotNull('base_longitude');
                    });
            })
            ->get();

        // Filter responders: only show those within 3km of any active incident
        $maxRadiusMeters = 1000; // 1km
        $respondersInRange = $responders->filter(function ($responder) use ($activeIncidents, $maxRadiusMeters) {
            $responderLat = $responder->current_latitude ?? $responder->base_latitude;
            $responderLon = $responder->current_longitude ?? $responder->base_longitude;

            if (is_null($responderLat) || is_null($responderLon)) {
                return false;
            }

            // Check if responder is within 3km of ANY active incident
            foreach ($activeIncidents as $incident) {
                $distance = DistanceCalculationService::calculateHaversineDistance(
                    (float) $responderLat,
                    (float) $responderLon,
                    (float) $incident->latitude,
                    (float) $incident->longitude
                );

                if ($distance <= $maxRadiusMeters) {
                    return true; // Responder is within range of at least one incident
                }
            }

            return false; // Not within range of any incident
        });

        Log::debug('[LIVEMAP] Filtered responders by 3km radius', [
            'total_responders' => $responders->count(),
            'responders_in_range' => $respondersInRange->count(),
            'active_incidents' => $activeIncidents->count(),
        ]);

        return $respondersInRange->map(function ($responder) {
            return [
                'id' => $responder->id,
                'name' => $responder->name,
                'email' => $responder->email,
                'phone_number' => $responder->phone_number,
                'current_latitude' => $responder->current_latitude ? (float) $responder->current_latitude : null,
                'current_longitude' => $responder->current_longitude ? (float) $responder->current_longitude : null,
                'base_latitude' => $responder->base_latitude ? (float) $responder->base_latitude : null,
                'base_longitude' => $responder->base_longitude ? (float) $responder->base_longitude : null,
                'responder_status' => $responder->responder_status,
                'is_on_duty' => $responder->is_on_duty,
                'location_updated_at' => $responder->location_updated_at?->toIso8601String(),
            ];
        })->values()->toArray();
    }

    /**
     * Get GPS breadcrumb trail for a specific dispatch.
     * Shows the route history of a responder during an active dispatch.
     *
     * GET /admin/dispatches/{id}/route-history
     */
    public function getRouteHistory(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (! $user || ! $user->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Verify dispatch exists
            $dispatch = \App\Models\Dispatch::findOrFail($id);

            // Get location history for this dispatch
            $history = \App\Models\ResponderLocationHistory::where('dispatch_id', $id)
                ->orderBy('created_at', 'ASC')
                ->get(['latitude', 'longitude', 'accuracy', 'created_at']);

            Log::info('[LIVEMAP] Fetched route history', [
                'dispatch_id' => $id,
                'point_count' => $history->count(),
                'admin_id' => $user->id,
            ]);

            return response()->json([
                'dispatch_id' => (int) $id,
                'responder_id' => $dispatch->responder_id,
                'incident_id' => $dispatch->incident_id,
                'route_points' => $history->map(function ($point) {
                    return [
                        'latitude' => (float) $point->latitude,
                        'longitude' => (float) $point->longitude,
                        'accuracy' => $point->accuracy ? (float) $point->accuracy : null,
                        'timestamp' => $point->created_at->toIso8601String(),
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            Log::error('[LIVEMAP] Failed to fetch route history', [
                'dispatch_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch route history',
            ], 500);
        }
    }

    /**
     * Get hospitals formatted for map display.
     */
    private function getHospitalsForMap(): array
    {
        $hospitals = Hospital::active()
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return $hospitals->map(function ($hospital) {
            return [
                'id' => $hospital->id,
                'name' => $hospital->name,
                'type' => $hospital->type,
                'address' => $hospital->address,
                'latitude' => (float) $hospital->latitude,
                'longitude' => (float) $hospital->longitude,
                'phone_number' => $hospital->phone_number,
                'specialties' => $hospital->specialties,
                'image_url' => $hospital->full_image_url,
                'has_emergency_room' => $hospital->has_emergency_room,
                'description' => $hospital->description,
                'website' => $hospital->website,
                'bed_capacity' => $hospital->bed_capacity,
            ];
        })->toArray();
    }
}
