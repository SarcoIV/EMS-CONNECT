import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import axios from 'axios';
import echo from '@/echo';

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

    // Fetch route history when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const fetchRouteHistory = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await axios.get(`/admin/dispatches/${dispatch.id}/route-history`);
                setRouteHistory(response.data.route_points || []);
                console.log('[TRACKING MODAL] Route history loaded:', response.data.route_points?.length || 0, 'points');
            } catch (err: any) {
                console.error('[TRACKING MODAL] Failed to fetch route history:', err);
                // Don't set error - just show map without route history
                // This is normal for newly assigned dispatches
                setRouteHistory([]);
                console.log('[TRACKING MODAL] No route history available yet - showing current location only');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRouteHistory();
    }, [isOpen, dispatch.id]);

    // Fit bounds when map loads or data changes
    useEffect(() => {
        if (!map || !currentResponderLocation.latitude) return;

        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: incident.latitude, lng: incident.longitude });
        bounds.extend({
            lat: currentResponderLocation.latitude,
            lng: currentResponderLocation.longitude
        });

        routeHistory.forEach(point => {
            bounds.extend({ lat: point.latitude, lng: point.longitude });
        });

        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }, [map, currentResponderLocation, routeHistory, incident]);

    // Subscribe to real-time location updates
    useEffect(() => {
        if (!isOpen) return;

        const channel = echo.channel('admin-dashboard');

        channel.listen('ResponderLocationUpdated', (event: any) => {
            if (event.responder_id !== dispatch.responder_id) return;

            console.log('[TRACKING MODAL] Responder location updated:', event);

            // Update current location state
            setCurrentResponderLocation({
                latitude: event.latitude,
                longitude: event.longitude,
            });

            // Add to route history state (polyline will auto-update via state)
            setRouteHistory(prev => [...prev, {
                latitude: event.latitude,
                longitude: event.longitude,
                accuracy: null,
                timestamp: event.updated_at,
            }]);

            // Pan map to keep responder in view
            if (map) {
                map.panTo({ lat: event.latitude, lng: event.longitude });
            }
        });

        return () => {
            channel.stopListening('ResponderLocationUpdated');
        };
    }, [isOpen, dispatch.responder_id, map]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh]">
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
                                    onLoad={(map) => setMap(map)}
                                    onUnmount={() => setMap(null)}
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
                                            path: google.maps.SymbolPath.CIRCLE,
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

                                    {/* Route History Polyline */}
                                    {routeHistory.length > 0 && (
                                        <>
                                            <Polyline
                                                path={routeHistory.map(p => ({
                                                    lat: p.latitude,
                                                    lng: p.longitude
                                                }))}
                                                options={{
                                                    strokeColor: '#3b82f6',
                                                    strokeOpacity: 0.7,
                                                    strokeWeight: 4,
                                                }}
                                            />

                                            {/* Start Point Marker (Gray) */}
                                            <Marker
                                                position={{
                                                    lat: routeHistory[0].latitude,
                                                    lng: routeHistory[0].longitude
                                                }}
                                                icon={{
                                                    path: google.maps.SymbolPath.CIRCLE,
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
                                                path: google.maps.SymbolPath.CIRCLE,
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
