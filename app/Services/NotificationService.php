<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Create a notification for a specific admin user
     */
    public static function create(int $userId, string $type, string $title, string $message, ?array $data = null): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }

    /**
     * Notify all admin users
     */
    public static function notifyAllAdmins(string $type, string $title, string $message, ?array $data = null): int
    {
        $admins = User::where('user_role', 'admin')->get();
        $count = 0;

        foreach ($admins as $admin) {
            self::create($admin->id, $type, $title, $message, $data);
            $count++;
        }

        return $count;
    }

    /**
     * Notify about a new incident
     */
    public static function newIncident(int $incidentId, string $incidentType, string $reporterName, string $address): int
    {
        return self::notifyAllAdmins(
            type: 'new_incident',
            title: '🚨 New Emergency Reported',
            message: "{$reporterName} reported a {$incidentType} emergency at {$address}",
            data: [
                'incident_id' => $incidentId,
                'incident_type' => $incidentType,
                'reporter_name' => $reporterName,
                'address' => $address,
                'action_url' => "/admin/dispatch/{$incidentId}",
            ]
        );
    }

    /**
     * Notify about dispatch accepted by responder
     */
    public static function dispatchAccepted(int $adminId, int $dispatchId, int $incidentId, string $responderName, string $incidentType): Notification
    {
        return self::create(
            userId: $adminId,
            type: 'dispatch_accepted',
            title: '✅ Dispatch Accepted',
            message: "{$responderName} accepted the {$incidentType} dispatch",
            data: [
                'dispatch_id' => $dispatchId,
                'incident_id' => $incidentId,
                'responder_name' => $responderName,
                'action_url' => "/admin/live-map?incident={$incidentId}",
            ]
        );
    }

    /**
     * Notify about emergency call
     */
    public static function emergencyCall(int $callId, string $callerName, ?string $incidentType = null): int
    {
        $message = $incidentType
            ? "{$callerName} is calling about a {$incidentType} emergency"
            : "{$callerName} is calling for emergency assistance";

        return self::notifyAllAdmins(
            type: 'emergency_call',
            title: '📞 Incoming Emergency Call',
            message: $message,
            data: [
                'call_id' => $callId,
                'caller_name' => $callerName,
                'incident_type' => $incidentType,
            ]
        );
    }

    /**
     * Notify about responder arrival
     */
    public static function responderArrived(int $adminId, int $incidentId, string $responderName, string $incidentType): Notification
    {
        return self::create(
            userId: $adminId,
            type: 'responder_arrived',
            title: '📍 Responder Arrived',
            message: "{$responderName} arrived at {$incidentType} scene",
            data: [
                'incident_id' => $incidentId,
                'responder_name' => $responderName,
                'action_url' => "/admin/live-map?incident={$incidentId}",
            ]
        );
    }

    /**
     * Notify about incident completion
     */
    public static function incidentCompleted(int $adminId, int $incidentId, string $incidentType, string $address): Notification
    {
        return self::create(
            userId: $adminId,
            type: 'incident_completed',
            title: '✅ Incident Completed',
            message: "{$incidentType} incident at {$address} has been resolved",
            data: [
                'incident_id' => $incidentId,
                'incident_type' => $incidentType,
                'address' => $address,
                'action_url' => "/admin/incidents/{$incidentId}",
            ]
        );
    }
}
