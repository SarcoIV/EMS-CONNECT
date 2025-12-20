<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\CallController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| EMS Connect Mobile App API Routes
|
*/

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// =============================================================================

// Login route
Route::post('/auth/login', [AuthController::class, 'login']);

// Signup and verification routes with rate limiting (5 attempts per minute)
Route::middleware(['throttle:5,1'])->group(function () {
    Route::post('/auth/signup', [AuthController::class, 'signup']);
    Route::post('/auth/resend-verification', [AuthController::class, 'resendVerificationCode']);
});

// Email verification route (rate limited to prevent abuse - 10 attempts per minute)
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
});

// =============================================================================
// PROTECTED ROUTES (Require Sanctum token authentication)
// =============================================================================

Route::middleware('auth:sanctum')->group(function () {
    
    // -------------------------------------------------------------------------
    // Auth Routes
    // -------------------------------------------------------------------------
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    // -------------------------------------------------------------------------
    // Incident Routes
    // -------------------------------------------------------------------------
    Route::prefix('incidents')->group(function () {
        // Create new incident
        Route::post('/', [IncidentController::class, 'store']);
        
        // Get all incidents for authenticated user
        Route::get('/my', [IncidentController::class, 'myIncidents']);
        
        // Get specific incident
        Route::get('/{id}', [IncidentController::class, 'show'])
            ->where('id', '[0-9]+');
        
        // Cancel incident
        Route::post('/{id}/cancel', [IncidentController::class, 'cancel'])
            ->where('id', '[0-9]+');
    });

    // -------------------------------------------------------------------------
    // Call Routes (Agora Voice Calling)
    // -------------------------------------------------------------------------
    Route::prefix('call')->group(function () {
        // Start a new call
        Route::post('/start', [CallController::class, 'start']);

        // End an active call
        Route::post('/end', [CallController::class, 'end']);

        // Get active call for user
        Route::get('/active', [CallController::class, 'active']);

        // Admin: Get incoming calls
        Route::get('/incoming', [CallController::class, 'incoming']);

        // Admin: Answer a call
        Route::post('/answer', [CallController::class, 'answer']);
    });
});
