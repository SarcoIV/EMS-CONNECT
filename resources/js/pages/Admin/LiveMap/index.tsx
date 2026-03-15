import { useEffect, useState, useCallback, useRef } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { IncomingCallNotification } from '@/components/admin/IncomingCallNotification';
import axios from 'axios';
import type * as L from 'leaflet';

interface User {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
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
    completed_at?: string;
    user?: User;
    has_active_call: boolean;
    call_answered: boolean;
}

interface ActiveCall {
    id: number;
    channel_name: string;
    status: string;
    started_at: string;
    is_answered: boolean;
    user?: User;
    incident?: {
        id: number;
        type: string;
        latitude: number;
        longitude: number;
        address: string;
    };
}

interface Responder {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    status: string;
    activeDispatch?: {
        id: number;
        incident_id: number;
        status: string;
    };
}

interface ResponderLocationUpdate {
    responder_id: number;
    latitude: number;
    longitude: number;
    status: string;
    timestamp: string;
    activeDispatchId?: number;
    updated_at?: string;
}

interface RoutePoint {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: string;
}

interface Hospital {
    id: number;
    name: string;
    type: 'government' | 'private';
    address: string;
    latitude: number;
    longitude: number;
    phone_number: string | null;
    specialties: string[] | null;
    image_url: string | null;
    has_emergency_room: boolean;
    description: string | null;
    website: string | null;
    bed_capacity: number | null;
}

interface LiveMapProps {
    user: { name: string; email: string };
    incidents?: Incident[];
    activeCalls?: ActiveCall[];
    hospitals?: Hospital[];
    focusedIncidentId?: number;
    focusedHospitalId?: number;
}

const POLL_INTERVAL = 5000; // Poll every 5 seconds

// Marker colors by status
const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    dispatched: '#3b82f6',
    in_progress: '#8b5cf6',
    completed: '#10b981',
    cancelled: '#6b7280',
};

// Marker colors by type
const typeIcons: Record<string, string> = {
    medical: '🏥',
    fire: '🔥',
    accident: '🚗',
    crime: '🚨',
    natural_disaster: '🌊',
    other: '⚠️',
};

