<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Google Maps Service
 *
 * Handles interactions with Google Maps Directions API:
 * - Route calculation with turn-by-turn directions
 * - Distance and duration estimation
 * - Polyline encoding/decoding for route visualization
 * - Caching with configurable TTL
 */
class GoogleMapsService
{
    // Cache configuration
    private const CACHE_TTL_SECONDS = 900; // 15 minutes

    private const CACHE_PREFIX = 'google_maps_route';

    private ?string $apiKey;

    private ?string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.google_maps.api_key');
        $this->baseUrl = config('services.google_maps.base_url', 'https://maps.googleapis.com/maps/api');

        if (empty($this->apiKey)) {
            throw new \Exception('Google Maps API key is not configured. Please set GOOGLE_MAPS_API_KEY in your .env file.');
        }
    }

    /**
     * Get directions from origin to destination using Google Maps Directions API.
     *
     * @param  float  $originLat  Origin latitude
     * @param  float  $originLon  Origin longitude
     * @param  float  $destLat  Destination latitude
     * @param  float  $destLon  Destination longitude
     * @param  array  $options  Additional options (mode, avoid, etc.)
     * @return array Route data including polyline, distance, duration
     *
     * @throws \Exception If API call fails
     */
    public function getDirections(
        float $originLat,
        float $originLon,
        float $destLat,
        float $destLon,
        array $options = []
    ): array {
        // Check cache first
        $cacheKey = $this->getCacheKey($originLat, $originLon, $destLat, $destLon);

        $cachedResult = Cache::get($cacheKey);
        if ($cachedResult) {
            Log::debug('[GOOGLE_MAPS] Using cached route data', ['cache_key' => $cacheKey]);

            return $cachedResult;
        }

        // Call Google Maps Directions API
        try {
            $result = $this->callDirectionsAPI($originLat, $originLon, $destLat, $destLon, $options);

            // Cache the successful result
            Cache::put($cacheKey, $result, self::CACHE_TTL_SECONDS);

            return $result;
        } catch (\Exception $e) {
            Log::error('[GOOGLE_MAPS] Directions API call failed', [
                'error' => $e->getMessage(),
                'origin' => [$originLat, $originLon],
                'destination' => [$destLat, $destLon],
            ]);

            throw $e;
        }
    }

    /**
     * Call Google Maps Directions API.
     *
     * @throws \Exception If API call fails
     */
    private function callDirectionsAPI(
        float $originLat,
        float $originLon,
        float $destLat,
        float $destLon,
        array $options = []
    ): array {
        $url = "{$this->baseUrl}/directions/json";

        // Prepare request parameters
        $params = [
            'origin' => "{$originLat},{$originLon}",
            'destination' => "{$destLat},{$destLon}",
            'mode' => $options['mode'] ?? 'driving',
            'key' => $this->apiKey,
            // Request alternative routes for better accuracy
            'alternatives' => $options['alternatives'] ?? false,
            // Optimize route for real-time traffic if available
            'departure_time' => $options['departure_time'] ?? 'now',
        ];

        Log::debug('[GOOGLE_MAPS] Calling Directions API', [
            'origin' => [$originLat, $originLon],
            'destination' => [$destLat, $destLon],
            'mode' => $params['mode'],
        ]);

        $response = Http::timeout(10)->get($url, $params);

        if (! $response->successful()) {
            throw new \Exception("Google Maps API error: {$response->status()} - {$response->body()}");
        }

        $data = $response->json();

        // Check API response status
        if ($data['status'] !== 'OK') {
            throw new \Exception("Google Maps API returned status: {$data['status']}");
        }

        // Extract route data
        $routes = $data['routes'] ?? [];
        if (empty($routes)) {
            throw new \Exception('No routes found in Google Maps response');
        }

        // Use the first route (or best alternative)
        $route = $routes[0];
        $leg = $route['legs'][0]; // First leg of the journey

        // Extract distance and duration
        $distanceMeters = $leg['distance']['value'] ?? 0;
        $durationSeconds = $leg['duration']['value'] ?? 0;

        // Extract encoded polyline
        $encodedPolyline = $route['overview_polyline']['points'] ?? '';

        // Decode polyline to array of lat/lng coordinates
        $routeCoordinates = $this->decodePolyline($encodedPolyline);

        Log::info('[GOOGLE_MAPS] Directions API call successful', [
            'origin' => [$originLat, $originLon],
            'destination' => [$destLat, $destLon],
            'distance_meters' => $distanceMeters,
            'duration_seconds' => $durationSeconds,
            'route_points' => count($routeCoordinates),
        ]);

        return [
            'distance_meters' => (float) $distanceMeters,
            'duration_seconds' => (float) $durationSeconds,
            'distance_text' => $this->formatDistance($distanceMeters),
            'duration_text' => $this->formatDuration($durationSeconds),
            'route_coordinates' => $routeCoordinates, // Array of {latitude, longitude}
            'encoded_polyline' => $encodedPolyline, // For mobile app efficiency
            'method' => 'google_maps',
        ];
    }

    /**
     * Decode Google Maps encoded polyline to array of coordinates.
     * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
     *
     * @param  string  $encoded  Encoded polyline string
     * @return array Array of [latitude, longitude] associative arrays
     */
    private function decodePolyline(string $encoded): array
    {
        $points = [];
        $index = 0;
        $len = strlen($encoded);
        $lat = 0;
        $lng = 0;

        while ($index < $len) {
            $b = 0;
            $shift = 0;
            $result = 0;

            do {
                $b = ord($encoded[$index++]) - 63;
                $result |= ($b & 0x1F) << $shift;
                $shift += 5;
            } while ($b >= 0x20);

            $deltaLat = (($result & 1) ? ~($result >> 1) : ($result >> 1));
            $lat += $deltaLat;

            $shift = 0;
            $result = 0;

            do {
                $b = ord($encoded[$index++]) - 63;
                $result |= ($b & 0x1F) << $shift;
                $shift += 5;
            } while ($b >= 0x20);

            $deltaLng = (($result & 1) ? ~($result >> 1) : ($result >> 1));
            $lng += $deltaLng;

            $points[] = [
                'latitude' => $lat * 1e-5,
                'longitude' => $lng * 1e-5,
            ];
        }

        return $points;
    }

    /**
     * Generate cache key for route calculation.
     */
    private function getCacheKey(
        float $originLat,
        float $originLon,
        float $destLat,
        float $destLon
    ): string {
        // Round coordinates to 5 decimal places (~1 meter precision)
        $key = sprintf(
            '%s_%s_%s_%s_%s',
            self::CACHE_PREFIX,
            round($originLat, 5),
            round($originLon, 5),
            round($destLat, 5),
            round($destLon, 5)
        );

        return str_replace(['.', '-'], '_', $key);
    }

    /**
     * Format distance in meters to human-readable string.
     */
    private function formatDistance(float $meters): string
    {
        if ($meters < 1000) {
            return number_format($meters, 0).' m';
        }

        return number_format($meters / 1000, 2).' km';
    }

    /**
     * Format duration in seconds to human-readable string.
     */
    private function formatDuration(float $seconds): string
    {
        if ($seconds < 60) {
            return number_format($seconds, 0).' sec';
        }

        $minutes = floor($seconds / 60);

        if ($minutes < 60) {
            return number_format($minutes, 0).' min';
        }

        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;

        return number_format($hours, 0).' hr '.number_format($remainingMinutes, 0).' min';
    }
}
