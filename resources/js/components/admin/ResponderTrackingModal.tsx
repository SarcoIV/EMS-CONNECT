import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const responderMarkerRef = useRef<any>(null);
    const routePolylineRef = useRef<any>(null);

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

    // Initialize Leaflet map
    useEffect(() => {
        if (!isOpen || !mapContainerRef.current || isLoading) return;

        const initMap = async () => {
            const L = (await import('leaflet')).default;

            // Fix Leaflet default icon issue
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            if (mapRef.current) {
                mapRef.current.remove();
            }

            // Initialize map centered on incident
            mapRef.current = L.map(mapContainerRef.current).setView(
                [incident.latitude, incident.longitude],
                14
            );

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(mapRef.current);

            // Draw incident marker (red)
            const incidentIconHtml = `
                <div style="
                    background-color: #ef4444;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    font-size: 18px;
                ">
                    🚨
                </div>
            `;

            const incidentIcon = L.divIcon({
                html: incidentIconHtml,
                className: 'custom-marker',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });

            L.marker([incident.latitude, incident.longitude], { icon: incidentIcon })
                .addTo(mapRef.current)
                .bindPopup(`
                    <div style="min-width: 150px;">
                        <strong>Incident Location</strong><br/>
                        ${incident.address}
                    </div>
                `);

            // Draw route history polyline (if available)
            if (routeHistory.length > 0) {
                const routeCoords: [number, number][] = routeHistory.map(point => [
                    point.latitude,
                    point.longitude
                ]);

                routePolylineRef.current = L.polyline(routeCoords, {
                    color: '#3b82f6',
                    weight: 4,
                    opacity: 0.7,
                    dashArray: '10, 5',
                }).addTo(mapRef.current);

                // Add start marker (gray)
                const startPoint = routeHistory[0];
                const startIconHtml = `
                    <div style="
                        background-color: #6b7280;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                    "></div>
                `;

                const startIcon = L.divIcon({
                    html: startIconHtml,
                    className: 'custom-marker',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6],
                });

                L.marker([startPoint.latitude, startPoint.longitude], { icon: startIcon })
                    .addTo(mapRef.current)
                    .bindPopup('Route Start');
            }

            // Draw responder marker (blue ambulance)
            if (currentResponderLocation.latitude && currentResponderLocation.longitude) {
                const responderIconHtml = `
                    <div style="
                        background-color: #3b82f6;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        font-size: 20px;
                        animation: pulse 2s infinite;
                    ">
                        🚑
                    </div>
                `;

                const responderIcon = L.divIcon({
                    html: responderIconHtml,
                    className: 'custom-marker',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                });

                responderMarkerRef.current = L.marker(
                    [currentResponderLocation.latitude, currentResponderLocation.longitude],
                    { icon: responderIcon }
                ).addTo(mapRef.current).bindPopup(`
                    <div style="min-width: 150px;">
                        <strong>${dispatch.responder?.name}</strong><br/>
                        Status: ${dispatch.status.replace('_', ' ')}<br/>
                        Distance: ${dispatch.distance_text}<br/>
                        ETA: ${dispatch.duration_text}
                    </div>
                `);

                // Fit bounds to show both markers
                const bounds = L.latLngBounds([
                    [incident.latitude, incident.longitude],
                    [currentResponderLocation.latitude, currentResponderLocation.longitude]
                ]);

                if (routeHistory.length > 0) {
                    routeHistory.forEach(point => {
                        bounds.extend([point.latitude, point.longitude]);
                    });
                }

                mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
        };

        initMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [isOpen, isLoading, routeHistory, currentResponderLocation, dispatch, incident]);

    // Subscribe to real-time location updates
    useEffect(() => {
        if (!isOpen) return;

        const channel = echo.channel('admin-dashboard');

        channel.listen('ResponderLocationUpdated', async (event: any) => {
            if (event.responder_id !== dispatch.responder_id) return;

            console.log('[TRACKING MODAL] Responder location updated:', event);

            // Update current location state
            setCurrentResponderLocation({
                latitude: event.latitude,
                longitude: event.longitude,
            });

            // Update responder marker on map
            if (responderMarkerRef.current && mapRef.current) {
                const L = (await import('leaflet')).default;
                responderMarkerRef.current.setLatLng([event.latitude, event.longitude]);

                // Add new point to route polyline
                if (routePolylineRef.current) {
                    const currentLatLngs = routePolylineRef.current.getLatLngs();
                    currentLatLngs.push(L.latLng(event.latitude, event.longitude));
                    routePolylineRef.current.setLatLngs(currentLatLngs);
                }

                // Pan map to keep responder in view
                mapRef.current.panTo([event.latitude, event.longitude], {
                    animate: true,
                    duration: 0.5,
                });
            }

            // Add to route history state
            setRouteHistory(prev => [...prev, {
                latitude: event.latitude,
                longitude: event.longitude,
                accuracy: null,
                timestamp: event.updated_at,
            }]);
        });

        return () => {
            channel.stopListening('ResponderLocationUpdated');
        };
    }, [isOpen, dispatch.responder_id]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh]">
                <DialogHeader>
                    <DialogTitle>
                        Tracking: {dispatch.responder?.name || 'Responder'} → Incident #{incident.id}
                    </DialogTitle>
                </DialogHeader>

                {/* Add Leaflet CSS */}
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"
                    integrity="sha512-Zcn6bjR/8RZbLEpLIeOwNtzREBAJnUKESxces60Mpoj+2okopSAcSUIUOseddDm0cxnGQzxIR7vJgsLZbdLE3w=="
                    crossOrigin=""
                />

                {/* Custom animation */}
                <style>{`
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                    .custom-marker {
                        background: transparent !important;
                        border: none !important;
                    }
                `}</style>

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
                    {error && (
                        <div className="flex items-center justify-center h-full bg-red-50 rounded-lg">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && !dispatch.responder?.current_latitude && (
                        <div className="flex flex-col items-center justify-center h-full bg-amber-50 rounded-lg p-6 text-center">
                            <p className="text-amber-700 font-medium mb-2">Waiting for responder location...</p>
                            <p className="text-sm text-amber-600">The responder hasn't shared their location yet. The map will appear once they start moving.</p>
                        </div>
                    )}
                    {!isLoading && !error && dispatch.responder?.current_latitude && (
                        <div ref={mapContainerRef} className="flex-1 rounded-lg overflow-hidden border border-slate-200" />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
