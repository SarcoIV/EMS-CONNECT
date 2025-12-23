import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { IncomingCallNotification } from '@/components/admin/IncomingCallNotification';
import axios from 'axios';
import DispatchMap from './DispatchMap';
import RespondersList from './RespondersList';

interface User {
    id: number;
    name: string;
    email: string;
}

interface IncidentUser {
    id: number;
    name: string;
    phone_number: string;
    email: string;
}

interface Dispatch {
    id: number;
    status: string;
    responder: {
        id: number;
        name: string;
        phone_number: string;
    };
    distance_text: string;
    duration_text: string;
    assigned_at: string;
}

interface Incident {
    id: number;
    type: string;
    status: string;
    latitude: number;
    longitude: number;
    address: string;
    description: string;
    created_at: string;
    dispatched_at?: string;
    user: IncidentUser;
    dispatches: Dispatch[];
}

interface Responder {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    responder_status: string;
    is_on_duty: boolean;
    current_latitude: number | null;
    current_longitude: number | null;
    base_latitude: number | null;
    base_longitude: number | null;
    location_updated_at: string | null;
    distance_meters: number | null;
    distance_text: string;
    duration_seconds: number | null;
    duration_text: string;
    distance_method?: string;
}

interface DispatchProps {
    user: User;
    incident: Incident;
}

const POLL_INTERVAL = 10000; // Refresh responders every 10 seconds

export default function Dispatch({ user, incident }: DispatchProps) {
    const [responders, setResponders] = useState<Responder[]>([]);
    const [selectedResponder, setSelectedResponder] = useState<Responder | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingResponders, setIsLoadingResponders] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch available responders
    const fetchResponders = useCallback(async () => {
        try {
            setIsLoadingResponders(true);
            setError(null);

            const response = await axios.get(`/admin/incidents/${incident.id}/available-responders`);

            if (response.data.responders && Array.isArray(response.data.responders)) {
                setResponders(response.data.responders);

                if (response.data.responders.length === 0) {
                    setError(response.data.message || 'No available responders found');
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch responders:', err);
            setError(err.response?.data?.message || 'Failed to load responder list. Please refresh the page.');
        } finally {
            setIsLoadingResponders(false);
        }
    }, [incident.id]);

    // Fetch responders on mount
    useEffect(() => {
        fetchResponders();

        // Poll for updates every 10 seconds
        const interval = setInterval(fetchResponders, POLL_INTERVAL);

        return () => clearInterval(interval);
    }, [fetchResponders]);

    // Handle responder selection
    const handleSelectResponder = (responder: Responder) => {
        setSelectedResponder(responder);
        setError(null);
    };

    // Handle confirm dispatch
    const handleConfirmDispatch = async () => {
        if (!selectedResponder) return;

        // Show confirmation dialog
        const confirmed = window.confirm(
            `Dispatch ${selectedResponder.name} to this incident?\n\n` +
            `Distance: ${selectedResponder.distance_text}\n` +
            `ETA: ${selectedResponder.duration_text}\n\n` +
            `The responder will be notified and can accept the assignment via their mobile app.`
        );

        if (!confirmed) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await axios.post('/admin/dispatch/assign', {
                incident_id: incident.id,
                responder_id: selectedResponder.id,
            });

            alert(`✅ ${response.data.message}\n\nResponder: ${selectedResponder.name}\nDistance: ${selectedResponder.distance_text}\nETA: ${selectedResponder.duration_text}`);

            // Redirect back to dashboard
            window.location.href = '/admin/dashboard';
        } catch (err: any) {
            console.error('Failed to assign responder:', err);
            const errorMessage = err.response?.data?.message || 'Failed to assign responder. Please try again.';
            setError(errorMessage);
            alert(`❌ Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                {/* Incoming Call Notification */}
                <IncomingCallNotification user={user} />

                <main className="flex-1 flex flex-col p-6 overflow-hidden bg-gradient-to-br from-slate-50 to-red-50/30">
                    {/* Page Header */}
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-gray-900">Dispatch Responder</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Select a responder to assign to incident #{incident.id} ({incident.type})
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* TOP: Map Section (60% height) */}
                    <div className="h-3/5 mb-4">
                        <DispatchMap
                            incident={incident}
                            selectedResponder={selectedResponder}
                        />
                    </div>

                    {/* BOTTOM: Responders List (40% height) */}
                    <div className="h-2/5">
                        <RespondersList
                            responders={responders}
                            selectedResponder={selectedResponder}
                            onSelectResponder={handleSelectResponder}
                            onConfirmDispatch={handleConfirmDispatch}
                            isLoading={isLoading}
                            isLoadingResponders={isLoadingResponders}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}
