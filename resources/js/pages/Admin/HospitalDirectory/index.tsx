import React, { useState } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface User {
    name: string;
    email: string;
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

interface HospitalDirectoryProps {
    user: User;
    hospitals: Hospital[];
}

export default function HospitalDirectory({ user, hospitals }: HospitalDirectoryProps) {
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Filter hospitals by type
    const governmentHospitals = hospitals.filter(h => h.type === 'government');
    const privateHospitals = hospitals.filter(h => h.type === 'private');

    const handleHospitalClick = (hospital: Hospital) => {
        setSelectedHospital(hospital);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedHospital(null);
    };

    return (
        <div className="flex h-screen bg-white">
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
                    <div className="mx-auto max-w-7xl space-y-8">
                        {/* Government Hospital Section */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">Government Hospital</h2>
                            <div className="overflow-x-auto pb-4">
                                <div className="flex gap-4 min-w-max">
                                    {governmentHospitals.map((hospital) => (
                                        <div
                                            key={hospital.id}
                                            onClick={() => handleHospitalClick(hospital)}
                                            className="flex-shrink-0 w-64 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
                                                {hospital.image_url ? (
                                                    <img
                                                        src={hospital.image_url}
                                                        alt={hospital.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-gray-400 text-4xl">🏥</div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 text-sm leading-tight">
                                                    {hospital.name}
                                                </h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-300"></div>

                        {/* Private Hospital Section */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">Quezon City Private Hospital</h2>
                            <div className="overflow-x-auto pb-4">
                                <div className="flex gap-4 min-w-max">
                                    {privateHospitals.map((hospital) => (
                                        <div
                                            key={hospital.id}
                                            onClick={() => handleHospitalClick(hospital)}
                                            className="flex-shrink-0 w-64 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
                                                {hospital.image_url ? (
                                                    <img
                                                        src={hospital.image_url}
                                                        alt={hospital.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-gray-400 text-4xl">🏥</div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 text-sm leading-tight">
                                                    {hospital.name}
                                                </h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Hospital Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            🏥 {selectedHospital?.name}
                        </DialogTitle>
                        <DialogDescription>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                selectedHospital?.type === 'government'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                            }`}>
                                {selectedHospital?.type === 'government' ? 'Government Hospital' : 'Private Hospital'}
                            </span>
                            {selectedHospital?.has_emergency_room && (
                                <span className="ml-2 inline-block px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                                    🚨 Emergency Room Available
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedHospital && (
                        <div className="space-y-4 mt-4">
                            {/* Hospital Image */}
                            {selectedHospital.image_url ? (
                                <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-200">
                                    <img
                                        src={selectedHospital.image_url}
                                        alt={selectedHospital.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-64 rounded-lg bg-gray-200 flex items-center justify-center">
                                    <div className="text-gray-400 text-6xl">🏥</div>
                                </div>
                            )}

                            {/* Description */}
                            {selectedHospital.description && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                                    <p className="text-gray-600 text-sm">{selectedHospital.description}</p>
                                </div>
                            )}

                            {/* Contact Information */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                        <span className="font-medium text-gray-700 min-w-[100px]">Address:</span>
                                        <span className="text-gray-600">{selectedHospital.address}</span>
                                    </div>
                                    {selectedHospital.phone_number && (
                                        <div className="flex items-start gap-2">
                                            <span className="font-medium text-gray-700 min-w-[100px]">Phone:</span>
                                            <a href={`tel:${selectedHospital.phone_number}`} className="text-blue-600 hover:underline">
                                                {selectedHospital.phone_number}
                                            </a>
                                        </div>
                                    )}
                                    {selectedHospital.website && (
                                        <div className="flex items-start gap-2">
                                            <span className="font-medium text-gray-700 min-w-[100px]">Website:</span>
                                            <a
                                                href={selectedHospital.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                {selectedHospital.website}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Specialties */}
                            {selectedHospital.specialties && selectedHospital.specialties.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Specialties</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedHospital.specialties.map((specialty, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                            >
                                                {specialty}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Facilities */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Facilities</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={selectedHospital.has_emergency_room ? 'text-green-600' : 'text-gray-400'}>
                                            {selectedHospital.has_emergency_room ? '✓' : '✗'}
                                        </span>
                                        <span className="text-gray-700">Emergency Room</span>
                                    </div>
                                    {selectedHospital.bed_capacity && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-700">Bed Capacity:</span>
                                            <span className="font-semibold text-gray-900">{selectedHospital.bed_capacity}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Map Link */}
                            <div>
                                <a
                                    href={`/admin/live-map?hospital=${selectedHospital.id}`}
                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    View on Map
                                </a>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}



