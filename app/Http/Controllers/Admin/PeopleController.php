<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class PeopleController extends Controller
{
    /**
     * Display the people management page.
     */
    public function index()
    {
        $user = Auth::user();

        // Get all users (residents/community members)
        $users = User::where('user_role', 'user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'role' => $user->role, // Mobile app role (community/responder)
                    'email_verified' => $user->email_verified,
                    'created_at' => $user->created_at?->toIso8601String(),
                    'last_login_at' => $user->last_login_at?->toIso8601String(),
                    'incident_count' => $user->incidents()->count(),
                ];
            });

        // Get all admins
        $admins = User::where('user_role', 'admin')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($admin) {
                return [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'phone_number' => $admin->phone_number,
                    'created_at' => $admin->created_at?->toIso8601String(),
                    'last_login_at' => $admin->last_login_at?->toIso8601String(),
                ];
            });

        // Get statistics
        $stats = [
            'totalUsers' => User::where('user_role', 'user')->count(),
            'verifiedUsers' => User::where('user_role', 'user')->where('email_verified', true)->count(),
            'totalAdmins' => User::where('user_role', 'admin')->count(),
            'activeToday' => User::where('last_login_at', '>=', now()->startOfDay())->count(),
        ];

        return Inertia::render('Admin/People', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'users' => $users,
            'admins' => $admins,
            'stats' => $stats,
        ]);
    }

    /**
     * Get user details with incident history.
     */
    public function show(Request $request, $id)
    {
        try {
            $authUser = $request->user();

            if (!$authUser || !$authUser->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $user = User::findOrFail($id);

            // Get user's incident history
            $incidents = Incident::where('user_id', $id)
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get()
                ->map(function ($incident) {
                    return [
                        'id' => $incident->id,
                        'type' => $incident->type,
                        'status' => $incident->status,
                        'address' => $incident->address,
                        'created_at' => $incident->created_at?->toIso8601String(),
                    ];
                });

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'role' => $user->role,
                    'user_role' => $user->user_role,
                    'email_verified' => $user->email_verified,
                    'created_at' => $user->created_at?->toIso8601String(),
                    'last_login_at' => $user->last_login_at?->toIso8601String(),
                ],
                'incidents' => $incidents,
            ]);
        } catch (\Exception $e) {
            Log::error('[PEOPLE] Failed to fetch user details', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch user details',
            ], 500);
        }
    }

    /**
     * Toggle user account status (activate/deactivate).
     */
    public function toggleStatus(Request $request, $id)
    {
        try {
            $authUser = $request->user();

            if (!$authUser || !$authUser->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $user = User::findOrFail($id);

            // Prevent deactivating yourself
            if ($user->id === $authUser->id) {
                return response()->json([
                    'message' => 'You cannot deactivate your own account',
                ], 400);
            }

            // Toggle email_verified as activation status
            $user->email_verified = !$user->email_verified;
            $user->save();

            Log::info('[PEOPLE] User status toggled', [
                'target_user_id' => $user->id,
                'new_status' => $user->email_verified ? 'active' : 'inactive',
                'admin_id' => $authUser->id,
            ]);

            return response()->json([
                'message' => $user->email_verified ? 'User activated' : 'User deactivated',
                'user' => [
                    'id' => $user->id,
                    'email_verified' => $user->email_verified,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('[PEOPLE] Failed to toggle user status', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to update user status',
            ], 500);
        }
    }

    /**
     * Create a new admin account.
     */
    public function createAdmin(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
        ]);

        try {
            $authUser = $request->user();

            if (!$authUser || !$authUser->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $admin = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'user_role' => 'admin',
                'email_verified' => true,
                'email_verified_at' => now(),
            ]);

            Log::info('[PEOPLE] New admin created', [
                'new_admin_id' => $admin->id,
                'created_by' => $authUser->id,
            ]);

            return response()->json([
                'message' => 'Admin account created successfully',
                'admin' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'created_at' => $admin->created_at?->toIso8601String(),
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('[PEOPLE] Failed to create admin', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to create admin account',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Delete/disable an admin account.
     */
    public function deleteAdmin(Request $request, $id)
    {
        try {
            $authUser = $request->user();

            if (!$authUser || !$authUser->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $admin = User::where('user_role', 'admin')->findOrFail($id);

            // Prevent deleting yourself
            if ($admin->id === $authUser->id) {
                return response()->json([
                    'message' => 'You cannot delete your own account',
                ], 400);
            }

            // Soft delete by changing role
            $admin->user_role = 'user';
            $admin->save();

            Log::info('[PEOPLE] Admin demoted to user', [
                'demoted_admin_id' => $admin->id,
                'demoted_by' => $authUser->id,
            ]);

            return response()->json([
                'message' => 'Admin access removed',
            ]);
        } catch (\Exception $e) {
            Log::error('[PEOPLE] Failed to delete admin', [
                'admin_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to remove admin access',
            ], 500);
        }
    }
}
