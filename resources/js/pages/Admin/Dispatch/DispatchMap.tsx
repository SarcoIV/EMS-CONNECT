import { useEffect, useRef, useState } from 'react';

interface Incident {
    id: number;
    type: string;
    latitude: number;
    longitude: number;
    address: string;
}

interface Responder {
    id: number;
    name: string;
    current_latitude: number | null;
    current_longitude: number | null;
    base_latitude: number | null;
    base_longitude: number | null;
    distance_text: string;
    duration_text: string;
    route_coordinates?: [number, number][] | null;
}

interface DispatchMapProps {
    incident: Incident;
    selectedResponder: Responder | null;
}

// Incident type icons
const typeIcons: Record<string, string> = {
    medical: '🏥',
    fire: '🔥',
    accident: '🚗',
    crime: '🚨',
    natural_disaster: '🌊',
    other: '⚠️',
};

export default function DispatchMap({ incident, selectedResponder }: DispatchMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const incidentMarkerRef = useRef<any>(null);
    const responderMarkerRef = useRef<any>(null);
    const routePolylineRef = useRef<any>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Add Leaflet CSS
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link);
        };
    }, []);

    // Initialize map
    useEffect(() => {
        const initMap = async () => {
            if (!mapContainerRef.current || mapLoaded) return;

            try {
                // Dynamically import Leaflet
                const L = (await import('leaflet')).default;

                // Create map centered on incident
                const map = L.map(mapContainerRef.current).setView(
                    [incident.latitude, incident.longitude],
                    13
                );

                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                    maxZoom: 19,
                }).addTo(map);

                // Create incident marker (red)
                const incidentIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `
                        <div style="
                            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                            width: 48px;
                            height: 48px;
                            border-radius: 50%;
                            border: 4px solid white;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px rgba(239, 68, 68, 0.2);
                        ">
                            ${typeIcons[incident.type] || '⚠️'}
                        </div>
                    `,
                    iconSize: [48, 48],
                    iconAnchor: [24, 24],
                });

                const incidentMarker = L.marker([incident.latitude, incident.longitude], {
                    icon: incidentIcon,
                }).addTo(map);

                incidentMarker.bindPopup(`
                    <div style="font-size: 12px;">
                        <strong>📍 Incident Location</strong><br/>
                        <strong>Type:</strong> ${incident.type}<br/>
                        <strong>Address:</strong> ${incident.address || 'N/A'}
                    </div>
                `);

                mapRef.current = map;
                incidentMarkerRef.current = incidentMarker;
                setMapLoaded(true);
            } catch (error) {
                console.error('Failed to load map:', error);
            }
        };

        initMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                setMapLoaded(false);
            }
        };
    }, [incident]);

    // Update responder marker when selection changes
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;

        const updateResponderMarker = async () => {
            const L = (await import('leaflet')).default;

            // Remove existing responder marker
            if (responderMarkerRef.current) {
                mapRef.current.removeLayer(responderMarkerRef.current);
                responderMarkerRef.current = null;
            }

            // Remove existing route line
            if (routePolylineRef.current) {
                mapRef.current.removeLayer(routePolylineRef.current);
                routePolylineRef.current = null;
            }

            // Add new responder marker if selected
            if (selectedResponder) {
                const responderLat = selectedResponder.current_latitude ?? selectedResponder.base_latitude;
                const responderLon = selectedResponder.current_longitude ?? selectedResponder.base_longitude;

                if (responderLat && responderLon) {
                    // Create responder marker (blue)
                    const responderIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `
                            <div style="
                                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                                width: 42px;
                                height: 42px;
                                border-radius: 50%;
                                border: 4px solid white;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 22px;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px rgba(59, 130, 246, 0.2);
                            ">
                                🚑
                            </div>
                        `,
                        iconSize: [42, 42],
                        iconAnchor: [21, 21],
                    });

                    const responderMarker = L.marker([responderLat, responderLon], {
                        icon: responderIcon,
                    }).addTo(mapRef.current);

                    responderMarker.bindPopup(`
                        <div style="font-size: 12px;">
                            <strong>🚑 ${selectedResponder.name}</strong><br/>
                            <strong>Distance:</strong> ${selectedResponder.distance_text}<br/>
                            <strong>ETA:</strong> ${selectedResponder.duration_text}
                        </div>
                    `);

                    responderMarkerRef.current = responderMarker;

                    // Draw route line if coordinates available
                    if (selectedResponder.route_coordinates && selectedResponder.route_coordinates.length > 0) {
                        const routePolyline = L.polyline(selectedResponder.route_coordinates, {
                            color: '#3b82f6', // Blue color
                            weight: 4,
                            opacity: 0.7,
                            dashArray: '10, 10', // Dashed line
                        }).addTo(mapRef.current);

                        routePolylineRef.current = routePolyline;

                        console.log('[DISPATCH MAP] Route line drawn', {
                            responder_id: selectedResponder.id,
                            point_count: selectedResponder.route_coordinates.length,
                        });
                    }

                    // Fit bounds to show both markers
                    const bounds = L.latLngBounds([
                        [incident.latitude, incident.longitude],
                        [responderLat, responderLon],
                    ]);

                    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
                }
            } else {
                // No responder selected, center on incident
                mapRef.current.setView([incident.latitude, incident.longitude], 13);
            }
        };

        updateResponderMarker();
    }, [selectedResponder, mapLoaded, incident]);

    return (
        <div ref={mapContainerRef} className="w-full h-full" />
    );
}
