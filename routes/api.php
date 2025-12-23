<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\CallController;
use App\Http\Controllers\Api\ResponderController;

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
    // Responder Routes (Dispatch System)
    // -------------------------------------------------------------------------
    Route::prefix('responder')->group(function () {
        // Update responder's real-time GPS location (when on duty)
        Route::post('/location', [ResponderController::class, 'updateLocation']);

        // Update responder's duty status (on/off duty, availability)
        Route::post('/status', [ResponderController::class, 'updateStatus']);

        // Get all dispatches assigned to this responder
        Route::get('/dispatches', [ResponderController::class, 'getAssignedIncidents']);

        // Update dispatch status (accept, en route, arrived, completed)
        Route::post('/dispatches/{id}/status', [ResponderController::class, 'updateDispatchStatus'])
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
    });

    // -------------------------------------------------------------------------
    // Admin Call Routes (Require admin role)
    // -------------------------------------------------------------------------
    Route::prefix('call')->middleware('role:admin')->group(function () {
        // Admin: Get incoming calls
        Route::get('/incoming', [CallController::class, 'incoming']);

        // Admin: Answer a call
        Route::post('/answer', [CallController::class, 'answer']);
    });
});
