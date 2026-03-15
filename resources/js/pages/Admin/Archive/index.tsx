import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive as ArchiveIcon, Search, FileText, Calendar, ChevronUp, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
    name: string;
    email: string;
}

interface IncidentUser {
    id: number;
    name: string;
}

interface ArchiveIncident {
    id: number;
    type: string;
    status: string;
    address: string | null;
    description: string | null;
    created_at: string;
    completed_at: string | null;
    user: IncidentUser | null;
}

interface PaginatedData {
    data: ArchiveIncident[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Stats {
    total: number;
    completed: number;
    cancelled: number;
}

interface Filters {
    status: string;
    type: string;
    search: string | null;
}

interface ArchiveProps {
    user: User;
    incidents: PaginatedData;
    stats: Stats;
    filters: Filters;
}

type SortField = 'title' | 'type' | 'date' | 'status';
type SortDirection = 'asc' | 'desc';

export default function Archive({ user, incidents, stats, filters }: ArchiveProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const applyFilters = (overrides: Record<string, string | null> = {}) => {
        const params: Record<string, string> = {};
        const status = overrides.status !== undefined ? overrides.status : filters.status;
        const type = overrides.type !== undefined ? overrides.type : filters.type;
        const search = overrides.search !== undefined ? overrides.search : searchQuery;

        if (status && status !== 'all') params.status = status;
        if (type && type !== 'all') params.type = type;
        if (search) params.search = search;

        router.get('/admin/archive', params, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchQuery });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            applyFilters({ search: searchQuery });
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const goToPage = (page: number) => {
        const params: Record<string, string> = { page: page.toString() };
        if (filters.status !== 'all') params.status = filters.status;
        if (filters.type !== 'all') params.type = filters.type;
        if (filters.search) params.search = filters.search;
        router.get('/admin/archive', params, { preserveState: true, preserveScroll: true });
    };

    // Client-side sort the current page data
    const sortedItems = [...incidents.data].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
            case 'date':
                aValue = new Date(a.completed_at || a.created_at).getTime();
                bValue = new Date(b.completed_at || b.created_at).getTime();
                break;
            case 'title':
                aValue = (a.address || '').toLowerCase();
                bValue = (b.address || '').toLowerCase();
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
        const colors: Record<string, string> = {
            medical: 'bg-green-100 text-green-700 border-green-200',
            fire: 'bg-red-100 text-red-700 border-red-200',
            accident: 'bg-amber-100 text-amber-700 border-amber-200',
            crime: 'bg-purple-100 text-purple-700 border-purple-200',
            natural_disaster: 'bg-blue-100 text-blue-700 border-blue-200',
            other: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        const cls = colors[type] || colors.other;
        const label = type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
        return <Badge className={cls}>{label}</Badge>;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
            case 'cancelled':
                return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Cancelled</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{status}</Badge>;
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
                            <p className="text-sm text-gray-500">View completed and cancelled incidents</p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <Card className="shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    <p className="text-xs text-gray-500">Total Archived</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                                    <p className="text-xs text-gray-500">Completed</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
                                    <p className="text-xs text-gray-500">Cancelled</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Search and Filter */}
                        <Card className="shadow-md">
                            <CardContent className="p-4">
                                <div className="flex flex-col gap-4">
                                    {/* Search Bar */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            placeholder="Search by ID, address, description, or reporter..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={handleSearchKeyDown}
                                            className="pl-10 h-11"
                                        />
                                    </div>

                                    {/* Filters */}
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">Type:</span>
                                            <div className="flex gap-2">
                                                {(['all', 'medical', 'fire', 'accident', 'crime', 'natural_disaster', 'other'] as const).map((type) => (
                                                    <Button
                                                        key={type}
                                                        variant={filters.type === type ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => applyFilters({ type })}
                                                        className={
                                                            filters.type === type
                                                                ? 'bg-[#7a1818] hover:bg-[#6a0808] text-white'
                                                                : ''
                                                        }
                                                    >
                                                        {type === 'natural_disaster' ? 'Natural Disaster' : type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">Status:</span>
                                            <div className="flex gap-2">
                                                {(['all', 'completed', 'cancelled'] as const).map((status) => (
                                                    <Button
                                                        key={status}
                                                        variant={filters.status === status ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => applyFilters({ status })}
                                                        className={
                                                            filters.status === status
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
                                            Showing {incidents.from || 0}-{incidents.to || 0} of {incidents.total} items
                                        </span>
                                        {filters.search && (
                                            <button
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    applyFilters({ search: null });
                                                }}
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
                                                        ID / Address
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
                                                    Reporter
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
                                            {sortedItems.length > 0 ? (
                                                sortedItems.map((item) => (
                                                    <tr key={item.id} className="transition-colors hover:bg-gray-50">
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="text-sm font-mono text-gray-500">#{item.id.toString().padStart(4, '0')}</p>
                                                                <p className="text-sm font-medium text-gray-900 max-w-xs truncate" title={item.address || ''}>
                                                                    {item.address || 'No address'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getTypeBadge(item.type)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm text-gray-600 max-w-md truncate" title={item.description || ''}>
                                                                {item.description || 'No description'}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <p className="text-sm text-gray-700">{item.user?.name || 'Unknown'}</p>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>
                                                                    {new Date(item.completed_at || item.created_at).toLocaleDateString('en-US', {
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
                                                                <a
                                                                    href={`/admin/dispatch/${item.id}`}
                                                                    className="rounded p-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm"
                                                                    title="View details"
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center">
                                                        <ArchiveIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                        <p className="mt-4 text-lg font-medium text-gray-900">No archived incidents found</p>
                                                        <p className="mt-2 text-sm text-gray-500">
                                                            {filters.search || filters.type !== 'all' || filters.status !== 'all'
                                                                ? 'Try adjusting your search or filter criteria'
                                                                : 'Completed and cancelled incidents will appear here'}
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {incidents.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                                        <p className="text-sm text-gray-600">
                                            Page {incidents.current_page} of {incidents.last_page}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={incidents.current_page <= 1}
                                                onClick={() => goToPage(incidents.current_page - 1)}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={incidents.current_page >= incidents.last_page}
                                                onClick={() => goToPage(incidents.current_page + 1)}
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
