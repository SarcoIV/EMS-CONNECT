<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

// Public routes (no authentication required)
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes (require Sanctum token authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
});
