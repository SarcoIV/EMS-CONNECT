<?php

namespace App\Services;

use App\Models\Dispatch;
use App\Models\Hospital;

class HospitalRoutingService
{
    public function __construct(
        private DistanceCalculationService $distanceService
    ) {}

    /**
     * Find the nearest active hospital from a given location.
     */
    public function findNearestHospital(float $latitude, float $longitude): ?Hospital
    {
        return Hospital::active()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->selectRaw('*, (6371000 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance_meters', [
                $latitude, $longitude, $latitude,
            ])
            ->orderBy('distance_meters')
            ->first();
    }

    /**
     * Get hospital for dispatch (priority: dispatch override > responder assigned > nearest)
     */
    public function getHospitalForDispatch(Dispatch $dispatch): ?Hospital
    {
        // 1. Check dispatch-specific hospital (admin override)
        if ($dispatch->hospital_id) {
            return $dispatch->hospital;
        }

        // 2. Check responder's assigned hospital (string field)
        $responder = $dispatch->responder;
        if ($responder->hospital_assigned) {
            $hospital = Hospital::where('name', $responder->hospital_assigned)
                ->where('is_active', true)
                ->first();

            if ($hospital) {
                return $hospital;
            }
        }

        // 3. Auto-find nearest hospital from incident location
        $incident = $dispatch->incident;
        if ($incident && $incident->latitude && $incident->longitude) {
            return $this->findNearestHospital(
                (float) $incident->latitude,
                (float) $incident->longitude
            );
        }

        return null;
    }

    /**
     * Calculate route from incident to hospital
     *
     *
     * @throws \Exception
     */
    public function calculateHospitalRoute(Dispatch $dispatch): array
    {
        $hospital = $this->getHospitalForDispatch($dispatch);

        if (! $hospital) {
            throw new \Exception('No hospital assigned to responder');
        }

        if (! $hospital->is_active) {
            throw new \Exception('Assigned hospital is inactive');
        }

        if (! $hospital->latitude || ! $hospital->longitude) {
            throw new \Exception('Hospital location data unavailable');
        }

        $incident = $dispatch->incident;

        // Calculate route using existing distance service
        $routeData = $this->distanceService->calculateRoadDistance(
            (float) $incident->latitude,
            (float) $incident->longitude,
            (float) $hospital->latitude,
            (float) $hospital->longitude
        );

        return [
            'hospital' => [
                'id' => $hospital->id,
                'name' => $hospital->name,
                'address' => $hospital->address,
                'latitude' => (float) $hospital->latitude,
                'longitude' => (float) $hospital->longitude,
                'phone_number' => $hospital->phone_number,
            ],
            'route' => [
                'distance_meters' => $routeData['distance_meters'],
                'duration_seconds' => $routeData['duration_seconds'],
                'distance_text' => $routeData['distance_text'],
                'duration_text' => $routeData['duration_text'],
                'coordinates' => $routeData['route_coordinates'],
                'method' => $routeData['method'],
            ],
        ];
    }

    /**
     * Cache hospital route data in dispatch
     */
    public function cacheHospitalRoute(Dispatch $dispatch, array $routeData): void
    {
        $dispatch->update([
            'hospital_id' => $routeData['hospital']['id'],
            'hospital_distance_meters' => $routeData['route']['distance_meters'],
            'hospital_estimated_duration_seconds' => $routeData['route']['duration_seconds'],
            'hospital_route_data' => $routeData,
        ]);
    }
}
