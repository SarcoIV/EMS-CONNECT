<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

// Public routes (no authentication required)
Route::post('/auth/login', [AuthController::class, 'login']);

// Signup and verification routes with rate limiting (5 attempts per minute)
Route::middleware(['throttle:5,1'])->group(function () {
    Route::post('/auth/signup', [AuthController::class, 'signup']);
    Route::post('/auth/resend-verification', [AuthController::class, 'resendVerificationCode']);
});

// Email verification route (rate limited to prevent abuse)
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
});

// Protected routes (require Sanctum token authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
});
