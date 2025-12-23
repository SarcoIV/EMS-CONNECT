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

// Status color coding
const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    dispatched: '#3b82f6',
    in_progress: '#8b5cf6',
    completed: '#10b981',
    cancelled: '#6b7280',
};

// Incident type icons
const typeIcons: Record<string, string> = {
    medical: '🏥',
    fire: '🔥',
    accident: '🚗',
    crime: '🚨',
    natural_disaster: '🌊',
    other: '⚠️',
};

const POLL_INTERVAL = 5000; // Refresh responders every 5 seconds

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

                <main className="relative flex-1 bg-gradient-to-br from-slate-50 to-red-50/30">
                    {/* Full-screen map */}
                    <div className="h-full w-full">
                        <DispatchMap
                            incident={incident}
                            selectedResponder={selectedResponder}
                        />
                    </div>

                    {/* Incident Info Panel - Top Left */}
                    <div className="absolute left-4 top-4 z-[1000] rounded-xl bg-white p-4 shadow-xl max-w-md">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">{typeIcons[incident.type]}</span>
                            <div>
                                <h3 className="font-bold text-slate-800">
                                    {incident.type.toUpperCase()} - #{incident.id}
                                </h3>
                                <span className="text-xs text-slate-500">
                                    {incident.address}
                                </span>
                            </div>
                        </div>

                        {/* Status badge */}
                        <div className="mb-3">
                            <span
                                className="rounded-full px-3 py-1 text-xs font-medium"
                                style={{
                                    backgroundColor: `${statusColors[incident.status]}20`,
                                    color: statusColors[incident.status],
                                }}
                            >
                                {incident.status.toUpperCase()}
                            </span>
                        </div>

                        {/* Incident details */}
                        <div className="space-y-2 text-sm">
                            <div>
                                <p className="text-xs text-slate-500">Reporter</p>
                                <p className="font-medium">{incident.user.name}</p>
                                <p className="text-xs text-slate-500">{incident.user.phone_number}</p>
                            </div>
                            {incident.description && (
                                <div>
                                    <p className="text-xs text-slate-500">Description</p>
                                    <p className="text-slate-700">{incident.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Legend Panel - Bottom Left */}
                    <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-white p-3 shadow-lg">
                        <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Legend</div>
                        <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-sm">
                                    {typeIcons[incident.type]}
                                </div>
                                <span className="text-slate-700">Incident Location</span>
                            </div>
                            {selectedResponder && (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm">
                                        🚑
                                    </div>
                                    <span className="text-slate-700">Selected Responder</span>
                                </div>
                            )}
                            <div className="mt-2 pt-2 border-t border-slate-200">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-green-600"></span>
                                    <span className="text-slate-600">Nearest</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Toast - Top Center */}
                    {error && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] max-w-md rounded-xl bg-red-50 border-2 border-red-200 p-4 shadow-xl">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-800">Error</h3>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                                <button
                                    onClick={() => setError(null)}
                                    className="flex-shrink-0 text-red-400 hover:text-red-600"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Responders Panel - Bottom Right */}
                    <div className="absolute bottom-4 right-4 z-[1000] w-96 max-h-[60vh] rounded-xl bg-white shadow-lg">
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
