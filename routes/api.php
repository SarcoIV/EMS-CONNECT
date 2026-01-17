<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CallController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\ResponderController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

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
    // User Profile Routes
    // -------------------------------------------------------------------------
    Route::prefix('user')->group(function () {
        // Get user profile
        Route::get('/profile', [UserController::class, 'show']);

        // Update user profile (supports both PUT and POST for mobile compatibility)
        Route::match(['put', 'post'], '/profile', [UserController::class, 'updateProfile']);

        // Change password
        Route::match(['put', 'post'], '/password', [UserController::class, 'changePassword']);
    });

    // -------------------------------------------------------------------------
    // DEBUG ENDPOINT - TEMPORARY (Remove after fixing mobile app)
    // -------------------------------------------------------------------------
    Route::post('/debug/echo', function (\Illuminate\Http\Request $request) {
        return response()->json([
            'message' => 'Debug echo endpoint - shows exactly what the server received',
            'headers' => $request->headers->all(),
            'body' => $request->all(),
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
                'user_role' => $request->user()->user_role,
                'is_on_duty' => $request->user()->is_on_duty,
                'responder_status' => $request->user()->responder_status,
            ] : null,
        ]);
    });

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

        // Get real-time responder tracking for incident
        Route::get('/{id}/tracking', [IncidentController::class, 'tracking'])
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

        // Submit pre-arrival form for a dispatch
        Route::post('/dispatches/{dispatchId}/pre-arrival', [ResponderController::class, 'storePreArrival'])
            ->where('dispatchId', '[0-9]+');
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

        // Poll for incoming admin-initiated calls
        Route::get('/incoming', [CallController::class, 'incoming']);

        // Answer admin-initiated call
        Route::post('/answer', [CallController::class, 'answer']);

        // Reject admin-initiated call
        Route::post('/reject', [CallController::class, 'reject']);
    });

    // -------------------------------------------------------------------------
    // Message Routes (Incident-based messaging)
    // -------------------------------------------------------------------------
    Route::prefix('messages')->group(function () {
        // Send a message
        Route::post('/', [MessageController::class, 'store']);

        // Get messages for an incident
        Route::get('/', [MessageController::class, 'index']);

        // Get unread message count
        Route::get('/unread-count', [MessageController::class, 'unreadCount']);

        // Mark a message as read
        Route::post('/{id}/mark-read', [MessageController::class, 'markAsRead'])
            ->where('id', '[0-9]+');
    });

    // -------------------------------------------------------------------------
    // Admin API Routes (Real-Time Data)
    // -------------------------------------------------------------------------
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        // Get all active responders with their locations
        Route::get('/responders/active', [\App\Http\Controllers\Admin\AdminApiController::class, 'getActiveResponders']);

        // Get location history for a specific responder
        Route::get('/responders/{responderId}/location-history', [\App\Http\Controllers\Admin\AdminApiController::class, 'getLocationHistory'])
            ->where('responderId', '[0-9]+');

        // Get pre-arrival forms for a specific incident
        Route::get('/incidents/{incidentId}/pre-arrival', [\App\Http\Controllers\Admin\AdminApiController::class, 'getPreArrivalForms'])
            ->where('incidentId', '[0-9]+');
    });
});
