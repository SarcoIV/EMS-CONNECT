<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display the settings page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = Auth::user();

        return Inertia::render('Admin/Settings', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'success' => session('success'),
        ]);
    }

    /**
     * Update the user's profile information.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user = Auth::user();

        $user->update([
            'name' => $request->name,
        ]);

        return redirect()->route('admin.settings')->with('success', 'Profile updated successfully.');
    }

    /**
     * Update the user's password.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
        ]);

        $user = Auth::user();

        // Verify the current password
        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password does not match your current password.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return redirect()->route('admin.settings')->with('success', 'Password updated successfully.');
    }
}
