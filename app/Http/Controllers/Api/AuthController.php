<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\VerificationService;
use App\Mail\VerificationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle mobile app login
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // Verify credentials
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect or you do not have access to the mobile app.',
                'errors' => [
                    'email' => ['The provided credentials are incorrect or you do not have access to the mobile app.']
                ]
            ], 422);
        }

        // Check if user has mobile role
        if (!in_array($user->role, ['responder', 'community'])) {
            return response()->json([
                'message' => 'The provided credentials are incorrect or you do not have access to the mobile app.',
                'errors' => [
                    'email' => ['The provided credentials are incorrect or you do not have access to the mobile app.']
                ]
            ], 422);
        }

        // Check if email is verified (for community users)
        if ($user->role === 'community' && !$user->email_verified) {
            return response()->json([
                'message' => 'Please verify your email address before logging in.',
                'errors' => [
                    'email' => ['Your email address has not been verified. Please check your email for the verification code.']
                ],
                'requires_verification' => true
            ], 422);
        }

        // Update last login timestamp
        $user->update(['last_login_at' => now()]);

        // Create token
        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'role' => $user->role,
        ]);
    }

    /**
     * Register a new community/resident user
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function signup(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'first_name' => ['required', 'string', 'min:2', 'max:255'],
            'last_name' => ['required', 'string', 'min:2', 'max:255'],
            'username' => ['required', 'string', 'min:3', 'max:255', 'unique:users,username', 'regex:/^[a-zA-Z0-9_]+$/'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone_number' => ['required', 'string', 'max:20'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
            ],
        ], [
            'first_name.required' => 'The first name field is required.',
            'first_name.min' => 'The first name must be at least 2 characters.',
            'last_name.required' => 'The last name field is required.',
            'last_name.min' => 'The last name must be at least 2 characters.',
            'username.required' => 'The username field is required.',
            'username.min' => 'The username must be at least 3 characters.',
            'username.unique' => 'This username is already taken.',
            'username.regex' => 'Username can only contain letters, numbers, and underscores.',
            'email.required' => 'The email field is required.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email is already registered.',
            'phone_number.required' => 'The phone number field is required.',
            'password.required' => 'The password field is required.',
            'password.confirmed' => 'The password confirmation does not match.',
            'password.min' => 'The password must be at least 8 characters.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generate verification code
            $verificationCode = VerificationService::generateCode();

            // Create the user (unverified)
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->last_name,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'username' => $request->username,
                'email' => $request->email,
                'phone_number' => $request->phone_number,
                'password' => Hash::make($request->password),
                'role' => 'community', // Automatically assign community role
                'user_role' => 'user', // Default web role
                'email_verified' => false,
                'verification_code' => Hash::make($verificationCode),
                'verification_code_expires_at' => now()->addMinutes(15),
            ]);

            // Store code in cache for quick verification
            VerificationService::storeCode($request->email, $verificationCode);

            // Send verification email
            try {
                Mail::to($user->email)->send(new VerificationMail($verificationCode, $user->first_name));
            } catch (\Exception $mailException) {
                Log::error('Failed to send verification email: ' . $mailException->getMessage());
                // Don't fail registration if email fails, but log it
            }

            return response()->json([
                'message' => 'Registration successful. Please check your email for verification code.',
                'email' => $user->email,
                'requires_verification' => true
            ], 201);

        } catch (\Exception $e) {
            Log::error('Signup error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'An error occurred while creating your account. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Verify email with code
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'size:6', 'regex:/^[0-9]{6}$/'],
        ], [
            'email.required' => 'Email is required.',
            'email.email' => 'Please provide a valid email address.',
            'code.required' => 'Verification code is required.',
            'code.size' => 'Verification code must be 6 digits.',
            'code.regex' => 'Verification code must be 6 digits.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'message' => 'User not found.',
                    'errors' => ['email' => ['No account found with this email address.']]
                ], 404);
            }

            if ($user->email_verified) {
                return response()->json([
                    'message' => 'Email is already verified.',
                    'errors' => ['email' => ['This email has already been verified.']]
                ], 422);
            }

            // Check if code is expired
            if (VerificationService::isCodeExpired($request->email)) {
                return response()->json([
                    'message' => 'Verification code has expired.',
                    'errors' => ['code' => ['The verification code has expired. Please request a new one.']]
                ], 422);
            }

            // Verify code
            if (!VerificationService::verifyCode($request->email, $request->code)) {
                return response()->json([
                    'message' => 'Invalid verification code.',
                    'errors' => ['code' => ['The verification code is incorrect.']]
                ], 422);
            }

            // Mark email as verified
            $user->update([
                'email_verified' => true,
                'email_verified_at' => now(),
                'verification_code' => null,
                'verification_code_expires_at' => null,
            ]);

            // Delete verification code from cache
            VerificationService::deleteCode($request->email);

            // Create Sanctum token
            $token = $user->createToken('mobile-app')->plainTextToken;

            // Update last login timestamp
            $user->update(['last_login_at' => now()]);

            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'role' => $user->role,
                'message' => 'Email verified successfully. Welcome to EMS Connect!'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Email verification error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'An error occurred during verification. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Resend verification code
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resendVerificationCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'Email is required.',
            'email.email' => 'Please provide a valid email address.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'message' => 'User not found.',
                    'errors' => ['email' => ['No account found with this email address.']]
                ], 404);
            }

            if ($user->email_verified) {
                return response()->json([
                    'message' => 'Email is already verified.',
                    'errors' => ['email' => ['This email has already been verified.']]
                ], 422);
            }

            // Generate new verification code
            $verificationCode = VerificationService::generateCode();

            // Update user with new code
            $user->update([
                'verification_code' => Hash::make($verificationCode),
                'verification_code_expires_at' => now()->addMinutes(15),
            ]);

            // Store code in cache
            VerificationService::storeCode($request->email, $verificationCode);

            // Send verification email
            try {
                Mail::to($user->email)->send(new VerificationMail($verificationCode, $user->first_name ?? $user->name));
            } catch (\Exception $mailException) {
                Log::error('Failed to resend verification email: ' . $mailException->getMessage());
                
                return response()->json([
                    'message' => 'Failed to send verification email. Please try again later.',
                ], 500);
            }

            return response()->json([
                'message' => 'Verification code has been resent to your email.'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Resend verification code error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'An error occurred. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Handle logout
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user info
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function user(Request $request)
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ],
        ]);
    }
}
