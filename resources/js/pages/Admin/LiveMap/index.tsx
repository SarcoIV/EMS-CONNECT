import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, Ambulance, Clock, MapPin, Navigation, Phone, User } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface User {
    name: string;
    email: string;
}

interface LiveMapProps {
    user: User;
}

type IncidentStatus = 'new' | 'dispatched' | 'active' | 'resolved';

interface Incident {
    id: string;
    type: string;
    status: IncidentStatus;
    location: [number, number]; // [lat, lng]
    address: string;
    reportedAt: string;
    reporterName: string;
    reporterPhone?: string;
    description?: string;
    assignedAmbulanceId?: string;
    eta?: number; // in minutes
}

interface Ambulance {
    id: string;
    unitId: string; // e.g., "AMB-001"
    driverName: string;
    currentLocation: [number, number];
    isAvailable: boolean;
    assignedIncidentId?: string;
    heading?: number; // direction in degrees
}

// Custom icons for incidents based on status
const createIncidentIcon = (status: IncidentStatus) => {
    const colors = {
        new: '#ef4444', // red
        dispatched: '#f59e0b', // amber
        active: '#3b82f6', // blue
        resolved: '#10b981', // green
    };

    return L.divIcon({
        className: 'custom-incident-marker',
        html: `
            <div style="
                background-color: ${colors[status]};
                width: 24px;
                height: 24px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
                <div style="
                    transform: rotate(45deg);
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                ">!</div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
    });
};

// Custom icon for ambulances
const createAmbulanceIcon = (isAvailable: boolean) => {
    const color = isAvailable ? '#10b981' : '#3b82f6';
    return L.divIcon({
        className: 'custom-ambulance-marker',
        html: `
            <div style="
                background-color: ${color};
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <svg style="width: 18px; height: 18px; fill: white;" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                </svg>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};

// Component to auto-update map bounds
function MapUpdater({ incidents, ambulances }: { incidents: Incident[]; ambulances: Ambulance[] }) {
    const map = useMap();

    useEffect(() => {
        const allPoints: L.LatLngTuple[] = [
            ...incidents.map((i) => i.location),
            ...ambulances.map((a) => a.currentLocation),
        ];

        if (allPoints.length > 0) {
            const bounds = L.latLngBounds(allPoints);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, incidents, ambulances]);

    return null;
}

export default function LiveMap({ user }: LiveMapProps) {
    // Mock data - Quezon City area coordinates (based on image description)
    const [incidents, setIncidents] = useState<Incident[]>([
        {
            id: '1',
            type: 'Medical Emergency',
            status: 'new',
            location: [14.660477, 121.040566],
            address: 'Quezon Memorial Circle, Quezon City',
            reportedAt: new Date(Date.now() - 5 * 60000).toISOString(),
            reporterName: 'John Doe',
            reporterPhone: '+63 912 345 6789',
            description: 'Cardiac arrest, immediate response needed',
        },
        {
            id: '2',
            type: 'Accident',
            status: 'dispatched',
            location: [14.6488, 121.0509],
            address: 'SM City North EDSA, Quezon City',
            reportedAt: new Date(Date.now() - 15 * 60000).toISOString(),
            reporterName: 'Jane Smith',
            reporterPhone: '+63 912 345 6780',
            description: 'Vehicle collision, multiple injuries',
            assignedAmbulanceId: 'amb1',
            eta: 8,
        },
        {
            id: '3',
            type: 'Fire / Hazard',
            status: 'active',
            location: [14.6756, 121.0284],
            address: 'U.P. Campus, Diliman, Quezon City',
            reportedAt: new Date(Date.now() - 30 * 60000).toISOString(),
            reporterName: 'Mike Johnson',
            reporterPhone: '+63 912 345 6781',
            description: 'Structure fire, en route',
            assignedAmbulanceId: 'amb2',
            eta: 3,
        },
        {
            id: '4',
            type: 'Medical Emergency',
            status: 'resolved',
            location: [14.6315, 121.0169],
            address: 'Veterans Memorial Medical Center',
            reportedAt: new Date(Date.now() - 120 * 60000).toISOString(),
            reporterName: 'Sarah Lee',
            reporterPhone: '+63 912 345 6782',
            description: 'Respiratory distress - resolved',
            assignedAmbulanceId: 'amb3',
        },
    ]);

    const [ambulances, setAmbulances] = useState<Ambulance[]>([
        {
            id: 'amb1',
            unitId: 'AMB-001',
            driverName: 'Robert Garcia',
            currentLocation: [14.6510, 121.0450],
            isAvailable: false,
            assignedIncidentId: '2',
            heading: 45,
        },
        {
            id: 'amb2',
            unitId: 'AMB-002',
            driverName: 'Maria Santos',
            currentLocation: [14.6720, 121.0320],
            isAvailable: false,
            assignedIncidentId: '3',
            heading: 270,
        },
        {
            id: 'amb3',
            unitId: 'AMB-003',
            driverName: 'Carlos Reyes',
            currentLocation: [14.6400, 121.0200],
            isAvailable: true,
        },
        {
            id: 'amb4',
            unitId: 'AMB-004',
            driverName: 'Ana Cruz',
            currentLocation: [14.6650, 121.0350],
            isAvailable: true,
        },
    ]);

    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Simulate real-time updates (ambulance movement)
    useEffect(() => {
        const interval = setInterval(() => {
            setAmbulances((prev) =>
                prev.map((amb) => {
                    if (!amb.isAvailable && amb.assignedIncidentId) {
                        const incident = incidents.find((i) => i.id === amb.assignedIncidentId);
                        if (incident) {
                            // Simulate movement towards incident (simple linear interpolation)
                            const [incLat, incLng] = incident.location;
                            const [ambLat, ambLng] = amb.currentLocation;

                            const distance = Math.sqrt(Math.pow(incLat - ambLat, 2) + Math.pow(incLng - ambLng, 2));
                            if (distance > 0.001) {
                                // Move 10% closer each update
                                const newLat = ambLat + (incLat - ambLat) * 0.1;
                                const newLng = ambLng + (incLng - ambLng) * 0.1;

                                // Calculate heading
                                const heading = (Math.atan2(incLng - ambLng, incLat - ambLat) * 180) / Math.PI;

                                return {
                                    ...amb,
                                    currentLocation: [newLat, newLng],
                                    heading,
                                };
                            }
                        }
                    }
                    return amb;
                })
            );

            // Update ETAs
            setIncidents((prev) =>
                prev.map((inc) => {
                    if (inc.assignedAmbulanceId && inc.status !== 'resolved') {
                        const amb = ambulances.find((a) => a.id === inc.assignedAmbulanceId);
                        if (amb) {
                            const [incLat, incLng] = inc.location;
                            const [ambLat, ambLng] = amb.currentLocation;
                            // Simple distance-based ETA (rough estimate)
                            const distance = Math.sqrt(Math.pow(incLat - ambLat, 2) + Math.pow(incLng - ambLng, 2));
                            const etaMinutes = Math.max(1, Math.round(distance * 100));
                            return { ...inc, eta: etaMinutes };
                        }
                    }
                    return inc;
                })
            );
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, [incidents, ambulances]);

    const handleIncidentClick = (incident: Incident) => {
        setSelectedIncident(incident);
        setIsDialogOpen(true);
    };

    const getStatusBadgeColor = (status: IncidentStatus) => {
        switch (status) {
            case 'new':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'dispatched':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'active':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'resolved':
                return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    const getStatusLabel = (status: IncidentStatus) => {
        switch (status) {
            case 'new':
                return 'New';
            case 'dispatched':
                return 'Dispatched';
            case 'active':
                return 'En Route';
            case 'resolved':
                return 'Resolved';
        }
    };

    // Calculate route between ambulance and incident (simplified - straight line for frontend demo)
    const getRoutePoints = (incident: Incident): L.LatLngTuple[] | null => {
        if (!incident.assignedAmbulanceId || incident.status === 'resolved') return null;

        const ambulance = ambulances.find((a) => a.id === incident.assignedAmbulanceId);
        if (!ambulance) return null;

        return [ambulance.currentLocation, incident.location];
    };

    // Center on Quezon City
    const center: L.LatLngTuple = [14.6500, 121.0300];

    return (
        <div className="flex h-screen bg-[#f7f2f2]">
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex flex-1 flex-col overflow-hidden bg-[#f7f2f2]">
                    {/* Map Container */}
                    <div className="relative flex-1">
                        <MapContainer
                            center={center}
                            zoom={13}
                            style={{ height: '100%', width: '100%', zIndex: 1 }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <MapUpdater incidents={incidents} ambulances={ambulances} />

                            {/* Render routes */}
                            {incidents.map((incident) => {
                                const routePoints = getRoutePoints(incident);
                                if (!routePoints) return null;

                                return (
                                    <Polyline
                                        key={`route-${incident.id}`}
                                        positions={routePoints}
                                        color="#7a1818"
                                        weight={3}
                                        opacity={0.7}
                                        dashArray="10, 10"
                                    />
                                );
                            })}

                            {/* Render incident markers */}
                            {incidents.map((incident) => (
                                <Marker
                                    key={incident.id}
                                    position={incident.location}
                                    icon={createIncidentIcon(incident.status)}
                                    eventHandlers={{
                                        click: () => handleIncidentClick(incident),
                                    }}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <div className="font-semibold">{incident.type}</div>
                                            <div className="mt-1 text-xs text-gray-600">{incident.address}</div>
                                            <Badge className={`mt-2 ${getStatusBadgeColor(incident.status)}`}>
                                                {getStatusLabel(incident.status)}
                                            </Badge>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {/* Render ambulance markers */}
                            {ambulances.map((ambulance) => (
                                <Marker
                                    key={ambulance.id}
                                    position={ambulance.currentLocation}
                                    icon={createAmbulanceIcon(ambulance.isAvailable)}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <div className="font-semibold">{ambulance.unitId}</div>
                                            <div className="mt-1 text-xs text-gray-600">
                                                Driver: {ambulance.driverName}
                                            </div>
                                            <Badge className={`mt-2 ${ambulance.isAvailable ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {ambulance.isAvailable ? 'Available' : 'On Call'}
                                            </Badge>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>

                        {/* Legend/Info Panel */}
                        <div className="absolute bottom-4 left-4 z-[1000]">
                            <Card className="w-80 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg">Map Legend</CardTitle>
                                    <CardDescription>Real-time EMS monitoring</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow-sm" />
                                            <span>New Incident</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded-full border-2 border-white bg-amber-500 shadow-sm" />
                                            <span>Dispatched</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-sm" />
                                            <span>En Route</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                                            <span>Resolved</span>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t">
                                            <div className="h-5 w-5 rounded-full border-2 border-white bg-green-600 shadow-sm flex items-center justify-center">
                                                <Ambulance size={12} className="text-white" />
                                            </div>
                                            <span>Available Ambulance</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 rounded-full border-2 border-white bg-blue-600 shadow-sm flex items-center justify-center">
                                                <Ambulance size={12} className="text-white" />
                                            </div>
                                            <span>On Call Ambulance</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Incident Summary Panel */}
                        <div className="absolute top-4 right-4 z-[1000] max-h-[calc(100vh-8rem)] overflow-y-auto">
                            <Card className="w-80 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg">Active Incidents</CardTitle>
                                    <CardDescription>
                                        {incidents.filter((i) => i.status !== 'resolved').length} active
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {incidents
                                        .filter((i) => i.status !== 'resolved')
                                        .map((incident) => (
                                            <div
                                                key={incident.id}
                                                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => handleIncidentClick(incident)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-sm">{incident.type}</div>
                                                        <div className="text-xs text-gray-600 mt-1 line-clamp-1">
                                                            {incident.address}
                                                        </div>
                                                    </div>
                                                    <Badge className={`ml-2 ${getStatusBadgeColor(incident.status)}`}>
                                                        {getStatusLabel(incident.status)}
                                                    </Badge>
                                                </div>
                                                {incident.eta && (
                                                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                                        <Clock size={12} />
                                                        <span>ETA: {incident.eta} min</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>

            {/* Incident Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    {selectedIncident && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <AlertCircle className="text-red-500" size={20} />
                                    {selectedIncident.type}
                                </DialogTitle>
                                <DialogDescription>Incident Details</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <MapPin size={16} />
                                        Location
                                    </div>
                                    <p className="text-sm text-gray-600">{selectedIncident.address}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {selectedIncident.location[0]}, {selectedIncident.location[1]}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </div>
                                    <Badge className={getStatusBadgeColor(selectedIncident.status)}>
                                        {getStatusLabel(selectedIncident.status)}
                                    </Badge>
                                </div>

                                {selectedIncident.description && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
                                        <p className="text-sm text-gray-600">{selectedIncident.description}</p>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <User size={16} />
                                        Reporter
                                    </div>
                                    <p className="text-sm text-gray-600">{selectedIncident.reporterName}</p>
                                    {selectedIncident.reporterPhone && (
                                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                                            <Phone size={14} />
                                            <span>{selectedIncident.reporterPhone}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <Clock size={16} />
                                        Reported At
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {new Date(selectedIncident.reportedAt).toLocaleString()}
                                    </p>
                                </div>

                                {selectedIncident.assignedAmbulanceId && (
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                            <Ambulance size={16} />
                                            Assigned Unit
                                        </div>
                                        {(() => {
                                            const ambulance = ambulances.find(
                                                (a) => a.id === selectedIncident.assignedAmbulanceId
                                            );
                                            return (
                                                <div className="text-sm text-gray-600">
                                                    <p>{ambulance?.unitId || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Driver: {ambulance?.driverName || 'N/A'}
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {selectedIncident.eta && selectedIncident.status !== 'resolved' && (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                                            <Navigation size={16} />
                                            Estimated Arrival
                                        </div>
                                        <p className="text-lg font-bold text-blue-700 mt-1">
                                            {selectedIncident.eta} minute{selectedIncident.eta !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
