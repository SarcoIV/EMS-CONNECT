import React from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';

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
    // Filter hospitals by type
    const governmentHospitals = hospitals.filter(h => h.type === 'government');
    const privateHospitals = hospitals.filter(h => h.type === 'private');

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
        </div>
    );
}



