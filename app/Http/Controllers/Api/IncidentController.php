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
                'errors' => $validator->errors()
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

