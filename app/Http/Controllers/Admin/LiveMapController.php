<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\Incident;
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

        // Get focused incident if specified
        $focusedIncidentId = $request->query('incident');

        return Inertia::render('Admin/LiveMap', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'incidents' => $incidents,
            'activeCalls' => $activeCalls,
            'focusedIncidentId' => $focusedIncidentId ? (int) $focusedIncidentId : null,
        ]);
    }

    /**
     * Get real-time map data via AJAX.
     */
    public function data(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::debug('[LIVEMAP] Fetching map data');

            $incidents = $this->getIncidentsForMap();
            $activeCalls = $this->getActiveCalls();

            return response()->json([
                'incidents' => $incidents,
                'activeCalls' => $activeCalls,
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
}

