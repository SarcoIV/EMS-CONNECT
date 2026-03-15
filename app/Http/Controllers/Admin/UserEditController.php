<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UserEditController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $admins = User::where('user_role', 'admin')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($admin) {
                return [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'phone_number' => $admin->phone_number,
                    'is_active' => (bool) $admin->email_verified,
                ];
            });

        return Inertia::render('Admin/UserEdit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'admins' => $admins,
        ]);
    }

    public function toggleStatus(Request $request, $id)
    {
        try {
            $authUser = $request->user();

            if (! $authUser || ! $authUser->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $admin = User::where('user_role', 'admin')->findOrFail($id);

            if ($admin->id === $authUser->id) {
                return response()->json([
                    'message' => 'You cannot deactivate your own account',
                ], 400);
            }

            $admin->email_verified = ! $admin->email_verified;
            $admin->save();

            Log::info('[USER-EDIT] Admin status toggled', [
                'target_admin_id' => $admin->id,
                'new_status' => $admin->email_verified ? 'active' : 'inactive',
                'toggled_by' => $authUser->id,
            ]);

            return response()->json([
                'message' => $admin->email_verified ? 'Admin activated' : 'Admin deactivated',
                'admin' => [
                    'id' => $admin->id,
                    'is_active' => (bool) $admin->email_verified,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('[USER-EDIT] Failed to toggle admin status', [
                'admin_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to update admin status',
            ], 500);
        }
    }
}
