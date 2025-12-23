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
    const [mapLoaded, setMapLoaded] = useState(false);

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
                            background-color: #ef4444;
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            border: 3px solid white;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        ">
                            ${typeIcons[incident.type] || '⚠️'}
                        </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
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
                                background-color: #3b82f6;
                                width: 36px;
                                height: 36px;
                                border-radius: 50%;
                                border: 3px solid white;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 18px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            ">
                                🚑
                            </div>
                        `,
                        iconSize: [36, 36],
                        iconAnchor: [18, 18],
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
        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Legend */}
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs z-[1000]">
                <div className="font-semibold text-gray-700 mb-2">Map Legend</div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-sm">
                        {typeIcons[incident.type]}
                    </div>
                    <span className="text-gray-600">Incident Location</span>
                </div>
                {selectedResponder && (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm">
                            🚑
                        </div>
                        <span className="text-gray-600">Selected Responder</span>
                    </div>
                )}
            </div>
        </div>
    );
}
