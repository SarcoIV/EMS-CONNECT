<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Admin dashboard channel - only admins can listen
Broadcast::channel('admin-dashboard', function ($user) {
    // Check if user is an admin
    return $user && $user->user_role === 'admin';
});

// Private responder channel for individual responder data
Broadcast::channel('responder.{responderId}', function ($user, $responderId) {
    // Responder can only listen to their own channel
    return (int) $user->id === (int) $responderId && $user->role === 'responder';
});
