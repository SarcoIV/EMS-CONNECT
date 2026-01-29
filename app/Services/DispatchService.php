<?php

namespace App\Services;

use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Dispatch Service
 *
 * Handles business logic for dispatch operations:
 * - Finding available responders
 * - Assigning responders to incidents
 * - Managing dispatch status updates
 * - Notifying responders
 */
class DispatchService
{
    private DistanceCalculationService $distanceService;
    private HospitalRoutingService $hospitalRoutingService;

    public function __construct(
        DistanceCalculationService $distanceService,
        HospitalRoutingService $hospitalRoutingService
    ) {
        $this->distanceService = $distanceService;
        $this->hospitalRoutingService = $hospitalRoutingService;
    }

    /**
     * Get available responders for an incident with calculated distances.
     * Only responders within 3km radius are included.
     *
     * @param  Incident  $incident  The incident
     * @return Collection Collection of responders with distance data
     */
    public function getAvailableResponders(Incident $incident): Collection
    {
        // Define maximum dispatch radius (3km = 3000 meters)
        $maxRadiusMeters = 3000;

        // Get all available responders (on duty, idle, verified, with location)
        $responders = User::where('role', 'responder')
            ->where('email_verified', true)
            ->where('is_on_duty', true)
            ->where('responder_status', 'idle')
            ->where(function ($query) {
                // Must have either current location or base location
                $query->whereNotNull('current_latitude')
                    ->whereNotNull('current_longitude')
                    ->orWhere(function ($q) {
                        $q->whereNotNull('base_latitude')
                            ->whereNotNull('base_longitude');
                    });
            })
            ->get();

        if ($responders->isEmpty()) {
            Log::warning('[DISPATCH] No available responders found for incident', [
                'incident_id' => $incident->id,
            ]);

            return collect();
        }

        Log::info('[DISPATCH] Found available responders before radius filter', [
            'incident_id' => $incident->id,
            'responder_count' => $responders->count(),
        ]);

        // Filter responders by 3km radius using Haversine (straight-line distance)
        $respondersInRadius = $responders->filter(function (User $responder) use ($incident, $maxRadiusMeters) {
            $responderLat = $responder->current_latitude ?? $responder->base_latitude;
            $responderLon = $responder->current_longitude ?? $responder->base_longitude;

            if (is_null($responderLat) || is_null($responderLon)) {
                return false;
            }

            $distance = DistanceCalculationService::calculateHaversineDistance(
                (float) $responderLat,
                (float) $responderLon,
                (float) $incident->latitude,
                (float) $incident->longitude
            );

            return $distance <= $maxRadiusMeters;
        });

        if ($respondersInRadius->isEmpty()) {
            Log::warning('[DISPATCH] No responders found within 3km radius', [
                'incident_id' => $incident->id,
                'total_responders' => $responders->count(),
                'radius_km' => 3,
            ]);

            return collect();
        }

        Log::info('[DISPATCH] Responders filtered by 3km radius', [
            'incident_id' => $incident->id,
            'before_filter' => $responders->count(),
            'after_filter' => $respondersInRadius->count(),
        ]);

        // Calculate distances for responders within radius
        return $this->distanceService->calculateDistancesForResponders($incident, $respondersInRadius);
    }

