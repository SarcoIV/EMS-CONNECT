<?php

namespace App\Services;

use App\Models\Incident;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Distance Calculation Service
 *
 * Calculates distances between incident locations and responder locations using:
 * 1. OpenRouteService API for road distance (primary)
 * 2. Haversine formula for straight-line distance (fallback)
 *
 * Features:
 * - Caching with 15-minute TTL
 * - Automatic fallback to Haversine if API fails
 * - Batch processing for multiple responders
 * - Rate limiting protection
 */
class DistanceCalculationService
{
    // Cache configuration
    private const CACHE_TTL_SECONDS = 900; // 15 minutes

    private const CACHE_PREFIX = 'distance';

    // Earth radius in meters (for Haversine calculation)
    private const EARTH_RADIUS_METERS = 6371000;

    // API configuration
    private string $apiKey;

    private string $baseUrl;

    private GoogleMapsService $googleMapsService;

    public function __construct()
    {
        $this->apiKey = config('services.openrouteservice.api_key');
        $this->baseUrl = config('services.openrouteservice.base_url');
        $this->googleMapsService = new GoogleMapsService;
    }

    /**
     * Calculate straight-line distance using Haversine formula.
     * Used as fallback when API fails or for preliminary filtering.
     *
     * @param  float  $lat1  Origin latitude
     * @param  float  $lon1  Origin longitude
     * @param  float  $lat2  Destination latitude
     * @param  float  $lon2  Destination longitude
     * @return float Distance in meters
     */
    public static function calculateHaversineDistance(
        float $lat1,
        float $lon1,
        float $lat2,
        float $lon2
    ): float {
        // Convert degrees to radians
        $lat1Rad = deg2rad($lat1);
        $lon1Rad = deg2rad($lon1);
        $lat2Rad = deg2rad($lat2);
        $lon2Rad = deg2rad($lon2);

        // Haversine formula
        $deltaLat = $lat2Rad - $lat1Rad;
        $deltaLon = $lon2Rad - $lon1Rad;

        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($deltaLon / 2) * sin($deltaLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return self::EARTH_RADIUS_METERS * $c;
    }

    /**
     * Calculate road distance and travel time using routing APIs.
     * Primary: Google Maps API, Fallback: OpenRouteService, Final: Haversine formula
     *
     * @param  float  $originLat  Origin latitude
     * @param  float  $originLon  Origin longitude
     * @param  float  $destLat  Destination latitude
     * @param  float  $destLon  Destination longitude
     * @return array ['distance_meters' => float, 'duration_seconds' => float, 'distance_text' => string, 'duration_text' => string, 'route_coordinates' => array, 'encoded_polyline' => string, 'method' => string]
     */
    public function calculateRoadDistance(
        float $originLat,
        float $originLon,
        float $destLat,
        float $destLon
    ): array {
        // Check cache first
        $cacheKey = $this->getCacheKey($originLat, $originLon, $destLat, $destLon);

        $cachedResult = Cache::get($cacheKey);
        if ($cachedResult) {
            Log::debug('[DISTANCE] Using cached distance calculation', ['cache_key' => $cacheKey]);

            return $cachedResult;
        }

        // Try Google Maps API first (primary provider)
        try {
            $result = $this->googleMapsService->getDirections(
                $originLat,
                $originLon,
                $destLat,
                $destLon
            );

            // Cache the successful result
            Cache::put($cacheKey, $result, self::CACHE_TTL_SECONDS);

            return $result;
        } catch (\Exception $googleError) {
            Log::warning('[DISTANCE] Google Maps API failed, trying OpenRouteService fallback', [
                'error' => $googleError->getMessage(),
            ]);

            // Fallback to OpenRouteService
            try {
                $result = $this->callOpenRouteServiceAPI($originLat, $originLon, $destLat, $destLon);

                // Cache the successful result
                Cache::put($cacheKey, $result, self::CACHE_TTL_SECONDS);

                return $result;
            } catch (\Exception $orsError) {
                Log::warning('[DISTANCE] OpenRouteService also failed, falling back to Haversine', [
                    'google_error' => $googleError->getMessage(),
                    'ors_error' => $orsError->getMessage(),
                ]);

                // Final fallback to Haversine
                return $this->fallbackToHaversine($originLat, $originLon, $destLat, $destLon);
            }
        }
    }

    /**
     * Calculate distances for multiple responders to a single incident.
     *
     * @param  Incident  $incident  The incident
     * @param  Collection  $responders  Collection of User models (responders)
     * @return Collection Responders with added distance data
     */
    public function calculateDistancesForResponders(
        Incident $incident,
        Collection $responders
    ): Collection {
        return $responders->map(function (User $responder) use ($incident) {
            // Use current location if available, otherwise base location
            $responderLat = $responder->current_latitude ?? $responder->base_latitude;
            $responderLon = $responder->current_longitude ?? $responder->base_longitude;

            if (is_null($responderLat) || is_null($responderLon)) {
                Log::warning('[DISTANCE] Responder has no location data', [
                    'responder_id' => $responder->id,
                    'responder_name' => $responder->name,
                ]);

                // Return responder with null distance data
                $responder->distance_meters = null;
                $responder->distance_text = 'No location';
                $responder->duration_seconds = null;
                $responder->duration_text = 'N/A';

                return $responder;
            }

            // Calculate distance
            $distanceData = $this->calculateRoadDistance(
                $responderLat,
                $responderLon,
                (float) $incident->latitude,
                (float) $incident->longitude
            );

            // Add distance data to responder object
            $responder->distance_meters = $distanceData['distance_meters'];
            $responder->distance_text = $distanceData['distance_text'];
            $responder->duration_seconds = $distanceData['duration_seconds'];
            $responder->duration_text = $distanceData['duration_text'];
            $responder->route_coordinates = $distanceData['route_coordinates'] ?? null;
            $responder->encoded_polyline = $distanceData['encoded_polyline'] ?? null;
            $responder->distance_method = $distanceData['method'];

            return $responder;
        })->sortBy('distance_meters'); // Sort by distance (nearest first)
    }

    /**
     * Get responders within a specific radius of coordinates.
     * Uses Haversine for initial filtering (fast).
     *
     * @param  float  $lat  Center latitude
     * @param  float  $lon  Center longitude
     * @param  int  $radiusKm  Radius in kilometers
     * @return Collection Responders within radius
     */
    public static function getRespondersWithinRadius(
        float $lat,
        float $lon,
        int $radiusKm = 10
    ): Collection {
        $radiusMeters = $radiusKm * 1000;

        // Get all available responders
        $responders = User::where('role', 'responder')
            ->where('email_verified', true)
            ->where('is_on_duty', true)
            ->where('responder_status', 'idle')
            ->whereNotNull('current_latitude')
            ->whereNotNull('current_longitude')
            ->get();

        // Filter by radius using Haversine
        return $responders->filter(function (User $responder) use ($lat, $lon, $radiusMeters) {
            $distance = self::calculateHaversineDistance(
                $lat,
                $lon,
                (float) $responder->current_latitude,
                (float) $responder->current_longitude
            );

            return $distance <= $radiusMeters;
        });
    }

    /**
     * Call OpenRouteService Directions API.
     *
     * @throws \Exception If API call fails
     */
    private function callOpenRouteServiceAPI(
        float $originLat,
        float $originLon,
        float $destLat,
        float $destLon
    ): array {
        $url = "{$this->baseUrl}/directions/driving-car";

        Log::debug('[DISTANCE] Calling OpenRouteService API', [
            'origin' => [$originLat, $originLon],
            'destination' => [$destLat, $destLon],
        ]);

        $response = Http::withHeaders([
            'Authorization' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(10)->post($url, [
            'coordinates' => [
                [$originLon, $originLat], // Note: OpenRouteService uses [lon, lat] format
                [$destLon, $destLat],
            ],
            'format' => 'geojson', // Request GeoJSON format for coordinates
        ]);

        if (! $response->successful()) {
            throw new \Exception("OpenRouteService API error: {$response->status()} - {$response->body()}");
        }

        $data = $response->json();

        Log::debug('[DISTANCE] OpenRouteService response received', [
            'status' => $response->status(),
            'has_routes' => isset($data['routes']) && count($data['routes']) > 0,
        ]);

        // Extract distance and duration from response
        $route = $data['routes'][0] ?? null;
        if (! $route) {
            throw new \Exception('No route found in OpenRouteService response');
        }

        $distanceMeters = $route['summary']['distance'] ?? 0;
        $durationSeconds = $route['summary']['duration'] ?? 0;

        // Extract route geometry for visualization
        // OpenRouteService returns GeoJSON coordinates as array of [lon, lat]
        $geometry = $route['geometry']['coordinates'] ?? [];

        // Convert from GeoJSON [lon, lat] to mobile app format [{latitude, longitude}]
        $routeCoordinates = array_map(function ($coord) {
            return [
                'latitude' => (float) $coord[1],  // GeoJSON has lon first, lat second
                'longitude' => (float) $coord[0], // Swap to lat/lon format
            ];
        }, $geometry);

        Log::info('[DISTANCE] OpenRouteService API call successful', [
            'origin' => [$originLat, $originLon],
            'destination' => [$destLat, $destLon],
            'distance_meters' => $distanceMeters,
            'duration_seconds' => $durationSeconds,
            'route_points' => count($routeCoordinates),
        ]);

        return [
            'distance_meters' => round($distanceMeters, 2),
            'duration_seconds' => round($durationSeconds, 2),
            'distance_text' => $this->formatDistance($distanceMeters),
            'duration_text' => $this->formatDuration($durationSeconds),
            'route_coordinates' => $routeCoordinates, // Full array of lat/lon points
            'encoded_polyline' => null, // OpenRouteService doesn't provide this in GeoJSON mode
            'method' => 'openrouteservice',
        ];
    }

    /**
     * Fallback to Haversine calculation when API fails.
     */
    private function fallbackToHaversine(
        float $originLat,
        float $originLon,
        float $destLat,
        float $destLon
    ): array {
        $distanceMeters = self::calculateHaversineDistance(
            $originLat,
            $originLon,
            $destLat,
            $destLon
        );

        // Estimate duration assuming average speed of 40 km/h in urban areas
        $averageSpeedMetersPerSecond = (40 * 1000) / 3600; // 40 km/h = 11.11 m/s
        $durationSeconds = $distanceMeters / $averageSpeedMetersPerSecond;

        // Haversine is straight-line, so only return start and end points
        $routeCoordinates = [
            ['latitude' => $originLat, 'longitude' => $originLon],
            ['latitude' => $destLat, 'longitude' => $destLon],
        ];

        return [
            'distance_meters' => round($distanceMeters, 2),
            'duration_seconds' => round($durationSeconds, 2),
            'distance_text' => $this->formatDistance($distanceMeters).' (est.)',
            'duration_text' => $this->formatDuration($durationSeconds).' (est.)',
            'route_coordinates' => $routeCoordinates, // Only 2 points for straight line
            'encoded_polyline' => null,
            'method' => 'haversine',
        ];
    }

    /**
     * Generate cache key for distance calculation.
     */
    private function getCacheKey(
        float $originLat,
        float $originLon,
        float $destLat,
        float $destLon
    ): string {
        // Round coordinates to 5 decimal places for cache key (~1 meter precision)
        $key = sprintf(
            '%s_%s_%s_%s_%s',
            self::CACHE_PREFIX,
            round($originLat, 5),
            round($originLon, 5),
            round($destLat, 5),
            round($destLon, 5)
        );

        return str_replace('.', '_', $key);
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
