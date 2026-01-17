import { useEffect, useState, useCallback, useRef } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { IncomingCallNotification } from '@/components/admin/IncomingCallNotification';
import ResponderMonitoring from './LiveMap/ResponderMonitoring';
import axios from 'axios';

// Import Leaflet CSS in your app.css or here
// You'll need to add: @import 'leaflet/dist/leaflet.css';

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
    email: string;
    phone_number: string;
    current_latitude: number | null;
    current_longitude: number | null;
    base_latitude: number | null;
    base_longitude: number | null;
    responder_status: string;
    is_on_duty: boolean;
    location_updated_at: string | null;
}

interface Dispatch {
    id: number;
    incident_id: number;
    responder_id: number;
    status: string;
    distance_meters: number;
    distance_text: string;
    duration_text: string;
    assigned_at: string;
    accepted_at: string | null;
    en_route_at: string | null;
    arrived_at: string | null;
    responder: Responder | null;
    incident: {
        id: number;
        type: string;
        status: string;
        latitude: number;
        longitude: number;
        address: string;
    } | null;
}

interface LiveMapProps {
    user: { name: string; email: string };
    incidents: Incident[];
    activeCalls: ActiveCall[];
    activeDispatches: Dispatch[];
    activeResponders: Responder[];
    focusedIncidentId?: number;
}

const POLL_INTERVAL = 5000; // Poll every 5 seconds

// Marker colors by status
const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    dispatched: '#3b82f6',
    completed: '#10b981',
    cancelled: '#6b7280',
};

// Responder status colors
const responderStatusColors: Record<string, string> = {
    idle: '#10b981',        // Green
    assigned: '#f59e0b',    // Amber
    en_route: '#3b82f6',    // Blue
    arrived: '#8b5cf6',     // Purple
    busy: '#ef4444',        // Red
    offline: '#6b7280',     // Gray
};

