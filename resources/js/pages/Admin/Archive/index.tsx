import React, { useState } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive as ArchiveIcon, Search, FileText, Calendar, Filter, Download } from 'lucide-react';

interface User {
    name: string;
    email: string;
}

interface ArchiveProps {
    user: User;
}

interface ArchiveItem {
    id: number;
    title: string;
    type: 'incident' | 'report' | 'record';
    date: string;
    description: string;
    status: 'archived' | 'closed' | 'resolved';
}

export default function Archive({ user }: ArchiveProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'incident' | 'report' | 'record'>('all');

    // Mock archive data
    const archiveItems: ArchiveItem[] = [
        {
            id: 1,
            title: 'Cardiac Arrest - Quezon Memorial Circle',
            type: 'incident',
            date: '2023-06-15',
            description: 'Emergency response to cardiac arrest incident',
            status: 'resolved',
        },
        {
            id: 2,
            title: 'Monthly Incident Report - May 2023',
            type: 'report',
            date: '2023-05-31',
            description: 'Comprehensive monthly report of all incidents',
            status: 'archived',
        },
        {
            id: 3,
            title: 'Vehicle Accident - SM North EDSA',
            type: 'incident',
            date: '2023-06-10',
            description: 'Multi-vehicle collision requiring multiple EMS units',
            status: 'closed',
        },
        {
            id: 4,
            title: 'Patient Record - John Doe',
            type: 'record',
            date: '2023-06-08',
            description: 'Complete patient medical record and treatment history',
            status: 'archived',
        },
        {
            id: 5,
            title: 'Fire Emergency - Project 6',
            type: 'incident',
            date: '2023-05-28',
            description: 'Structure fire response and evacuation',
            status: 'resolved',
        },
        {
            id: 6,
            title: 'Quarterly Performance Report Q1 2023',
            type: 'report',
            date: '2023-03-31',
            description: 'First quarter performance metrics and statistics',
            status: 'archived',
        },
    ];

    const filteredItems = archiveItems.filter((item) => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'incident':
                return <Badge className="bg-red-100 text-red-700 border-red-200">Incident</Badge>;
            case 'report':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Report</Badge>;
            case 'record':
                return <Badge className="bg-green-100 text-green-700 border-green-200">Record</Badge>;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'resolved':
                return <Badge className="bg-green-100 text-green-700 border-green-200">Resolved</Badge>;
            case 'closed':
                return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Closed</Badge>;
            case 'archived':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Archived</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl space-y-6">
                        {/* Header */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Archive</h1>
                            <p className="text-sm text-gray-500">View and manage archived records, incidents, and reports</p>
                        </div>

                        {/* Search and Filter */}
                        <Card className="shadow-md">
                            <CardContent className="p-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            placeholder="Search archive..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 h-11"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Filter className="h-5 w-5 text-gray-400" />
                                        <div className="flex gap-2">
                                            {(['all', 'incident', 'report', 'record'] as const).map((type) => (
                                                <Button
                                                    key={type}
                                                    variant={filterType === type ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setFilterType(type)}
                                                    className={
                                                        filterType === type
                                                            ? 'bg-[#7a1818] hover:bg-[#6a0808] text-white'
                                                            : ''
                                                    }
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Archive Items */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredItems.map((item) => (
                                <Card key={item.id} className="shadow-md transition-shadow hover:shadow-lg">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                                                    <FileText className="h-5 w-5 text-gray-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getTypeBadge(item.type)}
                                            {getStatusBadge(item.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <CardDescription className="line-clamp-2">{item.description}</CardDescription>

                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>{new Date(item.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}</span>
                                        </div>

                                        <div className="pt-2 border-t">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {filteredItems.length === 0 && (
                            <Card className="shadow-md">
                                <CardContent className="py-12 text-center">
                                    <ArchiveIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-4 text-lg font-medium text-gray-900">No archived items found</p>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Try adjusting your search or filter criteria
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}



