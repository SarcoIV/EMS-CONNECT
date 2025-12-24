import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

interface ResponderMonitoringProps {
    dispatch: {
        id: number;
        status: string;
        assigned_at?: string;
        responder: {
            id: number;
            name: string;
            current_latitude: number | null;
            current_longitude: number | null;
        };
        incident: {
            id: number;
            type: string;
            address: string;
            latitude: number;
            longitude: number;
        };
        distance_text: string;
        duration_text: string;
    };
    onClose: () => void;
}

interface RoutePoint {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: string;
}

const typeIcons: Record<string, string> = {
    medical: '🏥',
    fire: '🔥',
    accident: '🚗',
    crime: '🚨',
    natural_disaster: '🌊',
    other: '⚠️',
};

export default function ResponderMonitoring({ dispatch, onClose }: ResponderMonitoringProps) {
    const [routeHistory, setRouteHistory] = useState<RoutePoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch route history
    const fetchRouteHistory = useCallback(async () => {
        try {
            const response = await axios.get(`/admin/dispatches/${dispatch.id}/route-history`);
            setRouteHistory(response.data.route_points);
            setError(null);
        } catch (err) {
            console.error('[MONITORING] Failed to fetch route history:', err);
            setError('Failed to load route history');
        } finally {
            setLoading(false);
        }
    }, [dispatch.id]);

    // Poll for updates every 5 seconds
    useEffect(() => {
        fetchRouteHistory();
        const interval = setInterval(fetchRouteHistory, 5000);
        return () => clearInterval(interval);
    }, [fetchRouteHistory]);

    // Calculate time elapsed since dispatch
    const getElapsedTime = () => {
        const now = new Date();
        const start = new Date(dispatch.assigned_at || now);
        const diffMs = now.getTime() - start.getTime();
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    return (
        <div className="absolute bottom-4 left-4 z-[1000] w-96 max-h-[70vh] rounded-xl bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold uppercase opacity-90">Live Monitoring</div>
                        <h3 className="text-lg font-bold mt-1">{dispatch.responder.name}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Status Badge */}
                <div className="mt-3 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium">{dispatch.status.toUpperCase()}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[calc(70vh-140px)] overflow-y-auto">
                {/* Incident Info */}
                <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500 mb-2">
                        Destination
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-2xl">{typeIcons[dispatch.incident.type] || '⚠️'}</span>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{dispatch.incident.type}</p>
                            <p className="text-xs text-slate-600 mt-1">{dispatch.incident.address}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-blue-50 p-3">
                        <div className="text-xs font-semibold uppercase text-blue-600 mb-1">
                            Distance
                        </div>
                        <p className="text-lg font-bold text-blue-900">{dispatch.distance_text}</p>
                    </div>

                    <div className="rounded-lg bg-purple-50 p-3">
                        <div className="text-xs font-semibold uppercase text-purple-600 mb-1">
                            ETA
                        </div>
                        <p className="text-lg font-bold text-purple-900">{dispatch.duration_text}</p>
                    </div>

                    <div className="rounded-lg bg-green-50 p-3 col-span-2">
                        <div className="text-xs font-semibold uppercase text-green-600 mb-1">
                            Time Elapsed
                        </div>
                        <p className="text-lg font-bold text-green-900">{getElapsedTime()}</p>
                    </div>
                </div>

                {/* GPS Breadcrumb Trail */}
                <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500 mb-2">
                        GPS Breadcrumb Trail ({routeHistory.length} points)
                    </div>

                    {loading ? (
                        <p className="text-sm text-slate-500">Loading route history...</p>
                    ) : error ? (
                        <p className="text-sm text-red-600">{error}</p>
                    ) : routeHistory.length === 0 ? (
                        <p className="text-sm text-slate-500">No GPS data yet</p>
                    ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {routeHistory.slice(-10).reverse().map((point, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-slate-600">
                                        {new Date(point.timestamp).toLocaleTimeString()}
                                    </span>
                                    {point.accuracy && (
                                        <span className="text-slate-400">
                                            ±{point.accuracy.toFixed(0)}m
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Current Location */}
                {dispatch.responder.current_latitude && dispatch.responder.current_longitude && (
                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-3">
                        <div className="text-xs font-semibold uppercase text-blue-700 mb-2">
                            Current Location
                        </div>
                        <div className="font-mono text-xs text-blue-900">
                            {dispatch.responder.current_latitude.toFixed(6)}, {dispatch.responder.current_longitude.toFixed(6)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
