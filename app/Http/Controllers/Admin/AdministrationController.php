<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dispatch;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdministrationController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Calculate Total Availability (available responders)
        $totalAvailability = User::where('role', 'responder')
            ->where('email_verified', true)
            ->where('is_on_duty', true)
            ->whereDoesntHave('dispatches', function ($query) {
                $query->whereIn('status', ['assigned', 'accepted', 'en_route', 'arrived', 'transporting_to_hospital']);
            })
            ->count();

        // Calculate Live Status of Units (active/total)
        $totalResponders = User::where('role', 'responder')
            ->where('email_verified', true)
            ->count();

        $activeResponders = User::where('role', 'responder')
            ->where('email_verified', true)
            ->where('is_on_duty', true)
            ->whereHas('dispatches', function ($query) {
                $query->whereIn('status', ['assigned', 'accepted', 'en_route', 'arrived', 'transporting_to_hospital']);
            })
            ->count();

        // Calculate Total Active Units (active dispatches)
        $totalActiveUnits = Dispatch::whereIn('status', ['assigned', 'accepted', 'en_route', 'arrived', 'transporting_to_hospital'])
            ->count();

        // Get EMS Monitoring Activities (recent dispatches with details)
        $emsActivities = Dispatch::with(['incident', 'responder', 'incident.user'])
            ->whereIn('status', ['arrived', 'completed', 'cancelled'])
            ->orderBy('updated_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($dispatch) {
                $incident = $dispatch->incident;
                $responder = $dispatch->responder;

                // Calculate hours worked (from assigned to completed/current)
                $startTime = $dispatch->accepted_at ?? $dispatch->assigned_at;
                $endTime = $dispatch->completed_at ?? now();
                $hoursWorked = $startTime ? round($startTime->diffInMinutes($endTime) / 60, 1) : 0;

                // Determine activity based on dispatch status progression
                $activity = $this->getActivityDescription($dispatch, $incident);

                return [
                    'date' => $dispatch->assigned_at?->format('Y-m-d') ?? 'N/A',
                    'location' => $incident->address ?? 'Unknown Location',
                    'incidentId' => 'INC' . str_pad($incident->id, 6, '0', STR_PAD_LEFT),
                    'role' => $responder->role === 'responder' ? 'EMT' : 'Paramedic',
                    'activity' => $activity,
                    'hours' => number_format($hoursWorked, 1),
                    'status' => ucfirst($dispatch->status),
                ];
            });

        return Inertia::render('Admin/Administration', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'stats' => [
                'totalAvailability' => $totalAvailability,
                'activeResponders' => $activeResponders,
                'totalResponders' => $totalResponders,
                'totalActiveUnits' => $totalActiveUnits,
            ],
            'emsActivities' => $emsActivities,
        ]);
    }

    /**
     * Generate activity description based on dispatch and incident
     */
    private function getActivityDescription($dispatch, $incident)
    {
        $type = $incident->type ?? 'emergency';

        $activities = [
            'medical' => 'Responded to medical emergency',
            'fire' => 'Responded to fire incident',
            'accident' => 'Responded to traffic accident',
            'crime' => 'Responded to crime scene',
            'natural_disaster' => 'Responded to natural disaster',
            'other' => 'Emergency response',
        ];

        $baseActivity = $activities[$type] ?? 'Emergency response';

        // Add status-based details
        if ($dispatch->status === 'completed') {
            return $baseActivity . ' - Completed';
        } elseif ($dispatch->status === 'arrived') {
            return $baseActivity . ' - On scene';
        } elseif ($dispatch->status === 'cancelled') {
            return $baseActivity . ' - Cancelled';
        }

        return $baseActivity;
    }
}
