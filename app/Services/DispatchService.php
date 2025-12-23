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

    public function __construct(DistanceCalculationService $distanceService)
    {
        $this->distanceService = $distanceService;
    }

    /**
     * Get available responders for an incident with calculated distances.
     *
     * @param Incident $incident The incident
     * @return Collection Collection of responders with distance data
     */
    public function getAvailableResponders(Incident $incident): Collection
    {
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

        Log::info('[DISPATCH] Found available responders', [
            'incident_id' => $incident->id,
            'responder_count' => $responders->count(),
        ]);

        // Calculate distances for all responders
        return $this->distanceService->calculateDistancesForResponders($incident, $responders);
    }

    /**
     * Assign a responder to an incident.
     *
     * @param Incident $incident The incident
     * @param User $responder The responder to assign
     * @param User $admin The admin making the assignment
     * @return Dispatch The created dispatch record
     * @throws \Exception If assignment fails validation
     */
    public function assignResponder(
        Incident $incident,
        User $responder,
        User $admin
    ): Dispatch {
        // Validate incident can receive more responders
        if (!$incident->canAssignMoreResponders()) {
            throw new \Exception('Incident is already completed or cancelled');
        }

        // Validate responder is available
        if (!$responder->isAvailableForDispatch()) {
            throw new \Exception('Responder is not available for dispatch');
        }

        // Validate responder has location
        if (!$responder->hasLocation() && is_null($responder->base_latitude)) {
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
     * Update dispatch status (called by responder via mobile app).
     *
     * @param Dispatch $dispatch The dispatch to update
     * @param string $newStatus The new status
     * @param string|null $reason Reason for status change (for cancellations)
     * @return Dispatch Updated dispatch
     * @throws \Exception If status transition is invalid
     */
    public function updateDispatchStatus(
        Dispatch $dispatch,
        string $newStatus,
        ?string $reason = null
    ): Dispatch {
        $allowedStatuses = ['accepted', 'en_route', 'arrived', 'completed', 'cancelled'];

        if (!in_array($newStatus, $allowedStatuses)) {
            throw new \Exception("Invalid dispatch status: {$newStatus}");
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
     * Send notification to responder about new assignment.
     * Placeholder for future push notification implementation.
     *
     * @param Dispatch $dispatch The dispatch
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