// Dispatch status colors
const dispatchStatusColors: Record<string, string> = {
    assigned: '#f59e0b',    // Amber
    accepted: '#3b82f6',    // Blue
    en_route: '#3b82f6',    // Blue
    arrived: '#8b5cf6',     // Purple
    completed: '#10b981',   // Green
    cancelled: '#6b7280',   // Gray
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
    incidents: initialIncidents,
    activeCalls: initialCalls,
    activeDispatches: initialDispatches,
    activeResponders: initialResponders,
    focusedIncidentId
}: LiveMapProps) {
    const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
    const [activeCalls, setActiveCalls] = useState<ActiveCall[]>(initialCalls);
    const [activeDispatches, setActiveDispatches] = useState<Dispatch[]>(initialDispatches);
    const [activeResponders, setActiveResponders] = useState<Responder[]>(initialResponders);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
    const [monitoredDispatch, setMonitoredDispatch] = useState<Dispatch | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [showOnlyActive, setShowOnlyActive] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<any[]>([]);
    const responderMarkersRef = useRef<any[]>([]);
    const routeLinesRef = useRef<any[]>([]);
    const breadcrumbPolylineRef = useRef<any>(null);

    // Filter incidents
    const filteredIncidents = incidents.filter(incident => {
        if (filterStatus !== 'all' && incident.status !== filterStatus) return false;
        if (filterType !== 'all' && incident.type !== filterType) return false;
        if (showOnlyActive && incident.status === 'completed') return false;
        return true;
    });

    // Fetch real-time data
    const fetchMapData = useCallback(async () => {
        try {
            console.log('[LIVEMAP] 🔄 Refreshing map data...');
            const response = await axios.get('/admin/live-map/data');

            setIncidents(response.data.incidents);
            setActiveCalls(response.data.activeCalls);
            setActiveDispatches(response.data.activeDispatches || []);
            setActiveResponders(response.data.activeResponders || []);
            setLastUpdated(new Date());

            // Update markers on map
            updateMarkers(response.data.incidents);
            updateResponderMarkersAndRoutes(response.data.activeDispatches || [], response.data.activeResponders || []);
        } catch (error) {
            console.error('[LIVEMAP] ❌ Failed to fetch map data:', error);
        }
    }, []);

    // Initialize map
    useEffect(() => {
        // Dynamically import Leaflet to avoid SSR issues
        const initMap = async () => {
            if (typeof window === 'undefined') return;
            
            const L = (await import('leaflet')).default;
            
            // Fix Leaflet default icon issue
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            if (mapContainerRef.current && !mapRef.current) {
                // Default center (Philippines)
                const defaultCenter: [number, number] = [14.5995, 120.9842];
                
                mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, 12);

                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                }).addTo(mapRef.current);

                // Initial markers
                updateMarkers(initialIncidents);

                // Focus on specific incident if provided
                if (focusedIncidentId) {
                    const focused = initialIncidents.find(i => i.id === focusedIncidentId);
                    if (focused) {
                        mapRef.current.setView([focused.latitude, focused.longitude], 16);
                        setSelectedIncident(focused);
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

            // Add popup
            const popupContent = `
                <div style="min-width: 200px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
                        ${typeIcons[incident.type]} ${incident.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
                        #${incident.id.toString().padStart(4, '0')}
                    </div>
                    <div style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${statusColors[incident.status]}20; color: ${statusColors[incident.status]};">
                        ${incident.status.toUpperCase()}
                    </div>
                    ${incident.has_active_call ? '<span style="margin-left: 4px; color: #ef4444; font-size: 11px;">📞 Active Call</span>' : ''}
                    <div style="margin-top: 8px; font-size: 12px;">
                        <strong>Reporter:</strong> ${incident.user?.name || 'Unknown'}<br/>
                        <strong>Phone:</strong> ${incident.user?.phone_number || 'N/A'}<br/>
                        <strong>Location:</strong> ${incident.address || 'No address'}
                    </div>
                    ${incident.description ? `<div style="margin-top: 8px; font-size: 12px; color: #666;">${incident.description}</div>` : ''}
                    <div style="margin-top: 12px;">
                        <a href="/admin/incidents/${incident.id}/overview" style="display: block; text-align: center; padding: 8px 12px; background: #f1f5f9; color: #334155; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 500;">
                            View in Dashboard
                        </a>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent);
            marker.on('click', () => setSelectedIncident(incident));

            markersRef.current.push(marker);
        });
    };

    // Update responder markers and routes
    const updateResponderMarkersAndRoutes = async (dispatches: Dispatch[], responders: Responder[]) => {
        if (!mapRef.current) return;

        const L = (await import('leaflet')).default;

        // Clear existing responder markers and routes
        responderMarkersRef.current.forEach(marker => marker.remove());
        responderMarkersRef.current = [];
        routeLinesRef.current.forEach(line => line.remove());
        routeLinesRef.current = [];

        // Add responder markers and routes for active dispatches
        dispatches.forEach(dispatch => {
            if (!dispatch.responder || !dispatch.incident) return;

            const responder = dispatch.responder;
            const incident = dispatch.incident;

            // Get responder location (current or base)
            const responderLat = responder.current_latitude ?? responder.base_latitude;
            const responderLon = responder.current_longitude ?? responder.base_longitude;

            if (!responderLat || !responderLon) return;

            // Create responder marker
            const iconHtml = `
                <div style="
                    background: linear-gradient(135deg, ${responderStatusColors[responder.responder_status] || '#6b7280'} 0%, ${responderStatusColors[responder.responder_status] || '#6b7280'} 100%);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 4px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px ${responderStatusColors[responder.responder_status]}40;
                    font-size: 18px;
                    ${dispatch.status === 'en_route' ? 'animation: pulse 2s infinite;' : ''}
                ">
                    🚑
                </div>
                ${dispatch.status === 'en_route' ? '<div style="position:absolute;top:-6px;right:-6px;width:14px;height:14px;background:#3b82f6;border-radius:50%;border:2px solid white;animation:pulse 1.5s infinite;"></div>' : ''}
            `;

            const icon = L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
            });

            const marker = L.marker([responderLat, responderLon], { icon })
                .addTo(mapRef.current);

            // Add popup with dispatch details
            const popupContent = `
                <div style="min-width: 220px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">
                        🚑 ${responder.name}
                    </div>
                    <div style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${dispatchStatusColors[dispatch.status]}30; color: ${dispatchStatusColors[dispatch.status]}; margin-bottom: 8px;">
                        ${dispatch.status.toUpperCase().replace('_', ' ')}
                    </div>
                    <div style="margin-top: 8px; font-size: 12px;">
                        <strong>Going to:</strong> ${incident.address || 'Incident #' + incident.id}<br/>
                        <strong>Type:</strong> ${typeIcons[incident.type]} ${incident.type.replace('_', ' ')}<br/>
                        <strong>Distance:</strong> ${dispatch.distance_text}<br/>
                        <strong>ETA:</strong> ${dispatch.duration_text}<br/>
                        <strong>Phone:</strong> ${responder.phone_number}
                    </div>
                    ${responder.location_updated_at ? `<div style="margin-top: 8px; font-size: 11px; color: #666;">
                        Location updated: ${new Date(responder.location_updated_at).toLocaleTimeString()}
                    </div>` : ''}
                </div>
            `;

            marker.bindPopup(popupContent);
            marker.on('click', () => {
                setSelectedDispatch(dispatch);
                setMonitoredDispatch(dispatch);
            });

            responderMarkersRef.current.push(marker);

            // Draw route line from responder to incident
            const routeLine = L.polyline([
                [responderLat, responderLon],
                [incident.latitude, incident.longitude]
            ], {
                color: dispatchStatusColors[dispatch.status] || '#3b82f6',
                weight: 3,
                opacity: 0.6,
                dashArray: dispatch.status === 'en_route' ? '10, 10' : '5, 5',
            }).addTo(mapRef.current);

            routeLinesRef.current.push(routeLine);
        });

        // Add markers for idle responders (not in active dispatch)
        const dispatchedResponderIds = new Set(dispatches.map(d => d.responder_id));
        const idleResponders = responders.filter(r => !dispatchedResponderIds.has(r.id));

        idleResponders.forEach(responder => {
            const responderLat = responder.current_latitude ?? responder.base_latitude;
            const responderLon = responder.current_longitude ?? responder.base_longitude;

            if (!responderLat || !responderLon) return;

            // Create idle responder marker (smaller, green)
            const iconHtml = `
                <div style="
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    font-size: 16px;
                ">
                    🚑
                </div>
            `;

            const icon = L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });

            const marker = L.marker([responderLat, responderLon], { icon })
                .addTo(mapRef.current);

            const popupContent = `
                <div style="min-width: 200px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">
                        🚑 ${responder.name}
                    </div>
                    <div style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #10b98130; color: #10b981; margin-bottom: 8px;">
                        IDLE - AVAILABLE
                    </div>
                    <div style="margin-top: 8px; font-size: 12px;">
                        <strong>Phone:</strong> ${responder.phone_number}<br/>
                        <strong>Email:</strong> ${responder.email}
                    </div>
                    ${responder.location_updated_at ? `<div style="margin-top: 8px; font-size: 11px; color: #666;">
                        Location updated: ${new Date(responder.location_updated_at).toLocaleTimeString()}
                    </div>` : ''}
                </div>
            `;

            marker.bindPopup(popupContent);
            responderMarkersRef.current.push(marker);
        });
    };

    // Set up polling
    useEffect(() => {
        console.log('[LIVEMAP] 🚀 Starting real-time map updates');
        const interval = setInterval(fetchMapData, POLL_INTERVAL);

        return () => {
            console.log('[LIVEMAP] 🛑 Stopping real-time updates');
            clearInterval(interval);
        };
    }, [fetchMapData]);

    // Draw GPS breadcrumb trail for monitored dispatch
    useEffect(() => {
        const drawBreadcrumbTrail = async () => {
            if (!mapRef.current || !monitoredDispatch) {
                // Clear existing breadcrumb trail
                if (breadcrumbPolylineRef.current && mapRef.current) {
                    mapRef.current.removeLayer(breadcrumbPolylineRef.current);
                    breadcrumbPolylineRef.current = null;
                }
                return;
            }

            const L = (await import('leaflet')).default;

            // Fetch route history
            try {
                const response = await axios.get(`/admin/dispatches/${monitoredDispatch.id}/route-history`);
                const points = response.data.route_points;

                if (points.length > 0) {
                    // Clear existing trail
                    if (breadcrumbPolylineRef.current) {
                        mapRef.current.removeLayer(breadcrumbPolylineRef.current);
                    }

                    // Draw breadcrumb trail
                    const coordinates = points.map((p: any) => [p.latitude, p.longitude]);
                    const breadcrumbLine = L.polyline(coordinates, {
                        color: '#10b981', // Green color
                        weight: 3,
                        opacity: 0.6,
                        dashArray: '5, 10',
                    }).addTo(mapRef.current);

                    breadcrumbPolylineRef.current = breadcrumbLine;

                    console.log('[LIVEMAP] Breadcrumb trail drawn', {
                        dispatch_id: monitoredDispatch.id,
                        point_count: points.length,
                    });
                }
            } catch (err) {
                console.error('[LIVEMAP] Failed to fetch breadcrumb trail:', err);
            }
        };

        drawBreadcrumbTrail();

        // Poll for updates every 5 seconds while monitoring
        const interval = monitoredDispatch ? setInterval(drawBreadcrumbTrail, 5000) : null;

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [monitoredDispatch]);

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
                                            {typeIcons[type]} {type.replace('_', ' ')}
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

                        {/* Legend */}
                        <div className="rounded-xl bg-white p-3 shadow-lg">
                            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Legend</div>
                            <div className="space-y-1 text-xs">
                                <div className="font-medium text-slate-700 mt-1 mb-1">Incidents:</div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusColors.pending }} />
                                    <span>Pending</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusColors.dispatched }} />
                                    <span>Dispatched</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusColors.completed }} />
                                    <span>Completed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-red-500" />
                                    <span>Active Call</span>
                                </div>
                                <div className="font-medium text-slate-700 mt-2 mb-1">Responders:</div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: responderStatusColors.idle }} />
                                    <span>🚑 Idle</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: responderStatusColors.en_route }} />
                                    <span>🚑 En Route</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: responderStatusColors.arrived }} />
                                    <span>🚑 Arrived</span>
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
                                <p className="text-2xl font-bold text-green-600">{activeResponders.length}</p>
                                <p className="text-xs text-slate-500">On Duty</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-600">{activeDispatches.filter(d => d.status === 'en_route').length}</p>
                                <p className="text-xs text-slate-500">En Route</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-indigo-600">{activeDispatches.filter(d => d.status === 'arrived').length}</p>
                                <p className="text-xs text-slate-500">Arrived</p>
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
                                        onClick={() => call.incident && handleFocusIncident(call.incident as any)}
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
                            {filteredIncidents.slice(0, 10).map(incident => (
                                <div
                                    key={incident.id}
                                    onClick={() => handleFocusIncident(incident)}
                                    className={`cursor-pointer rounded-lg border p-2 transition hover:border-red-200 hover:bg-red-50 ${
                                        selectedIncident?.id === incident.id ? 'border-red-300 bg-red-50' : 'border-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span>{typeIcons[incident.type]}</span>
                                            <span className="text-sm font-medium">#{incident.id}</span>
                                        </div>
                                        <span 
                                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                                            style={{ 
                                                backgroundColor: `${statusColors[incident.status]}20`,
                                                color: statusColors[incident.status]
                                            }}
                                        >
                                            {incident.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate text-xs text-slate-500">{incident.address || 'No address'}</p>
                                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                                        <span>{incident.user?.name}</span>
                                        <span>{formatTime(incident.created_at)}</span>
                                    </div>
                                    {incident.has_active_call && (
                                        <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                                            Active call
                                        </div>
                                    )}
                                </div>
                            ))}
                            {filteredIncidents.length === 0 && (
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
                                        <span className="text-2xl">{typeIcons[selectedIncident.type]}</span>
                                        <div>
                                            <h3 className="font-bold text-slate-800">
                                                {selectedIncident.type.replace('_', ' ').toUpperCase()}
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
                                            backgroundColor: `${statusColors[selectedIncident.status]}20`,
                                            color: statusColors[selectedIncident.status]
                                        }}
                                    >
                                        {selectedIncident.status.toUpperCase()}
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
                                    <p className="text-xs text-slate-500">{selectedIncident.user?.phone_number || selectedIncident.user?.email}</p>
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
                                    View in Dashboard
                                </a>
                            </div>
                        </div>
                    )}
                </main>

                {/* Responder Live Monitoring Panel */}
                {monitoredDispatch && (
                    <ResponderMonitoring
                        dispatch={monitoredDispatch}
                        onClose={() => setMonitoredDispatch(null)}
                    />
                )}
            </div>
        </div>
    );
}

