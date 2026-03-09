export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Reporter {
    id: number;
    name: string;
    email: string;
    phone_number: string;
}

export interface Admin {
    id: number;
    name: string;
}

export interface Responder {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    responder_status: string;
    current_latitude: number | null;
    current_longitude: number | null;
    location_updated_at: string | null;
}

export interface PreArrivalForm {
    caller_name: string;
    patient_name: string;
    sex: string;
    age: number;
    incident_type: string;
    estimated_arrival: string | null;
    submitted_at: string;
}

export interface Dispatch {
    id: number;
    status: string;
    distance_meters: number | null;
    distance_text: string;
    estimated_duration_seconds: number | null;
    duration_text: string;
    assigned_at: string;
    accepted_at: string | null;
    en_route_at: string | null;
    arrived_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    responder: Responder;
    assigned_by: Admin | null;
    pre_arrival_forms: PreArrivalForm[];
}

export interface Call {
    id: number;
    channel_name: string;
    status: string;
    initiator_type: string;
    started_at: string;
    answered_at: string | null;
    ended_at: string | null;
    caller: {
        id: number;
        name: string;
        phone_number: string;
    };
    receiver: {
        id: number;
        name: string;
    } | null;
}

export interface Incident {
    id: number;
    type: string;
    status: string;
    latitude: number;
    longitude: number;
    address: string;
    description: string;
    created_at: string;
    dispatched_at: string | null;
    completed_at: string | null;
    responders_assigned: number;
    responders_en_route: number;
    responders_arrived: number;
    reporter: Reporter;
    assigned_admin: Admin | null;
    dispatches: Dispatch[];
    calls: Call[];
}

export interface IncidentOverviewProps {
    user: User;
    incident: Incident;
}

export interface TimelineEvent {
    id: string;
    timestamp: string;
    title: string;
    details: string;
    color: string;
    icon: string;
}
