import React from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Package, CheckCircle2, Edit, Send, MessageSquare, RefreshCw, Users } from 'lucide-react';

interface User {
    name: string;
    email: string;
}

interface Driver {
    id: number;
    driver_id: string;
    name: string;
    phone: string | null;
    email: string | null;
}

interface PeopleProps {
    user: User;
    drivers: Driver[];
}

export default function People({ user, drivers }: PeopleProps) {
    const handleAction = (action: string, driverId: number) => {
        console.log(`Action: ${action} for driver ID: ${driverId}`);
        // TODO: Implement action handlers
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Pass user data to the Sidebar component */}
            <Sidebar user={user} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                {/* People Content */}
                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
                    <div className="mx-auto flex max-w-7xl flex-col gap-8">
                        {/* Header Section */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dispatch Drivers</h1>
                            <p className="text-sm text-gray-500">Manage and assign drivers to dispatch operations</p>
                        </div>

                        {/* Drivers List */}
                        <div className="flex flex-col gap-5">
                            {drivers.length === 0 ? (
                                <Card className="border-2 border-dashed">
                                    <CardContent className="p-12 text-center">
                                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                            <Users className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <h3 className="mb-2 text-lg font-semibold text-gray-900">No drivers found</h3>
                                        <p className="text-sm text-gray-500">Add drivers to get started with dispatch operations.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                drivers.map((driver) => (
                                    <Card
                                        key={driver.id}
                                        className="group overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50"
                                    >
                                        <CardContent className="p-6 lg:p-8">
                                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                                {/* Driver Information - Left Side */}
                                                <div className="flex flex-1 flex-col gap-4">
                                                    {/* Driver ID */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7a1818]/10">
                                                            <span className="text-sm font-bold text-[#7a1818]">
                                                                {driver.driver_id.substring(0, 3)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-bold tracking-wide text-gray-900">
                                                                {driver.driver_id}
                                                            </div>
                                                            <Badge variant="secondary" className="mt-1 bg-red-50 text-red-700 hover:bg-red-100">
                                                                Assigneddriver
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Driver Name */}
                                                    <div className="pl-12">
                                                        <div className="text-base font-semibold text-gray-900">{driver.name}</div>
                                                    </div>

                                                    {/* Contact Information */}
                                                    <div className="flex flex-col gap-2.5 pl-12">
                                                        {driver.phone && (
                                                            <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                                <Phone className="h-4 w-4 text-gray-400" />
                                                                <span className="font-medium">{driver.phone}</span>
                                                            </div>
                                                        )}
                                                        {driver.email && (
                                                            <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                                <Mail className="h-4 w-4 text-gray-400" />
                                                                <span className="font-medium">{driver.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons - Right Side */}
                                                <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                                                    {/* Load Management Buttons */}
                                                    <div className="flex flex-wrap gap-2.5">
                                                        <button
                                                            onClick={() => handleAction('load', driver.id)}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-[#7a1818] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#6a0808] hover:shadow-md active:scale-[0.98]"
                                                        >
                                                            <Package className="h-4 w-4" />
                                                            Load
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction('confirm-load', driver.id)}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-[#7a1818] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#6a0808] hover:shadow-md active:scale-[0.98]"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Confirm Load
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction('update-load', driver.id)}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-[#7a1818] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#6a0808] hover:shadow-md active:scale-[0.98]"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                            Update Load
                                                        </button>
                                                    </div>

                                                    {/* Communication Buttons */}
                                                    <div className="flex flex-wrap gap-2.5">
                                                        <button
                                                            onClick={() => handleAction('email', driver.id)}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-[#7a1818] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#6a0808] hover:shadow-md active:scale-[0.98]"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                            Email
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction('message', driver.id)}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-[#7a1818] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#6a0808] hover:shadow-md active:scale-[0.98]"
                                                        >
                                                            <MessageSquare className="h-4 w-4" />
                                                            Message
                                                        </button>
                                                    </div>

                                                    {/* Management Buttons */}
                                                    <div className="flex flex-wrap gap-2.5">
                                                        <button
                                                            onClick={() => handleAction('edit', driver.id)}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-[#7a1818] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#6a0808] hover:shadow-md active:scale-[0.98]"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction('update', driver.id)}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-[#7a1818] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#6a0808] hover:shadow-md active:scale-[0.98]"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                            Update
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

