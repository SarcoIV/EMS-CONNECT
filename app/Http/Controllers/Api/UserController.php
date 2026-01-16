<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Get authenticated user's profile
     */
    public function show(Request $request)
    {
        return response()->json([
            'message' => 'User profile retrieved successfully',
            'user' => $request->user(),
        ]);
    }

    /**
     * Update authenticated user's profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'phone_number' => 'sometimes|string|max:20',
            // Responder fields
            'badge_number' => 'sometimes|string|max:50',
            'hospital_assigned' => 'sometimes|string|max:255',
            // Medical fields (for community users)
            'blood_type' => 'sometimes|string|max:10',
            'allergies' => 'sometimes|string|max:1000',
            'existing_conditions' => 'sometimes|string|max:1000',
            'medications' => 'sometimes|string|max:1000',
        ]);

        // Filter fields based on user role
        $allowedFields = ['name', 'first_name', 'last_name', 'phone_number'];

        if ($user->isResponder()) {
            // Responders can update badge_number and hospital_assigned
            $allowedFields = array_merge($allowedFields, ['badge_number', 'hospital_assigned']);
        } elseif ($user->isCommunity()) {
            // Community users can update medical fields
            $allowedFields = array_merge($allowedFields, [
                'blood_type',
                'allergies',
                'existing_conditions',
                'medications',
            ]);
        }

        // Only update fields that are allowed for this user's role
        $filteredData = array_intersect_key($validated, array_flip($allowedFields));

        $user->update($filteredData);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Change authenticated user's password
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        // Verify current password
        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect',
                'errors' => [
                    'current_password' => ['The current password is incorrect.'],
                ],
            ], 422);
        }

        // Ensure new password is different from current
        if (Hash::check($validated['new_password'], $user->password)) {
            return response()->json([
                'message' => 'New password must be different from current password',
                'errors' => [
                    'new_password' => ['New password must be different from current password.'],
                ],
            ], 422);
        }

        $user->update([
            'password' => $validated['new_password'],
        ]);

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }
}
