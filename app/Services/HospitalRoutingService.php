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
     * Get hospital for dispatch (priority: dispatch override > responder assigned)
     *
     * @param Dispatch $dispatch
     * @return Hospital|null
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
            return Hospital::where('name', $responder->hospital_assigned)
                ->where('is_active', true)
                ->first();
        }

        return null;
    }

    /**
     * Calculate route from incident to hospital
     *
     * @param Dispatch $dispatch
     * @return array
     * @throws \Exception
     */
    public function calculateHospitalRoute(Dispatch $dispatch): array
    {
        $hospital = $this->getHospitalForDispatch($dispatch);

        if (!$hospital) {
            throw new \Exception('No hospital assigned to responder');
        }

        if (!$hospital->is_active) {
            throw new \Exception('Assigned hospital is inactive');
        }

        if (!$hospital->latitude || !$hospital->longitude) {
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
            'route' => $routeData,
        ];
    }

    /**
     * Cache hospital route data in dispatch
     *
     * @param Dispatch $dispatch
     * @param array $routeData
     * @return void
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