    /**
     * Assign a responder to an incident.
     *
     * @param  Incident  $incident  The incident
     * @param  User  $responder  The responder to assign
     * @param  User  $admin  The admin making the assignment
     * @return Dispatch The created dispatch record
     *
     * @throws \Exception If assignment fails validation
     */
    public function assignResponder(
        Incident $incident,
        User $responder,
        User $admin
    ): Dispatch {
        // Validate incident can receive more responders
        if (! $incident->canAssignMoreResponders()) {
            throw new \Exception('Incident is already completed or cancelled');
        }

        // Validate responder is available
        if (! $responder->isAvailableForDispatch()) {
            throw new \Exception('Responder is not available for dispatch');
        }

        // Validate responder has location
        if (! $responder->hasLocation() && is_null($responder->base_latitude)) {
            throw new \Exception('Responder does not have location data');
        }

        // Check if responder is already assigned to this incident
        $existingDispatch = Dispatch::where('incident_id', $incident->id)
            ->where('responder_id', $responder->id)
            ->first();

        if ($existingDispatch) {
            throw new \Exception('This responder is already assigned to this incident');
        }

        DB::beginTransaction();

        try {
            // Calculate distance at time of assignment
            $responderLat = $responder->current_latitude ?? $responder->base_latitude;
            $responderLon = $responder->current_longitude ?? $responder->base_longitude;

            $distanceData = $this->distanceService->calculateRoadDistance(
                (float) $responderLat,
                (float) $responderLon,
                (float) $incident->latitude,
                (float) $incident->longitude
            );

            // Create dispatch record
            $dispatch = Dispatch::create([
                'incident_id' => $incident->id,
                'responder_id' => $responder->id,
                'assigned_by_admin_id' => $admin->id,
                'status' => 'assigned',
                'distance_meters' => $distanceData['distance_meters'],
                'estimated_duration_seconds' => $distanceData['duration_seconds'],
                'assigned_at' => now(),
            ]);

            // Update incident status and counters
            if ($incident->status === 'pending') {
                $incident->status = 'dispatched';
                $incident->dispatched_at = now();
            }
            $incident->responders_assigned += 1;
            $incident->save();

            // Update responder status
            $responder->responder_status = 'assigned';
            $responder->save();

            DB::commit();

            Log::info('[DISPATCH] ✅ Responder assigned to incident', [
                'dispatch_id' => $dispatch->id,
                'incident_id' => $incident->id,
                'responder_id' => $responder->id,
                'responder_name' => $responder->name,
                'admin_id' => $admin->id,
                'admin_name' => $admin->name,
                'distance_meters' => $distanceData['distance_meters'],
                'distance_text' => $distanceData['distance_text'],
                'duration_text' => $distanceData['duration_text'],
            ]);

            // Send notification to responder (placeholder for future push notification)
            $this->notifyResponder($dispatch);

            return $dispatch;
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('[DISPATCH] ❌ Failed to assign responder', [
                'incident_id' => $incident->id,
                'responder_id' => $responder->id,
                'admin_id' => $admin->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Validate if a status transition is allowed.
     *
     * @param  string  $currentStatus  Current dispatch status
     * @param  string  $newStatus  Desired new status
     * @return bool True if transition is valid
     */
    private function validateStatusTransition(string $currentStatus, string $newStatus): bool
    {
        $validTransitions = [
            'assigned' => ['accepted', 'declined', 'cancelled'],
            'accepted' => ['en_route', 'cancelled'],
            'en_route' => ['arrived', 'cancelled'],
            'arrived' => ['transporting_to_hospital', 'completed', 'cancelled'],
            'transporting_to_hospital' => ['completed', 'cancelled'],
            'completed' => [],  // Terminal state
            'declined' => [],   // Terminal state
            'cancelled' => [],  // Terminal state
        ];

        if (! isset($validTransitions[$currentStatus])) {
            return false;
        }

        return in_array($newStatus, $validTransitions[$currentStatus]);
    }

    /**
     * Update dispatch status (called by responder via mobile app).
     *
     * @param  Dispatch  $dispatch  The dispatch to update
     * @param  string  $newStatus  The new status
     * @param  string|null  $reason  Reason for status change (for cancellations)
     * @return Dispatch Updated dispatch
     *
     * @throws \Exception If status transition is invalid
     */
    public function updateDispatchStatus(
        Dispatch $dispatch,
        string $newStatus,
        ?string $reason = null
    ): Dispatch {
        $allowedStatuses = ['accepted', 'declined', 'en_route', 'arrived', 'transporting_to_hospital', 'completed', 'cancelled'];

        if (! in_array($newStatus, $allowedStatuses)) {
            throw new \Exception("Invalid dispatch status: {$newStatus}");
        }

        // Validate status transition
        if (! $this->validateStatusTransition($dispatch->status, $newStatus)) {
            throw new \Exception("Invalid status transition from {$dispatch->status} to {$newStatus}");
        }

        DB::beginTransaction();

        try {
            $incident = $dispatch->incident;
            $responder = $dispatch->responder;

            // Update dispatch based on new status
            switch ($newStatus) {
                case 'accepted':
                    $dispatch->accept();
                    $responder->responder_status = 'assigned';
                    break;

                case 'en_route':
                    $dispatch->markEnRoute();
                    $responder->responder_status = 'en_route';
                    $incident->responders_en_route += 1;
                    break;

                case 'arrived':
                    $dispatch->markArrived();
                    $responder->responder_status = 'busy';
                    if ($dispatch->status === 'en_route') {
                        $incident->responders_en_route = max(0, $incident->responders_en_route - 1);
                    }
                    $incident->responders_arrived += 1;
                    break;

                case 'transporting_to_hospital':
                    $dispatch->markTransportingToHospital();
                    // Keep responder status as 'busy' (already set during 'arrived')

                    // Decrement arrived counter (responder leaving scene)
                    if ($dispatch->status === 'arrived') {
                        $incident->responders_arrived = max(0, $incident->responders_arrived - 1);
                    }

                    // Calculate and cache hospital route
                    try {
                        $routeData = $this->hospitalRoutingService->calculateHospitalRoute($dispatch);
                        $this->hospitalRoutingService->cacheHospitalRoute($dispatch, $routeData);

                        Log::info('[DISPATCH] 🏥 Transporting to hospital', [
                            'dispatch_id' => $dispatch->id,
                            'hospital_id' => $routeData['hospital']['id'],
                            'hospital_name' => $routeData['hospital']['name'],
                            'distance_meters' => $routeData['route']['distance_meters'],
                        ]);
                    } catch (\Exception $e) {
                        Log::error('[DISPATCH] ❌ Failed to calculate hospital route', [
                            'dispatch_id' => $dispatch->id,
                            'error' => $e->getMessage(),
                        ]);
                        // Don't fail status update, allow manual navigation
                    }
                    break;

                case 'completed':
                    $dispatch->complete();
                    $responder->responder_status = 'idle';
                    $incident->responders_assigned = max(0, $incident->responders_assigned - 1);
                    if ($dispatch->status === 'en_route') {
                        $incident->responders_en_route = max(0, $incident->responders_en_route - 1);
                    }
                    if ($dispatch->status === 'arrived') {
                        $incident->responders_arrived = max(0, $incident->responders_arrived - 1);
                    }
                    // No counter changes needed for transporting_to_hospital (already decremented)
                    break;

                case 'declined':
                    $dispatch->decline($reason);
                    $responder->responder_status = 'idle';
                    $incident->responders_assigned = max(0, $incident->responders_assigned - 1);
                    break;

                case 'cancelled':
                    $dispatch->cancel($reason);
                    $responder->responder_status = 'idle';
                    $incident->responders_assigned = max(0, $incident->responders_assigned - 1);
                    if ($dispatch->status === 'en_route') {
                        $incident->responders_en_route = max(0, $incident->responders_en_route - 1);
                    }
                    if ($dispatch->status === 'arrived') {
                        $incident->responders_arrived = max(0, $incident->responders_arrived - 1);
                    }
                    break;
            }

            $responder->save();
            $incident->save();

            DB::commit();

            // Check if incident should auto-complete when all dispatches are finished
            if (in_array($newStatus, ['completed', 'declined', 'cancelled'])) {
                $this->checkAndCompleteIncident($incident);
            }

            Log::info('[DISPATCH] ✅ Dispatch status updated', [
                'dispatch_id' => $dispatch->id,
                'incident_id' => $incident->id,
                'responder_id' => $responder->id,
                'old_status' => $dispatch->status,
                'new_status' => $newStatus,
            ]);

            return $dispatch->fresh();
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('[DISPATCH] ❌ Failed to update dispatch status', [
                'dispatch_id' => $dispatch->id,
                'new_status' => $newStatus,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Check if incident should be auto-completed when all dispatches are finished.
     *
     * @param  Incident  $incident  The incident to check
     * @return void
     */
    private function checkAndCompleteIncident(Incident $incident): void
    {
        // Only auto-complete if no active dispatches remain
        $activeDispatches = Dispatch::where('incident_id', $incident->id)
            ->whereIn('status', ['assigned', 'accepted', 'en_route', 'arrived'])
            ->count();

        if ($activeDispatches === 0 && $incident->status === 'dispatched') {
            $incident->status = 'completed';
            $incident->completed_at = now();
            $incident->save();

            Log::info('[DISPATCH] 🎯 Incident auto-completed', [
                'incident_id' => $incident->id,
                'all_dispatches_finished' => true,
            ]);
        }
    }

    /**
     * Send notification to responder about new assignment.
     * Placeholder for future push notification implementation.
     *
     * @param  Dispatch  $dispatch  The dispatch
     */
    public function notifyResponder(Dispatch $dispatch): void
    {
        // TODO: Implement push notification via Firebase Cloud Messaging (FCM)
        // For now, responders will poll the API for new assignments

        Log::info('[DISPATCH] 📱 Notification placeholder (implement FCM later)', [
            'dispatch_id' => $dispatch->id,
            'responder_id' => $dispatch->responder_id,
            'responder_name' => $dispatch->responder->name,
            'incident_id' => $dispatch->incident_id,
        ]);
    }
}
