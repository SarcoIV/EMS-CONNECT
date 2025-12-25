<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the admin dashboard.
     */
    public function index()
    {
        $user = Auth::user();

        // Get emergency statistics
        $stats = $this->getEmergencyStats();

        // Get recent incidents
        $recentIncidents = $this->getRecentIncidents();

        // Get active calls
        $activeCalls = $this->getActiveCalls();

        // Get incident type distribution
        $incidentTypes = $this->getIncidentTypeDistribution();

        // Get monthly trend data
        $monthlyTrend = $this->getMonthlyTrend();

        return Inertia::render('Admin/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'stats' => $stats,
            'recentIncidents' => $recentIncidents,
            'activeCalls' => $activeCalls,
            'incidentTypes' => $incidentTypes,
            'monthlyTrend' => $monthlyTrend,
        ]);
    }

    /**
     * Get real-time dashboard stats via AJAX.
     */
    public function stats(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::debug('[DASHBOARD] Fetching real-time stats for admin', [
                'admin_id' => $user->id,
            ]);

            $stats = $this->getEmergencyStats();
            $recentIncidents = $this->getRecentIncidents(10);
            $activeCalls = $this->getActiveCalls();
            $incidentTypes = $this->getIncidentTypeDistribution();

            return response()->json([
                'stats' => $stats,
                'recentIncidents' => $recentIncidents,
                'activeCalls' => $activeCalls,
                'incidentTypes' => $incidentTypes,
            ]);
        } catch (\Exception $e) {
            Log::error('[DASHBOARD] Failed to fetch stats', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch stats',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get emergency statistics.
     */
    private function getEmergencyStats(): array
    {
        $today = now()->startOfDay();
        $thisMonth = now()->startOfMonth();

        return [
            // Total counts
            'totalIncidents' => Incident::count(),
            'totalUsers' => User::where('user_role', 'user')->count(),
            'totalAdmins' => User::where('user_role', 'admin')->count(),

            // Status-based counts
            'pendingIncidents' => Incident::where('status', 'pending')->count(),
            'dispatchedIncidents' => Incident::where('status', 'dispatched')->count(),
            'inProgressIncidents' => Incident::whereIn('status', ['pending', 'dispatched'])->count(),
            'completedIncidents' => Incident::where('status', 'completed')->count(),
            'cancelledIncidents' => Incident::where('status', 'cancelled')->count(),

            // Time-based counts
            'todayIncidents' => Incident::where('created_at', '>=', $today)->count(),
            'monthIncidents' => Incident::where('created_at', '>=', $thisMonth)->count(),

            // Call stats
            'activeCalls' => Call::where('status', 'active')->count(),
            'totalCalls' => Call::count(),
            'todayCalls' => Call::where('created_at', '>=', $today)->count(),
        ];
    }

    /**
     * Get recent incidents.
     */
    private function getRecentIncidents(int $limit = 10): array
    {
        $incidents = Incident::with([
            'user:id,name,email,phone_number',
            'dispatches' => function ($query) {
                $query->whereIn('status', ['assigned', 'accepted', 'en_route', 'arrived'])
                      ->orderBy('assigned_at', 'desc');
            },
            'dispatches.responder:id,name,current_latitude,current_longitude,responder_status,location_updated_at'
        ])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $incidents->map(function ($incident) {
            return [
                'id' => $incident->id,
                'type' => $incident->type,
                'status' => $incident->status,
                'address' => $incident->address,
                'latitude' => (float) $incident->latitude,
                'longitude' => (float) $incident->longitude,
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
                'dispatches' => $incident->dispatches->map(function ($dispatch) {
                    return [
                        'id' => $dispatch->id,
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
                            'current_latitude' => $dispatch->responder->current_latitude ? (float) $dispatch->responder->current_latitude : null,
                            'current_longitude' => $dispatch->responder->current_longitude ? (float) $dispatch->responder->current_longitude : null,
                            'responder_status' => $dispatch->responder->responder_status,
                            'location_updated_at' => $dispatch->responder->location_updated_at?->toIso8601String(),
                        ] : null,
                    ];
                })->toArray(),
            ];
        })->toArray();
    }

    /**
     * Get active calls.
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
                'answered_at' => $call->answered_at?->toIso8601String(),
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
                    'status' => $call->incident->status,
                ] : null,
            ];
        })->toArray();
    }

    /**
     * Get incident type distribution for pie chart.
     */
    private function getIncidentTypeDistribution(): array
    {
        $types = Incident::select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get();

        $total = $types->sum('count');

        if ($total === 0) {
            return [];
        }

        $colors = [
            'medical' => '#10b981',
            'fire' => '#f97316',
            'accident' => '#38bdf8',
            'crime' => '#ef4444',
            'natural_disaster' => '#8b5cf6',
            'other' => '#6b7280',
        ];

        return $types->map(function ($type) use ($total, $colors) {
            $percentage = round(($type->count / $total) * 100, 1);
            return [
                'name' => ucfirst(str_replace('_', ' ', $type->type)),
                'value' => $percentage,
                'count' => $type->count,
                'color' => $colors[$type->type] ?? '#6b7280',
            ];
        })->toArray();
    }

    /**
     * Get monthly incident trend.
     */
    private function getMonthlyTrend(): array
    {
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            $incidents = Incident::whereBetween('created_at', [$startOfMonth, $endOfMonth])->get();

            $months[] = [
                'month' => $date->format('M Y'),
                'total' => $incidents->count(),
                'pending' => $incidents->where('status', 'pending')->count(),
                'dispatched' => $incidents->where('status', 'dispatched')->count(),
                'completed' => $incidents->where('status', 'completed')->count(),
            ];
        }

        return $months;
    }

    /**
     * Update incident status (quick action).
     */
    public function updateIncidentStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,dispatched,in_progress,completed,cancelled'],
        ]);

        try {
            $user = $request->user();

            if (!$user || !$user->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $incident = Incident::findOrFail($id);

            $oldStatus = $incident->status;
            $incident->status = $validated['status'];

            // Set timestamps based on status
            if ($validated['status'] === 'dispatched' && !$incident->dispatched_at) {
                $incident->dispatched_at = now();
                $incident->assigned_admin_id = $user->id;
            }

            if ($validated['status'] === 'completed' && !$incident->completed_at) {
                $incident->completed_at = now();
            }

            $incident->save();

            Log::info('[DASHBOARD] Incident status updated', [
                'incident_id' => $incident->id,
                'old_status' => $oldStatus,
                'new_status' => $validated['status'],
                'admin_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Incident status updated successfully',
                'incident' => [
                    'id' => $incident->id,
                    'status' => $incident->status,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('[DASHBOARD] Failed to update incident status', [
                'incident_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to update incident status',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Dispatch an incident (pending → dispatched).
     * 
     * This is the admin workflow step: verify incident → dispatch.
     */
    public function dispatch(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $incident = Incident::findOrFail($id);

            // Validate that incident is in pending status
            if ($incident->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending incidents can be dispatched.',
                    'errors' => [
                        'status' => ['This incident has already been processed. Current status: ' . $incident->status]
                    ]
                ], 422);
            }

            // Update status to dispatched
            $incident->status = 'dispatched';
            $incident->dispatched_at = now();
            $incident->assigned_admin_id = $user->id;
            $incident->save();

            Log::info('[DISPATCH] ✅ Incident dispatched', [
                'incident_id' => $incident->id,
                'incident_type' => $incident->type,
                'reporter_id' => $incident->user_id,
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'dispatched_at' => $incident->dispatched_at?->toIso8601String(),
            ]);

            return response()->json([
                'message' => 'Incident dispatched successfully',
                'incident' => [
                    'id' => $incident->id,
                    'status' => $incident->status,
                    'dispatched_at' => $incident->dispatched_at?->toIso8601String(),
                    'assigned_admin_id' => $incident->assigned_admin_id,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('[DISPATCH] ❌ Failed to dispatch incident', [
                'incident_id' => $id,
                'admin_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to dispatch incident',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
