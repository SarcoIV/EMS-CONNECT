<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ArchiveController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $status = $request->query('status', 'all');
        $type = $request->query('type', 'all');
        $search = $request->query('search');

        $query = Incident::with(['user:id,name,email,phone_number'])
            ->whereIn('status', ['completed', 'cancelled']);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($type !== 'all') {
            $query->where('type', $type);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $incidents = $query->orderBy('completed_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($incident) {
                return [
                    'id' => $incident->id,
                    'type' => $incident->type,
                    'status' => $incident->status,
                    'address' => $incident->address,
                    'description' => $incident->description,
                    'created_at' => $incident->created_at?->toIso8601String(),
                    'completed_at' => $incident->completed_at?->toIso8601String(),
                    'user' => $incident->user ? [
                        'id' => $incident->user->id,
                        'name' => $incident->user->name,
                    ] : null,
                ];
            });

        $stats = [
            'total' => Incident::whereIn('status', ['completed', 'cancelled'])->count(),
            'completed' => Incident::where('status', 'completed')->count(),
            'cancelled' => Incident::where('status', 'cancelled')->count(),
        ];

        return Inertia::render('Admin/Archive', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'incidents' => $incidents,
            'stats' => $stats,
            'filters' => [
                'status' => $status,
                'type' => $type,
                'search' => $search,
            ],
        ]);
    }
}
