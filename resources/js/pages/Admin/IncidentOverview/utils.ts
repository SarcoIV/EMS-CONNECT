import { Incident, TimelineEvent } from './types';

/**
 * Format ISO 8601 datetime string to human-readable format
 */
export const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Format ISO 8601 datetime string to time only
 */
export const formatTime = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Calculate duration between two timestamps
 */
export const calculateDuration = (start: string, end: string | null): string => {
    if (!end) return 'Ongoing';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes < 1) {
        return `${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
};

/**
 * Build chronological timeline from incident and dispatch events
 */
export const buildTimeline = (incident: Incident): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // 1. Incident Reported
    events.push({
        id: 'reported',
        timestamp: incident.created_at,
        title: 'Incident Reported',
        details: `By ${incident.reporter.name} at ${incident.address}`,
        color: 'bg-red-500',
        icon: 'alert-circle',
    });

    // 2. Dispatched
    if (incident.dispatched_at) {
        events.push({
            id: 'dispatched',
            timestamp: incident.dispatched_at,
            title: 'Incident Dispatched',
            details: `${incident.dispatches.length} responder(s) assigned`,
            color: 'bg-blue-500',
            icon: 'radio',
        });
    }

    // 3. Dispatch events for each responder
    incident.dispatches.forEach((dispatch) => {
        if (dispatch.assigned_at) {
            events.push({
                id: `dispatch-${dispatch.id}-assigned`,
                timestamp: dispatch.assigned_at,
                title: `${dispatch.responder.name} Assigned`,
                details: `Distance: ${dispatch.distance_text}, ETA: ${dispatch.duration_text}`,
                color: 'bg-blue-400',
                icon: 'user-plus',
            });
        }

        if (dispatch.accepted_at) {
            events.push({
                id: `dispatch-${dispatch.id}-accepted`,
                timestamp: dispatch.accepted_at,
                title: `${dispatch.responder.name} Accepted`,
                details: 'Responder confirmed assignment',
                color: 'bg-cyan-500',
                icon: 'check',
            });
        }

        if (dispatch.en_route_at) {
            events.push({
                id: `dispatch-${dispatch.id}-enroute`,
                timestamp: dispatch.en_route_at,
                title: `${dispatch.responder.name} En Route`,
                details: 'Responder is traveling to incident',
                color: 'bg-purple-500',
                icon: 'navigation',
            });
        }

        if (dispatch.arrived_at) {
            events.push({
                id: `dispatch-${dispatch.id}-arrived`,
                timestamp: dispatch.arrived_at,
                title: `${dispatch.responder.name} Arrived`,
                details: 'Responder reached incident scene',
                color: 'bg-amber-500',
                icon: 'map-pin',
            });
        }

        if (dispatch.completed_at) {
            events.push({
                id: `dispatch-${dispatch.id}-completed`,
                timestamp: dispatch.completed_at,
                title: `${dispatch.responder.name} Completed`,
                details: 'Response completed',
                color: 'bg-emerald-500',
                icon: 'check-circle',
            });
        }

        if (dispatch.cancelled_at) {
            const isDeclined = dispatch.status === 'declined';
            events.push({
                id: `dispatch-${dispatch.id}-cancelled`,
                timestamp: dispatch.cancelled_at,
                title: `${dispatch.responder.name} ${isDeclined ? 'Declined' : 'Cancelled'}`,
                details: dispatch.cancellation_reason || 'No reason provided',
                color: isDeclined ? 'bg-red-500' : 'bg-slate-500',
                icon: 'x-circle',
            });
        }
    });

    // 4. Incident Completed
    if (incident.completed_at) {
        events.push({
            id: 'completed',
            timestamp: incident.completed_at,
            title: 'Incident Completed',
            details: 'All responses finalized',
            color: 'bg-emerald-600',
            icon: 'check-circle',
        });
    }

    // Sort chronologically
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};
