import React, { useState } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive as ArchiveIcon, Search, FileText, Calendar, Filter, Download, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

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

type SortField = 'title' | 'type' | 'date' | 'status';
type SortDirection = 'asc' | 'desc';

export default function Archive({ user }: ArchiveProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'incident' | 'report' | 'record'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'archived' | 'closed' | 'resolved'>('all');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

    // Handle sorting
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filter and sort items
    const filteredAndSortedItems = archiveItems
        .filter((item) => {
            // Wildcard search across all text fields
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                searchQuery === '' ||
                item.title.toLowerCase().includes(searchLower) ||
                item.description.toLowerCase().includes(searchLower) ||
                item.type.toLowerCase().includes(searchLower) ||
                item.status.toLowerCase().includes(searchLower) ||
                item.date.includes(searchQuery) ||
                item.id.toString().includes(searchQuery);

            const matchesType = filterType === 'all' || item.type === filterType;
            const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

            return matchesSearch && matchesType && matchesStatus;
        })
        .sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case 'date':
                    aValue = new Date(a.date).getTime();
                    bValue = new Date(b.date).getTime();
                    break;
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'type':
                    aValue = a.type;
                    bValue = b.type;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-1 h-4 w-4 inline text-gray-400" />;
        }
        return sortDirection === 'asc' ? (
            <ChevronUp className="ml-1 h-4 w-4 inline text-red-600" />
        ) : (
            <ChevronDown className="ml-1 h-4 w-4 inline text-red-600" />
        );
    };

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
                                <div className="flex flex-col gap-4">
                                    {/* Search Bar */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            placeholder="Search by ID, title, description, type, status, or date..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 h-11"
                                        />
                                    </div>

                                    {/* Filters */}
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">Type:</span>
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

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">Status:</span>
                                            <div className="flex gap-2">
                                                {(['all', 'archived', 'closed', 'resolved'] as const).map((status) => (
                                                    <Button
                                                        key={status}
                                                        variant={filterStatus === status ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setFilterStatus(status)}
                                                        className={
                                                            filterStatus === status
                                                                ? 'bg-[#7a1818] hover:bg-[#6a0808] text-white'
                                                                : ''
                                                        }
                                                    >
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Results Count */}
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <span>
                                            Showing {filteredAndSortedItems.length} of {archiveItems.length} items
                                        </span>
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="text-red-600 hover:text-red-700 font-medium"
                                            >
                                                Clear search
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Archive Table */}
                        <Card className="shadow-md">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    <button
                                                        onClick={() => handleSort('title')}
                                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                                    >
                                                        ID / Title
                                                        <SortIcon field="title" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    <button
                                                        onClick={() => handleSort('type')}
                                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                                    >
                                                        Type
                                                        <SortIcon field="type" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    Description
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    <button
                                                        onClick={() => handleSort('date')}
                                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                                    >
                                                        Date
                                                        <SortIcon field="date" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    <button
                                                        onClick={() => handleSort('status')}
                                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                                    >
                                                        Status
                                                        <SortIcon field="status" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {filteredAndSortedItems.length > 0 ? (
                                                filteredAndSortedItems.map((item) => (
                                                    <tr key={item.id} className="transition-colors hover:bg-gray-50">
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="text-sm font-mono text-gray-500">#{item.id.toString().padStart(4, '0')}</p>
                                                                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getTypeBadge(item.type)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm text-gray-600 max-w-md truncate" title={item.description}>
                                                                {item.description}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>
                                                                    {new Date(item.date).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getStatusBadge(item.status)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="rounded p-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm"
                                                                    title="View details"
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    className="rounded p-2 text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                                                                    title="Download"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center">
                                                        <ArchiveIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                        <p className="mt-4 text-lg font-medium text-gray-900">No archived items found</p>
                                                        <p className="mt-2 text-sm text-gray-500">
                                                            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                                                                ? 'Try adjusting your search or filter criteria'
                                                                : 'No archived items available'}
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}



