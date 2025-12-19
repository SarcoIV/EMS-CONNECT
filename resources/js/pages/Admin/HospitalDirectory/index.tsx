import React from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';

interface User {
    name: string;
    email: string;
}

interface HospitalDirectoryProps {
    user: User;
}

interface Hospital {
    id: number;
    name: string;
    imageUrl?: string;
}

export default function HospitalDirectory({ user }: HospitalDirectoryProps) {
    // Government Hospitals
    const governmentHospitals: Hospital[] = [
        { id: 1, name: 'Quezon City General Hospital' },
        { id: 2, name: 'East Avenue Medical Center' },
        { id: 3, name: 'Philippine Children\'s Medical Center' },
        { id: 4, name: 'Quirino Memorial Medical Center' },
        { id: 5, name: 'Lung Center of the Philippines' },
        { id: 6, name: 'Philippine Heart Center' },
        { id: 7, name: 'Veterans Memorial Medical Center' },
        { id: 8, name: 'Quezon Memorial Medical Center' },
    ];

    // Private Hospitals
    const privateHospitals: Hospital[] = [
        { id: 1, name: 'St. Luke\'s Medical Center' },
        { id: 2, name: 'Fe Del Mundo Medical Center' },
        { id: 3, name: 'World Citi Medical Center' },
        { id: 4, name: 'Commonwealth Hospital' },
        { id: 5, name: 'De Jesus Delgado Hospital' },
        { id: 6, name: 'Mary Chiles General Hospital' },
        { id: 7, name: 'Metro North Medical Center' },
    ];

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
                                                {hospital.imageUrl ? (
                                                    <img
                                                        src={hospital.imageUrl}
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
                                                {hospital.imageUrl ? (
                                                    <img
                                                        src={hospital.imageUrl}
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

