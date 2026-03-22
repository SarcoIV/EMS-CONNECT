<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Agora RTC Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Agora Voice Calling.
    | NOTE: This uses App ID ONLY (no token generation) for MVP/Demo purposes.
    | For production, implement token-based authentication.
    |
    */

    'agora' => [
        'app_id' => env('AGORA_APP_ID', 'c81a013cd0db4defabcbdb7d005fe627'),
    ],

    /*
    |--------------------------------------------------------------------------
    | OpenRouteService Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for OpenRouteService API used for calculating road distances
    | and travel times between incident locations and responder locations.
    | This is used exclusively on the backend during admin dispatch operations.
    |
    | API Key is NEVER exposed to frontend or mobile applications.
    |
    */

    'openrouteservice' => [
        'api_key' => env('OPENROUTESERVICE_API_KEY'),
        'base_url' => env('OPENROUTESERVICE_BASE_URL', 'https://api.openrouteservice.org/v2'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Maps API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Google Maps Directions API used for calculating routes,
    | distances, and travel times between incident locations and responder locations.
    | This is used exclusively on the backend during dispatch operations.
    |
    | API Key is NEVER exposed to frontend or mobile applications.
    |
    */

    'google_maps' => [
        'api_key' => env('GOOGLE_MAPS_API_KEY'),
        'base_url' => env('GOOGLE_MAPS_BASE_URL', 'https://maps.googleapis.com/maps/api'),
    ],

];
