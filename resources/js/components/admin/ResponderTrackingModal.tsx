import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import axios from 'axios';

interface RoutePoint {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: string;
}

interface Responder {
    id: number;
    name: string;
    current_latitude: number | null;
    current_longitude: number | null;
    responder_status: string;
    location_updated_at: string;
}

interface Dispatch {
    id: number;
    responder_id: number;
    status: string;
    distance_text: string;
    duration_text: string;
    responder: Responder | null;
}

interface Incident {
    id: number;
    type: string;
    latitude: number;
    longitude: number;
    address: string;
}

interface Props {
    dispatch: Dispatch;
    incident: Incident;
    isOpen: boolean;
    onClose: () => void;
}

export function ResponderTrackingModal({ dispatch, incident, isOpen, onClose }: Props) {
    const [routeHistory, setRouteHistory] = useState<RoutePoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentResponderLocation, setCurrentResponderLocation] = useState({
        latitude: dispatch.responder?.current_latitude,
        longitude: dispatch.responder?.current_longitude,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    // Poll for route history updates while modal is open (replaces Echo real-time updates)
    useEffect(() => {
        if (!isOpen) return;

        let isFirstFetch = true;

        const pollRouteHistory = async () => {
            // Show loading only on first fetch
            if (isFirstFetch) {
                setIsLoading(true);
                setError(null);
            }

            try {
                const response = await axios.get(`/admin/dispatches/${dispatch.id}/route-history`);
                const points = response.data.route_points || [];

                setRouteHistory(points);

                if (isFirstFetch) {
                    console.log('[TRACKING MODAL] Route history loaded:', points.length, 'points');
                }

                // Update current responder location from latest point
                if (points.length > 0) {
                    const latestPoint = points[points.length - 1];
                    setCurrentResponderLocation({
                        latitude: latestPoint.latitude,
                        longitude: latestPoint.longitude,
                    });

                    // Pan map to follow responder
                    if (mapRef.current) {
                        mapRef.current.panTo({ lat: latestPoint.latitude, lng: latestPoint.longitude });
                    }
                }
            } catch (err: any) {
                if (isFirstFetch) {
                    console.error('[TRACKING MODAL] Failed to fetch route history:', err);
                    setRouteHistory([]);
                    console.log('[TRACKING MODAL] No route history available yet - showing current location only');
                }
            } finally {
                if (isFirstFetch) {
                    setIsLoading(false);
                    isFirstFetch = false;
                }
            }
        };

        // Initial fetch
        pollRouteHistory();

        // Poll every 5 seconds
        console.log('[TRACKING MODAL] Starting route history polling (every 5 seconds)');
        const interval = setInterval(pollRouteHistory, 5000);

        return () => {
            console.log('[TRACKING MODAL] Stopping route history polling');
            clearInterval(interval);
        };
    }, [isOpen, dispatch.id]);

    // Fit bounds when map loads or data changes
    useEffect(() => {
        if (!map || !currentResponderLocation.latitude) return;

        // Calculate bounds without using global google object
        const allPoints = [
            { lat: incident.latitude, lng: incident.longitude },
            { lat: currentResponderLocation.latitude, lng: currentResponderLocation.longitude },
            ...routeHistory.map(p => ({ lat: p.latitude, lng: p.longitude }))
        ];

        const lats = allPoints.map(p => p.lat);
        const lngs = allPoints.map(p => p.lng);

        const bounds = {
            north: Math.max(...lats),
            south: Math.min(...lats),
            east: Math.max(...lngs),
            west: Math.min(...lngs)
        };

        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }, [map, currentResponderLocation, routeHistory, incident]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] h-[90vh]">
                <DialogHeader>
                    <DialogTitle>
                        Tracking: {dispatch.responder?.name || 'Responder'} → Incident #{incident.id}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 h-full">
                    {/* Info Bar */}
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-xs text-slate-500">Status</span>
                                <p className="font-medium">{dispatch.status.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500">Distance</span>
                                <p className="font-medium">{dispatch.distance_text}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500">ETA</span>
                                <p className="font-medium">{dispatch.duration_text}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-slate-600">Live Tracking</span>
                        </div>
                    </div>

                    {/* Map Container */}
                    {isLoading && (
                        <div className="flex items-center justify-center h-full bg-slate-100 rounded-lg">
                            <p className="text-slate-500">Loading map...</p>
                        </div>
                    )}

                    {!isLoading && !dispatch.responder?.current_latitude && (
                        <div className="flex flex-col items-center justify-center h-full bg-amber-50 rounded-lg p-6 text-center">
                            <p className="text-amber-700 font-medium mb-2">Waiting for responder location...</p>
                            <p className="text-sm text-amber-600">
                                The responder hasn't shared their location yet. The map will appear once they start moving.
                            </p>
                        </div>
                    )}

                    {!isLoading && dispatch.responder?.current_latitude && (
                        <div className="flex-1 rounded-lg overflow-hidden border border-slate-200">
                            <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    zoom={14}
                                    center={{ lat: incident.latitude, lng: incident.longitude }}
                                    onLoad={(map) => { setMap(map); mapRef.current = map; }}
                                    onUnmount={() => { setMap(null); mapRef.current = null; }}
                                    options={{
                                        mapTypeControl: true,
                                        streetViewControl: true,
                                        fullscreenControl: true,
                                    }}
                                >
                                    {/* Incident Marker (Red) */}
                                    <Marker
                                        position={{ lat: incident.latitude, lng: incident.longitude }}
                                        icon={{
                                            path: 0, // CIRCLE symbol
                                            fillColor: '#ef4444',
                                            fillOpacity: 1,
                                            strokeColor: '#ffffff',
                                            strokeWeight: 3,
                                            scale: 12,
                                        }}
                                        label={{
                                            text: '🚨',
                                            fontSize: '18px',
                                        }}
                                        title={`Incident: ${incident.address}`}
                                    />

                                    {/* Placeholder: Straight line from responder to incident (when no route history) */}
                                    {routeHistory.length === 0 && currentResponderLocation.latitude && (
                                        <Polyline
                                            path={[
                                                { lat: currentResponderLocation.latitude, lng: currentResponderLocation.longitude },
                                                { lat: incident.latitude, lng: incident.longitude }
                                            ]}
                                            options={{
                                                strokeColor: '#94a3b8',
                                                strokeOpacity: 0.6,
                                                strokeWeight: 3,
                                                geodesic: true,
                                                icons: [{
                                                    icon: {
                                                        path: 'M 0,-1 0,1',
                                                        strokeOpacity: 1,
                                                        scale: 2,
                                                    },
                                                    offset: '0',
                                                    repeat: '10px',
                                                }],
                                            }}
                                        />
                                    )}

                                    {/* Route History Polyline */}
                                    {routeHistory.length > 0 && (
                                        <>
                                            <Polyline
                                                path={routeHistory.map(p => ({
                                                    lat: p.latitude,
                                                    lng: p.longitude
                                                }))}
                                                options={{
                                                    strokeColor: '#2563eb',
                                                    strokeOpacity: 0.9,
                                                    strokeWeight: 6,
                                                    geodesic: true,
                                                }}
                                            />

                                            {/* Start Point Marker (Gray) */}
                                            <Marker
                                                position={{
                                                    lat: routeHistory[0].latitude,
                                                    lng: routeHistory[0].longitude
                                                }}
                                                icon={{
                                                    path: 0, // CIRCLE symbol
                                                    fillColor: '#6b7280',
                                                    fillOpacity: 1,
                                                    strokeColor: '#ffffff',
                                                    strokeWeight: 2,
                                                    scale: 4,
                                                }}
                                                title="Route Start"
                                            />
                                        </>
                                    )}

                                    {/* Responder Marker (Blue) */}
                                    {currentResponderLocation.latitude && currentResponderLocation.longitude && (
                                        <Marker
                                            position={{
                                                lat: currentResponderLocation.latitude,
                                                lng: currentResponderLocation.longitude
                                            }}
                                            icon={{
                                                path: 0, // CIRCLE symbol
                                                fillColor: '#3b82f6',
                                                fillOpacity: 1,
                                                strokeColor: '#ffffff',
                                                strokeWeight: 3,
                                                scale: 14,
                                            }}
                                            label={{
                                                text: '🚑',
                                                fontSize: '20px',
                                            }}
                                            title={dispatch.responder?.name || 'Responder'}
                                        />
                                    )}
                                </GoogleMap>
                            </LoadScript>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