export default function LiveMap({
    user,
    incidents: initialIncidents = [],
    activeCalls: initialCalls = [],
    hospitals: initialHospitals = [],
    focusedIncidentId,
    focusedHospitalId
}: LiveMapProps) {
    const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
    const [activeCalls, setActiveCalls] = useState<ActiveCall[]>(initialCalls);
    const [hospitals, setHospitals] = useState<Hospital[]>(initialHospitals);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [showOnlyActive, setShowOnlyActive] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [responders, setResponders] = useState<Map<number, Responder>>(new Map());
    const [routeHistories, setRouteHistories] = useState<Map<number, RoutePoint[]>>(new Map());
    const [isTrackingMode, setIsTrackingMode] = useState(false);
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const responderMarkersRef = useRef<Map<number, L.Marker>>(new Map());
    const hospitalMarkersRef = useRef<L.Marker[]>([]);

    // Filter incidents
    const filteredIncidents = incidents.filter(incident => {
        if (filterStatus !== 'all' && incident.status !== filterStatus) return false;
        if (filterType !== 'all' && incident.type !== filterType) return false;
        if (showOnlyActive && incident.status === 'completed') return false;
        return true;
    });

    // Fetch route histories for active dispatches
    const fetchRouteHistories = useCallback(async (dispatches: Array<{ id: number }>) => {
        const histories = new Map<number, RoutePoint[]>();

        await Promise.all(dispatches.map(async (dispatch) => {
            try {
                const response = await axios.get(`/admin/dispatches/${dispatch.id}/route-history`);
                if (response.data.route_points && response.data.route_points.length > 0) {
                    histories.set(dispatch.id, response.data.route_points);
                }
            } catch {
                console.log(`[LIVEMAP] No route history for dispatch ${dispatch.id}`);
            }
        }));

        setRouteHistories(histories);
    }, []);

    // Fetch real-time data
    const fetchMapData = useCallback(async () => {
        try {
            console.log('[LIVEMAP] 🔄 Refreshing map data...');
            const response = await axios.get('/admin/live-map/data');

            setIncidents(response.data.incidents || []);
            setActiveCalls(response.data.activeCalls || []);
            setHospitals(response.data.hospitals || []);
            setLastUpdated(new Date());

            // Update markers on map
            updateMarkers(response.data.incidents || []);
            updateHospitalMarkers(response.data.hospitals || []);

            // Update responder markers from activeDispatches (replaces Echo real-time updates)
            if (response.data.activeDispatches) {
                response.data.activeDispatches.forEach((dispatch: any) => {
                    if (dispatch.responder && dispatch.responder.current_latitude) {
                        const responder: Responder = {
                            id: dispatch.responder_id,
                            name: dispatch.responder.name,
                            latitude: dispatch.responder.current_latitude,
                            longitude: dispatch.responder.current_longitude,
                            status: dispatch.responder.responder_status,
                            activeDispatch: {
                                id: dispatch.id,
                                incident_id: dispatch.incident_id,
                                status: dispatch.status,
                            },
                        };

                        setResponders(prev => {
                            const updated = new Map(prev);
                            updated.set(responder.id, responder);
                            return updated;
                        });

                        updateResponderMarker(responder);
                    }
                });
            }

            // Extract active dispatches from incidents and fetch route histories
            const allDispatches: Array<{ id: number }> = [];
            (response.data.incidents || []).forEach((incident: Incident) => {
                if (incident.dispatches && incident.dispatches.length > 0) {
                    allDispatches.push(...incident.dispatches);
                }
            });

            if (allDispatches.length > 0) {
                fetchRouteHistories(allDispatches);
            }
        } catch (error) {
            console.error('[LIVEMAP] ❌ Failed to fetch map data:', error);
        }
    }, [fetchRouteHistories]);

    // Initialize map
    useEffect(() => {
        // Dynamically import Leaflet to avoid SSR issues
        const initMap = async () => {
            if (typeof window === 'undefined') return;
            
            const L = (await import('leaflet')).default;

            // Fix Leaflet default icon issue
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            if (mapContainerRef.current && !mapRef.current) {
                // Default center (Project 6, Quezon City)
                const defaultCenter: [number, number] = [14.650, 121.045];
                const qcBounds: L.LatLngBoundsExpression = [
                    [14.59, 120.99],   // SW corner
                    [14.76, 121.10],   // NE corner
                ];

                mapRef.current = L.map(mapContainerRef.current, {
                    maxBounds: qcBounds,
                    maxBoundsViscosity: 1.0,
                    minZoom: 12,
                }).setView(defaultCenter, 13);

                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                }).addTo(mapRef.current);

                // Initial markers
                updateMarkers(initialIncidents);
                updateHospitalMarkers(initialHospitals);

                // Focus on specific incident if provided
                if (focusedIncidentId) {
                    const focused = initialIncidents.find(i => i.id === focusedIncidentId);
                    if (focused && focused.latitude && focused.longitude) {
                        mapRef.current.setView([focused.latitude, focused.longitude], 16);
                        setSelectedIncident(focused);
                    }
                }

                // Focus on specific hospital if provided
                if (focusedHospitalId && !focusedIncidentId) {
                    const focusedHospital = initialHospitals.find(h => h.id === focusedHospitalId);
                    if (focusedHospital && focusedHospital.latitude && focusedHospital.longitude) {
                        // Center map on hospital
                        mapRef.current.setView([focusedHospital.latitude, focusedHospital.longitude], 16);

                        // Find and open the hospital marker popup after markers are created
                        setTimeout(() => {
                            const hospitalMarker = hospitalMarkersRef.current.find((marker, index) => {
                                const hospital = initialHospitals[index];
                                return hospital && hospital.id === focusedHospitalId;
                            });
                            if (hospitalMarker) {
                                hospitalMarker.openPopup();
                            }
                        }, 500);
                    }
                }
            }
        };

        initMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Read URL parameters for tracking mode
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const trackParam = params.get('track');

        if (trackParam === 'true') {
            setIsTrackingMode(true);
            console.log('[LIVEMAP] 🎯 Tracking mode enabled');
        }
    }, []);

    // Update markers on map
    const updateMarkers = async (incidentData: Incident[]) => {
        if (!mapRef.current) return;
        
        const L = (await import('leaflet')).default;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add new markers
        incidentData.forEach(incident => {
            if (!incident.latitude || !incident.longitude) return;

            // Create custom icon
            const iconHtml = `
                <div style="
                    background-color: ${statusColors[incident.status] || '#6b7280'};
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    font-size: 16px;
                    ${incident.has_active_call ? 'animation: pulse 1s infinite;' : ''}
                ">
                    ${typeIcons[incident.type] || '⚠️'}
                </div>
                ${incident.has_active_call ? '<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#ef4444;border-radius:50%;border:2px solid white;"></div>' : ''}
            `;

            const icon = L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });

            const marker = L.marker([incident.latitude, incident.longitude], { icon })
                .addTo(mapRef.current);

            // Click to select incident (no popup)
            marker.on('click', () => setSelectedIncident(incident));

            markersRef.current.push(marker);
        });
    };

    // Update responder markers on map
    const updateResponderMarker = async (responder: Responder) => {
        if (!mapRef.current) return;

        const L = (await import('leaflet')).default;

        // Remove existing marker if it exists
        const existingMarker = responderMarkersRef.current.get(responder.id);
        if (existingMarker) {
            existingMarker.remove();
        }

        // Create responder icon
        const responderIconHtml = `
            <div style="
                background-color: ${responder.status === 'en_route' ? '#3b82f6' : '#10b981'};
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                font-size: 14px;
            ">
                🚑
            </div>
        `;

        const icon = L.divIcon({
            html: responderIconHtml,
            className: 'custom-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });

        const marker = L.marker([responder.latitude, responder.longitude], { icon })
            .addTo(mapRef.current);

        // Add popup
        const popupContent = `
            <div style="min-width: 150px;">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
                    🚑 ${responder.name}
                </div>
                <div style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${responder.status === 'en_route' ? '#3b82f6' : '#10b981'}20; color: ${responder.status === 'en_route' ? '#3b82f6' : '#10b981'};">
                    ${responder.status.toUpperCase()}
                </div>
                ${responder.activeDispatch ? `<div style="margin-top: 8px; font-size: 12px;">Assigned to Incident #${responder.activeDispatch.incident_id}</div>` : ''}
            </div>
        `;

        marker.bindPopup(popupContent);

        // Store marker reference
        responderMarkersRef.current.set(responder.id, marker);
    };

    // Update hospital markers on map
    const updateHospitalMarkers = async (hospitalData: Hospital[]) => {
        if (!mapRef.current) return;

        const L = (await import('leaflet')).default;

        // Clear existing hospital markers
        hospitalMarkersRef.current.forEach(marker => marker.remove());
        hospitalMarkersRef.current = [];

        // Add new hospital markers
        hospitalData.forEach(hospital => {
            if (!hospital.latitude || !hospital.longitude) return;

            // Create custom icon based on type
            const iconHtml = `
                <div style="
                    background-color: ${hospital.type === 'government' ? '#22c55e' : '#3b82f6'};
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    font-size: 14px;
                ">
                    🏥
                </div>
            `;

            const icon = L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });

            const marker = L.marker([hospital.latitude, hospital.longitude], { icon })
                .addTo(mapRef.current!);

            // Add popup
            const popupContent = `
                <div style="min-width: 200px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
                        🏥 ${hospital.name}
                    </div>
                    <div style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${hospital.type === 'government' ? '#22c55e' : '#3b82f6'}20; color: ${hospital.type === 'government' ? '#22c55e' : '#3b82f6'};">
                        ${hospital.type.toUpperCase()}
                    </div>
                    ${hospital.has_emergency_room ? '<span style="margin-left: 4px; color: #ef4444; font-size: 11px;">🚨 Emergency Room</span>' : ''}
                    <div style="margin-top: 8px; font-size: 12px;">
                        <strong>Address:</strong> ${hospital.address}<br/>
                        ${hospital.phone_number ? `<strong>Phone:</strong> ${hospital.phone_number}<br/>` : ''}
                        ${hospital.specialties && hospital.specialties.length > 0 ? `<strong>Specialties:</strong> ${hospital.specialties.slice(0, 3).join(', ')}${hospital.specialties.length > 3 ? '...' : ''}<br/>` : ''}
                        ${hospital.bed_capacity ? `<strong>Bed Capacity:</strong> ${hospital.bed_capacity}<br/>` : ''}
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent);

            hospitalMarkersRef.current.push(marker);
        });
    };

    // Draw route polylines for active dispatches
    const drawRoutePolylines = useCallback(async () => {
        if (!mapRef.current || routeHistories.size === 0) return;

        const L = (await import('leaflet')).default;

        // Clear existing polylines
        mapRef.current.eachLayer((layer: L.Layer) => {
            if (layer instanceof L.Polyline && !(layer instanceof L.Circle)) {
                mapRef.current?.removeLayer(layer);
            }
        });

        // Draw polylines for each dispatch
        routeHistories.forEach((points, dispatchId) => {
            if (points.length < 2) return; // Need at least 2 points for a line

            const coords: [number, number][] = points.map(p => [p.latitude, p.longitude]);

            const polyline = L.polyline(coords, {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.7,
                smoothFactor: 1,
            }).addTo(mapRef.current!);

            // Add popup showing dispatch info
            polyline.bindPopup(`
                <div style="min-width: 150px;">
                    <strong>Route History</strong><br/>
                    Dispatch #${dispatchId}<br/>
                    ${points.length} GPS points recorded
                </div>
            `);
        });
    }, [routeHistories]);

    // Set up polling
    useEffect(() => {
        console.log('[LIVEMAP] 🚀 Starting real-time map updates');
        const interval = setInterval(fetchMapData, POLL_INTERVAL);

        return () => {
            console.log('[LIVEMAP] 🛑 Stopping real-time updates');
            clearInterval(interval);
        };
    }, [fetchMapData]);

    // Draw route polylines when route histories change
    useEffect(() => {
        drawRoutePolylines();
    }, [routeHistories, drawRoutePolylines]);

    // Focus on incident
    const handleFocusIncident = (incident: Incident) => {
        if (mapRef.current && incident.latitude && incident.longitude) {
            mapRef.current.setView([incident.latitude, incident.longitude], 16);
            setSelectedIncident(incident);
        }
    };

    // Format time
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Get unique types for filter
    const uniqueTypes = [...new Set(incidents.map(i => i.type))];

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-red-50/30">
            <IncomingCallNotification />
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="relative flex-1">
                    {/* Add Leaflet CSS */}
                    <link
                        rel="stylesheet"
                        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"
                        integrity="sha512-Zcn6bjR/8RZbLEpLIeOwNtzREBAJnUKESxces60Mpoj+2okopSAcSUIUOseddDm0cxnGQzxIR7vJgsLZbdLE3w=="
                        crossOrigin=""
                    />
                    
                    {/* Custom marker animation */}
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

                    {/* Map Container */}
                    <div ref={mapContainerRef} className="h-full w-full" />

                    {/* Controls Overlay */}
                    <div className="absolute left-4 top-4 z-[1000] space-y-2">
                        {/* Filters */}
                        <div className="rounded-xl bg-white p-3 shadow-lg">
                            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Filters</div>
                            <div className="flex flex-wrap gap-2">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-red-300 focus:outline-none"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="dispatched">Dispatched</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-red-300 focus:outline-none"
                                >
                                    <option value="all">All Types</option>
                                    {uniqueTypes.map(type => (
                                        <option key={type} value={type}>
                                            {typeIcons[type] || '⚠️'} {(type || 'unknown').replace('_', ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={showOnlyActive}
                                    onChange={(e) => setShowOnlyActive(e.target.checked)}
                                    className="rounded"
                                />
                                Show only active
                            </label>
                        </div>

                        {/* Tracking Mode Indicator */}
                        {isTrackingMode && (
                            <div className="rounded-xl bg-blue-50 border-2 border-blue-300 p-3 shadow-lg">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium text-blue-700">Live Tracking Mode</span>
                                </div>
                            </div>
                        )}

                        {/* Legend */}
                        <div className="rounded-xl bg-white p-3 shadow-lg">
                            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Legend</div>
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusColors.pending }} />
                                    <span>Pending</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusColors.dispatched }} />
                                    <span>Dispatched</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusColors.in_progress }} />
                                    <span>In Progress</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusColors.completed }} />
                                    <span>Completed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-red-500" />
                                    <span>Active Call</span>
                                </div>
                                <div className="mt-2 border-t border-gray-200 pt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full bg-green-500" />
                                        <span>Gov Hospital</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full bg-blue-500" />
                                        <span>Private Hospital</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Overlay */}
                    <div className="absolute right-4 top-4 z-[1000] rounded-xl bg-white p-3 shadow-lg">
                        <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Overview</div>
                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div>
                                <p className="text-2xl font-bold text-amber-600">{incidents.filter(i => i.status === 'pending').length}</p>
                                <p className="text-xs text-slate-500">Pending</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-600">{incidents.filter(i => i.status === 'dispatched').length}</p>
                                <p className="text-xs text-slate-500">Dispatched</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600">{activeCalls.length}</p>
                                <p className="text-xs text-slate-500">Active Calls</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-600">{filteredIncidents.length}</p>
                                <p className="text-xs text-slate-500">Shown</p>
                            </div>
                        </div>
                        <div className="mt-2 text-center text-xs text-slate-400">
                            Updated: {lastUpdated.toLocaleTimeString()}
                        </div>
                    </div>

                    {/* Active Calls Panel */}
                    {activeCalls.length > 0 && (
                        <div className="absolute bottom-4 left-4 z-[1000] max-w-sm rounded-xl border-2 border-red-200 bg-red-50 p-3 shadow-lg">
                            <div className="mb-2 flex items-center gap-2">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                <span className="text-sm font-semibold text-red-700">Active Calls ({activeCalls.length})</span>
                            </div>
                            <div className="max-h-40 space-y-2 overflow-y-auto">
                                {activeCalls.map(call => (
                                    <div
                                        key={call.id}
                                        className="cursor-pointer rounded-lg bg-white p-2 text-sm shadow-sm hover:bg-red-50"
                                        onClick={() => call.incident && handleFocusIncident(call.incident)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{call.user?.name || 'Unknown'}</span>
                                            <span className={`text-xs ${call.is_answered ? 'text-green-600' : 'text-red-600'}`}>
                                                {call.is_answered ? '✓ Answered' : '📞 Calling'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">{call.incident?.address || 'No location'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Incident List Panel */}
                    <div className="absolute bottom-4 right-4 z-[1000] w-80 rounded-xl bg-white p-3 shadow-lg">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Recent Incidents</span>
                            <button
                                onClick={fetchMapData}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                title="Refresh"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-48 space-y-2 overflow-y-auto">
                            {filteredIncidents.length > 0 ? (
                                filteredIncidents.slice(0, 10).map(incident => (
                                    <div
                                        key={incident.id}
                                        onClick={() => handleFocusIncident(incident)}
                                        className={`cursor-pointer rounded-lg border p-2 transition hover:border-red-200 hover:bg-red-50 ${
                                            selectedIncident?.id === incident.id ? 'border-red-300 bg-red-50' : 'border-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span>{typeIcons[incident.type] || '⚠️'}</span>
                                                <span className="text-sm font-medium">#{incident.id}</span>
                                            </div>
                                            <span 
                                                className="rounded-full px-2 py-0.5 text-xs font-medium"
                                                style={{ 
                                                    backgroundColor: `${statusColors[incident.status] || '#6b7280'}20`,
                                                    color: statusColors[incident.status] || '#6b7280'
                                                }}
                                            >
                                                {incident.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 truncate text-xs text-slate-500">{incident.address || 'No address'}</p>
                                        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                                            <span>{incident.user?.name || 'Unknown'}</span>
                                            <span>{incident.created_at ? formatTime(incident.created_at) : 'N/A'}</span>
                                        </div>
                                        {incident.has_active_call && (
                                            <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                                                Active call
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="py-4 text-center text-sm text-slate-500">No incidents to display</p>
                            )}
                        </div>
                    </div>

                    {/* Selected Incident Detail */}
                    {selectedIncident && (
                        <div className="absolute left-1/2 top-4 z-[1000] w-80 -translate-x-1/2 rounded-xl bg-white p-4 shadow-xl">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{typeIcons[selectedIncident.type] || '⚠️'}</span>
                                        <div>
                                            <h3 className="font-bold text-slate-800">
                                                {(selectedIncident.type || 'unknown').replace('_', ' ').toUpperCase()}
                                            </h3>
                                            <p className="text-xs text-slate-500">Incident #{selectedIncident.id}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedIncident(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="mt-3 space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span 
                                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                                        style={{ 
                                            backgroundColor: `${statusColors[selectedIncident.status] || '#6b7280'}20`,
                                            color: statusColors[selectedIncident.status] || '#6b7280'
                                        }}
                                    >
                                        {(selectedIncident.status || 'unknown').toUpperCase()}
                                    </span>
                                    {selectedIncident.has_active_call && (
                                        <span className="flex items-center gap-1 text-xs text-red-600">
                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                                            Active Call
                                        </span>
                                    )}
                                </div>
                                
                                <div>
                                    <p className="text-xs text-slate-500">Reporter</p>
                                    <p className="font-medium">{selectedIncident.user?.name || 'Unknown'}</p>
                                    <p className="text-xs text-slate-500">{selectedIncident.user?.phone_number || selectedIncident.user?.email || 'N/A'}</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs text-slate-500">Location</p>
                                    <p>{selectedIncident.address || 'No address'}</p>
                                </div>
                                
                                {selectedIncident.description && (
                                    <div>
                                        <p className="text-xs text-slate-500">Description</p>
                                        <p className="text-slate-700">{selectedIncident.description}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-3 flex gap-2">
                                <a
                                    href={`/admin/incidents/${selectedIncident.id}/overview`}
                                    className="flex-1 rounded-lg bg-slate-100 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-200"
                                >
                                    View Incident
                                </a>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

