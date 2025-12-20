<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class IncidentController extends Controller
{
    /**
     * Create a new emergency incident.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => ['required', 'in:medical,fire,accident,other'],
            'location' => ['required', 'array'],
            'location.latitude' => ['required', 'numeric', 'between:-90,90'],
            'location.longitude' => ['required', 'numeric', 'between:-180,180'],
            'location.address' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:1000'],
        ], [
            'type.required' => 'Emergency type is required.',
            'type.in' => 'Invalid emergency type. Must be: medical, fire, accident, or other.',
            'location.required' => 'Location is required.',
            'location.latitude.required' => 'Latitude is required.',
            'location.latitude.numeric' => 'Latitude must be a valid number.',
            'location.latitude.between' => 'Latitude must be between -90 and 90.',
            'location.longitude.required' => 'Longitude is required.',
            'location.longitude.numeric' => 'Longitude must be a valid number.',
            'location.longitude.between' => 'Longitude must be between -180 and 180.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();

            $incident = Incident::create([
                'user_id' => $user->id,
                'type' => $request->type,
                'status' => 'pending',
                'latitude' => $request->input('location.latitude'),
                'longitude' => $request->input('location.longitude'),
                'address' => $request->input('location.address'),
                'description' => $request->description,
            ]);

            Log::info('Emergency incident created', [
                'incident_id' => $incident->id,
                'user_id' => $user->id,
                'type' => $incident->type,
                'location' => [
                    'lat' => $incident->latitude,
                    'lng' => $incident->longitude,
                ],
            ]);

            return response()->json([
                'incident' => $this->formatIncident($incident),
                'message' => 'Emergency alert sent successfully. Help is on the way!'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create incident: ' . $e->getMessage());

            return response()->json([
                'message' => 'An error occurred while creating the emergency alert. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get all incidents for the authenticated user.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function myIncidents(Request $request)
    {
        try {
            $user = $request->user();

            $incidents = Incident::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($incident) => $this->formatIncident($incident));

            return response()->json([
                'incidents' => $incidents
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to fetch user incidents: ' . $e->getMessage());

            return response()->json([
                'message' => 'An error occurred while fetching incidents.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get a specific incident.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, int $id)
    {
        try {
            $user = $request->user();

            $incident = Incident::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$incident) {
                return response()->json([
                    'message' => 'Incident not found.',
                    'errors' => ['incident' => ['The specified incident does not exist or you do not have access to it.']]
                ], 404);
            }

            return response()->json([
                'incident' => $this->formatIncident($incident)
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to fetch incident: ' . $e->getMessage());

            return response()->json([
                'message' => 'An error occurred while fetching the incident.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Cancel an incident.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel(Request $request, int $id)
    {
        try {
            $user = $request->user();

            $incident = Incident::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$incident) {
                return response()->json([
                    'message' => 'Incident not found.',
                    'errors' => ['incident' => ['The specified incident does not exist or you do not have access to it.']]
                ], 404);
            }

            if (!$incident->canBeCancelled()) {
                return response()->json([
                    'message' => 'Incident cannot be cancelled.',
                    'errors' => ['incident' => ['This incident has already been completed or cancelled.']]
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
                'message' => 'Incident cancelled successfully.'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to cancel incident: ' . $e->getMessage());

            return response()->json([
                'message' => 'An error occurred while cancelling the incident.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Format incident for API response.
     *
     * @param Incident $incident
     * @return array
     */
    private function formatIncident(Incident $incident): array
    {
        return [
            'id' => $incident->id,
            'user_id' => $incident->user_id,
            'type' => $incident->type,
            'status' => $incident->status,
            'location' => [
                'latitude' => (float) $incident->latitude,
                'longitude' => (float) $incident->longitude,
                'address' => $incident->address,
            ],
            'description' => $incident->description,
            'assigned_unit' => $incident->assigned_unit,
            'created_at' => $incident->created_at?->toIso8601String(),
            'updated_at' => $incident->updated_at?->toIso8601String(),
            'dispatched_at' => $incident->dispatched_at?->toIso8601String(),
            'completed_at' => $incident->completed_at?->toIso8601String(),
        ];
    }
}
