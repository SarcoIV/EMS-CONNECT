<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\Incident;
use App\Services\GoogleMapsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class IncidentManagementController extends Controller
{
    private GoogleMapsService $googleMapsService;

    public function __construct(GoogleMapsService $googleMapsService)
    {
        $this->googleMapsService = $googleMapsService;
    }

    /**
     * Create incident on behalf of community user during call.
     * POST /admin/incidents/create
     */
    public function store(Request $request)
    {
        // Validate input
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'call_id' => ['nullable', 'exists:calls,id'],
            'type' => ['required', 'in:medical,fire,accident,crime,natural_disaster,other'],
            'address' => ['required', 'string', 'max:500'],
            'description' => ['required', 'string', 'max:1000'],
            // Optional manual coordinates (if geocoding fails)
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        try {
            // Geocode address if coordinates not provided
            if (! isset($validated['latitude']) || ! isset($validated['longitude'])) {
                $geocoded = $this->googleMapsService->geocodeAddress($validated['address']);
                $validated['latitude'] = $geocoded['latitude'];
                $validated['longitude'] = $geocoded['longitude'];
                // Optionally update address with formatted version
                $validated['address'] = $geocoded['formatted_address'];
            }

            // Create incident with caller as reporter
            $incident = Incident::create([
                'user_id' => $validated['user_id'],
                'type' => $validated['type'],
                'status' => 'pending',
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'address' => $validated['address'],
                'description' => $validated['description'],
                'assigned_admin_id' => $request->user()->id,
            ]);

            // Link call to incident if call_id provided
            if (! empty($validated['call_id'])) {
                $call = Call::find($validated['call_id']);
                if ($call && $call->user_id == $validated['user_id']) {
                    $call->update(['incident_id' => $incident->id]);
                }
            }

            Log::info('[ADMIN_INCIDENT] Created incident during call', [
                'incident_id' => $incident->id,
                'admin_id' => $request->user()->id,
                'caller_id' => $validated['user_id'],
                'call_id' => $validated['call_id'] ?? null,
            ]);

            return response()->json([
                'message' => 'Incident created successfully',
                'incident' => [
                    'id' => $incident->id,
                    'type' => $incident->type,
                    'status' => $incident->status,
                    'address' => $incident->address,
                    'latitude' => $incident->latitude,
                    'longitude' => $incident->longitude,
                ],
            ], 201);

        } catch (\Exception $e) {
            Log::error('[ADMIN_INCIDENT] Failed to create incident', [
                'error' => $e->getMessage(),
                'admin_id' => $request->user()->id,
            ]);

            return response()->json([
                'message' => 'Failed to create incident: '.$e->getMessage(),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
