import React, { useState } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, ChevronUp, Activity } from 'lucide-react';

interface User {
    name: string;
    email: string;
}

interface AdministrationProps {
    user: User;
}

interface EMSActivity {
    date: string;
    location: string;
    incidentId: string;
    role: string;
    activity: string;
    hours: string;
    status: string;
}

export default function Administration({ user }: AdministrationProps) {
    const [isMonitoringOpen, setIsMonitoringOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data for EMS activities
    const emsActivities: EMSActivity[] = [
        {
            date: '2023-06-15',
            location: '62-68 Rd 1, Quezon City, Metro Manila',
            incidentId: 'INC123456',
            role: 'EMT',
            activity: 'Responded to chest pain',
            hours: '2.5',
            status: 'Completed',
        },
        {
            date: '2023-06-16',
            location: '3 Alley 13 Project 6',
            incidentId: 'INC123457',
            role: 'Paramedic',
            activity: 'Administered CPR and transported',
            hours: '3.0',
            status: 'Completed',
        },
        {
            date: '2023-06-17',
            location: 'SM City North EDSA, Quezon City',
            incidentId: 'INC123458',
            role: 'EMT',
            activity: 'First aid for minor injury',
            hours: '1.5',
            status: 'In Progress',
        },
        {
            date: '2023-06-18',
            location: 'Quezon Memorial Circle',
            incidentId: 'INC123459',
            role: 'Paramedic',
            activity: 'Emergency response to accident scene',
            hours: '4.0',
            status: 'Completed',
        },
    ];

    const getStatusBadge = (status: string) => {
        if (status === 'Completed') {
            return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
        }
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">In Progress</Badge>;
    };

    // Filter EMS activities based on search term
    const filteredActivities = emsActivities.filter(activity => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            activity.date.toLowerCase().includes(search) ||
            activity.location.toLowerCase().includes(search) ||
            activity.incidentId.toLowerCase().includes(search) ||
            activity.role.toLowerCase().includes(search) ||
            activity.activity.toLowerCase().includes(search) ||
            activity.status.toLowerCase().includes(search)
        );
    });

    return (
        <div className="flex h-screen bg-white">
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto bg-white">
                    <div className="p-6 md:p-8">
                        <div className="mx-auto max-w-7xl space-y-6">
                            {/* Admin Controls Section */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-gray-900">Admin Controls</h2>
                                    <Badge variant="destructive" className="bg-red-600 text-white">
                                        High
                                    </Badge>
                                </div>
                            </div>

                            {/* Admin Control Cards */}
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Total Availability Card */}
                                <Card className="shadow-md transition-shadow hover:shadow-lg">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-600">Total Availability</p>
                                                <p className="mt-2 text-4xl font-bold text-gray-900">21.90</p>
                                                <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="font-medium">See details</span>
                                                </div>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                                                <Activity className="h-6 w-6 text-green-600" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Live Status of Units Card */}
                                <Card className="shadow-md transition-shadow hover:shadow-lg">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-600">Live status of units</p>
                                                <p className="mt-2 text-4xl font-bold text-gray-900">
                                                    <span className="text-green-600">1</span>
                                                    <span className="text-gray-400">/</span>
                                                    <span className="text-gray-700">1,171,347</span>
                                                </p>
                                                <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="font-medium">Details pending</span>
                                                </div>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                                <Activity className="h-6 w-6 text-blue-600" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Total Active/Emergency Units Card */}
                                <Card className="shadow-md transition-shadow hover:shadow-lg">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-600">Total Active Units</p>
                                                <p className="mt-2 text-4xl font-bold text-gray-900">41.30</p>
                                                <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="font-medium">Real-time details</span>
                                                </div>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                                                <Activity className="h-6 w-6 text-purple-600" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* EMS Monitoring Section */}
                            <div className="mt-8">
                                <Collapsible open={isMonitoringOpen} onOpenChange={setIsMonitoringOpen}>
                                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                                        <h2 className="text-xl font-bold text-gray-900">EMS Monitoring</h2>
                                        <ChevronUp
                                            className={`h-5 w-5 text-gray-600 transition-transform ${
                                                isMonitoringOpen ? '' : 'rotate-180'
                                            }`}
                                        />
                                    </CollapsibleTrigger>

                                    <CollapsibleContent className="mt-4">
                                        {/* Search Input */}
                                        <div className="mb-4">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search by date, location, incident ID, role, activity, or status..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full rounded-lg border border-gray-200 px-4 py-2 pl-10 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                                />
                                                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>

                                        <Card className="shadow-md">
                                            <CardContent className="p-0">
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                                    Date
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                                    Location
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                                    Incident ID
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                                    Role
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                                    Activity
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                                    Hours
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                                    Status
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 bg-white">
                                                            {filteredActivities.length > 0 ? (
                                                                filteredActivities.map((activity, index) => (
                                                                <tr
                                                                    key={index}
                                                                    className="transition-colors hover:bg-gray-50"
                                                                >
                                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                                        {activity.date}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                                        <div className="max-w-xs truncate" title={activity.location}>
                                                                            {activity.location}
                                                                        </div>
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                                        {activity.incidentId}
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                                                                            {activity.role}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                                        {activity.activity}
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                                        {activity.hours} hrs
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                                        {getStatusBadge(activity.status)}
                                                                    </td>
                                                                </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                                        {searchTerm ? 'No activities match your search' : 'No EMS activities found'}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}



