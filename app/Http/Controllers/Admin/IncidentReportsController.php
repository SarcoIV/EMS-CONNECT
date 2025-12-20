<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class IncidentReportsController extends Controller
{
    /**
     * Display the incident reports page.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Get filter parameters
        $status = $request->query('status', 'all');
        $type = $request->query('type', 'all');
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $search = $request->query('search');

        // Build query
        $query = Incident::with(['user:id,name,email,phone_number']);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($type !== 'all') {
            $query->where('type', $type);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Get paginated results
        $incidents = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($incident) {
                return [
                    'id' => $incident->id,
                    'type' => $incident->type,
                    'status' => $incident->status,
                    'address' => $incident->address,
                    'description' => $incident->description,
                    'latitude' => $incident->latitude,
                    'longitude' => $incident->longitude,
                    'created_at' => $incident->created_at?->toIso8601String(),
                    'dispatched_at' => $incident->dispatched_at?->toIso8601String(),
                    'completed_at' => $incident->completed_at?->toIso8601String(),
                    'user' => $incident->user ? [
                        'id' => $incident->user->id,
                        'name' => $incident->user->name,
                        'email' => $incident->user->email,
                        'phone_number' => $incident->user->phone_number,
                    ] : null,
                ];
            });

        // Get summary statistics
        $stats = [
            'total' => Incident::count(),
            'pending' => Incident::where('status', 'pending')->count(),
            'dispatched' => Incident::where('status', 'dispatched')->count(),
            'in_progress' => Incident::where('status', 'in_progress')->count(),
            'completed' => Incident::where('status', 'completed')->count(),
            'cancelled' => Incident::where('status', 'cancelled')->count(),
        ];

        // Get incident types for filter dropdown
        $incidentTypes = Incident::select('type')
            ->distinct()
            ->pluck('type')
            ->filter()
            ->values();

        // Get trend data (last 7 days)
        $trendData = Incident::selectRaw("DATE(created_at) as date, COUNT(*) as count")
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'count' => $item->count,
                ];
            });

        // Get type distribution
        $typeDistribution = Incident::selectRaw("type, COUNT(*) as count")
            ->groupBy('type')
            ->get()
            ->map(function ($item) {
                $colors = [
                    'medical' => '#10b981',
                    'fire' => '#ef4444',
                    'accident' => '#f59e0b',
                    'crime' => '#8b5cf6',
                    'natural_disaster' => '#3b82f6',
                    'other' => '#6b7280',
                ];
                return [
                    'type' => $item->type ?? 'unknown',
                    'count' => $item->count,
                    'color' => $colors[$item->type] ?? '#6b7280',
                ];
            });

        return Inertia::render('Admin/IncidentReports', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'incidents' => $incidents,
            'stats' => $stats,
            'incidentTypes' => $incidentTypes,
            'trendData' => $trendData,
            'typeDistribution' => $typeDistribution,
            'filters' => [
                'status' => $status,
                'type' => $type,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Export incidents to CSV.
     */
    public function export(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $incidents = Incident::with(['user:id,name,email,phone_number'])
            ->orderBy('created_at', 'desc')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="incidents_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($incidents) {
            $file = fopen('php://output', 'w');
            
            // Header row
            fputcsv($file, [
                'ID',
                'Type',
                'Status',
                'Reporter Name',
                'Reporter Email',
                'Reporter Phone',
                'Address',
                'Description',
                'Latitude',
                'Longitude',
                'Created At',
                'Dispatched At',
                'Completed At',
            ]);

            // Data rows
            foreach ($incidents as $incident) {
                fputcsv($file, [
                    $incident->id,
                    $incident->type,
                    $incident->status,
                    $incident->user?->name,
                    $incident->user?->email,
                    $incident->user?->phone_number,
                    $incident->address,
                    $incident->description,
                    $incident->latitude,
                    $incident->longitude,
                    $incident->created_at?->toDateTimeString(),
                    $incident->dispatched_at?->toDateTimeString(),
                    $incident->completed_at?->toDateTimeString(),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

