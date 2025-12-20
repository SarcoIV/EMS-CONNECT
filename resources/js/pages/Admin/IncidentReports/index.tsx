import { useState } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { IncomingCallNotification } from '@/components/admin/IncomingCallNotification';
import { router } from '@inertiajs/react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';

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
    address: string;
    description: string;
    latitude?: number;
    longitude?: number;
    created_at: string;
    dispatched_at?: string;
    completed_at?: string;
    user?: User;
}

interface Stats {
    total: number;
    pending: number;
    dispatched: number;
    in_progress: number;
    completed: number;
    cancelled: number;
}

interface Filters {
    status: string;
    type: string;
    date_from?: string;
    date_to?: string;
    search?: string;
}

interface TrendData {
    date: string;
    count: number;
}

interface TypeDistribution {
    type: string;
    count: number;
    color: string;
    [key: string]: string | number;
}

interface PaginatedIncidents {
    data: Incident[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface IncidentReportsProps {
    user: { name: string; email: string };
    incidents?: PaginatedIncidents | { data: Incident[] };
    stats?: Stats;
    incidentTypes?: string[];
    trendData?: TrendData[];
    typeDistribution?: TypeDistribution[];
    filters?: Filters;
}

const defaultStats: Stats = {
    total: 0,
    pending: 0,
    dispatched: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
};

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    dispatched: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-700',
};

const typeIcons: Record<string, string> = {
    medical: '🏥',
    fire: '🔥',
    accident: '🚗',
    crime: '🚨',
    natural_disaster: '🌊',
    other: '⚠️',
};

export default function IncidentReports({
    user,
    incidents,
    stats = defaultStats,
    incidentTypes = [],
    trendData = [],
    typeDistribution = [],
    filters = { status: 'all', type: 'all' },
}: IncidentReportsProps) {
    const [localFilters, setLocalFilters] = useState(filters);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Safely get incident data
    const incidentData: Incident[] = incidents && 'data' in incidents ? incidents.data : [];
    const pagination = incidents && 'current_page' in incidents ? incidents : null;

    // Apply filters
    const handleFilter = () => {
        router.get('/admin/incident-reports', {
            status: localFilters.status !== 'all' ? localFilters.status : undefined,
            type: localFilters.type !== 'all' ? localFilters.type : undefined,
            date_from: localFilters.date_from || undefined,
            date_to: localFilters.date_to || undefined,
            search: localFilters.search || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Clear filters
    const handleClearFilters = () => {
        setLocalFilters({ status: 'all', type: 'all', date_from: undefined, date_to: undefined, search: undefined });
        router.get('/admin/incident-reports', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // View incident details
    const handleViewIncident = (incident: Incident) => {
        setSelectedIncident(incident);
        setShowDetailModal(true);
    };

    // Format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Format short date
    const formatShortDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    // Navigate to page
    const goToPage = (page: number) => {
        router.get('/admin/incident-reports', {
            page,
            status: localFilters.status !== 'all' ? localFilters.status : undefined,
            type: localFilters.type !== 'all' ? localFilters.type : undefined,
            date_from: localFilters.date_from || undefined,
            date_to: localFilters.date_to || undefined,
            search: localFilters.search || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-red-50/30">
            <IncomingCallNotification />
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        {/* Page Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Incident Reports</h1>
                                <p className="text-sm text-slate-500">View and manage all incident reports</p>
                            </div>
                            <a
                                href="/admin/incident-reports/export"
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                📥 Export CSV
                            </a>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">Total</p>
                                <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">Pending</p>
                                <p className="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">Dispatched</p>
                                <p className="mt-1 text-2xl font-bold text-blue-600">{stats.dispatched}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">In Progress</p>
                                <p className="mt-1 text-2xl font-bold text-purple-600">{stats.in_progress}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">Completed</p>
                                <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.completed}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">Cancelled</p>
                                <p className="mt-1 text-2xl font-bold text-slate-500">{stats.cancelled}</p>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Trend Chart */}
                            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <h3 className="mb-4 font-semibold text-slate-700">Incidents (Last 7 Days)</h3>
                                <div className="h-48">
                                    {trendData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#64748b"
                                                    style={{ fontSize: '11px' }}
                                                    tickFormatter={(value) => formatShortDate(value)}
                                                />
                                                <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                    }}
                                                    formatter={(value) => [value ?? 0, 'Incidents']}
                                                    labelFormatter={(label) => formatShortDate(label)}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="count"
                                                    stroke="#ef4444"
                                                    fill="url(#colorIncidents)"
                                                    strokeWidth={2}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-slate-400">
                                            No trend data available
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Type Distribution */}
                            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <h3 className="mb-4 font-semibold text-slate-700">Incidents by Type</h3>
                                <div className="flex h-48 items-center gap-4">
                                    {typeDistribution.length > 0 ? (
                                        <>
                                            <div className="h-full w-1/2">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={typeDistribution}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={40}
                                                            outerRadius={70}
                                                            dataKey="count"
                                                            paddingAngle={2}
                                                        >
                                                            {typeDistribution.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {typeDistribution.map((item) => (
                                                    <div key={item.type} className="flex items-center gap-2 text-sm">
                                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                        <span className="capitalize">{typeIcons[item.type] || '⚠️'} {(item.type || 'unknown').replace('_', ' ')}</span>
                                                        <span className="font-medium text-slate-700">({item.count})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                                            No type data available
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                            <div className="flex flex-wrap items-end gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                                    <select
                                        value={localFilters.status}
                                        onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-300 focus:outline-none"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="dispatched">Dispatched</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
                                    <select
                                        value={localFilters.type}
                                        onChange={(e) => setLocalFilters({ ...localFilters, type: e.target.value })}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-300 focus:outline-none"
                                    >
                                        <option value="all">All Types</option>
                                        {incidentTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {typeIcons[type] || '⚠️'} {(type || 'unknown').replace('_', ' ')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">Date From</label>
                                    <input
                                        type="date"
                                        value={localFilters.date_from || ''}
                                        onChange={(e) => setLocalFilters({ ...localFilters, date_from: e.target.value })}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-300 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">Date To</label>
                                    <input
                                        type="date"
                                        value={localFilters.date_to || ''}
                                        onChange={(e) => setLocalFilters({ ...localFilters, date_to: e.target.value })}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-300 focus:outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
                                    <input
                                        type="text"
                                        value={localFilters.search || ''}
                                        onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                                        placeholder="Search by ID, address, or reporter..."
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-300 focus:outline-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleFilter}
                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                    >
                                        Apply
                                    </button>
                                    <button
                                        onClick={handleClearFilters}
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Incidents Table */}
                        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">ID</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Reporter</th>
                                            <th className="px-4 py-3">Location</th>
                                            <th className="px-4 py-3">Reported</th>
                                            <th className="px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {incidentData.length > 0 ? (
                                            incidentData.map((incident) => (
                                                <tr key={incident.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono font-medium text-slate-700">
                                                            #{incident.id.toString().padStart(4, '0')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="flex items-center gap-2">
                                                            <span>{typeIcons[incident.type] || '⚠️'}</span>
                                                            <span className="capitalize">{(incident.type || 'unknown').replace('_', ' ')}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[incident.status] || 'bg-slate-100 text-slate-700'}`}>
                                                            {(incident.status || 'unknown').replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="font-medium text-slate-700">{incident.user?.name || 'Unknown'}</p>
                                                            <p className="text-xs text-slate-500">{incident.user?.phone_number || incident.user?.email || 'N/A'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="max-w-xs truncate text-slate-600" title={incident.address}>
                                                            {incident.address || 'No address'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-500">
                                                        {formatDate(incident.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleViewIncident(incident)}
                                                                className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                                                                title="View details"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                            {incident.latitude && incident.longitude && (
                                                                <a
                                                                    href={`/admin/live-map?incident=${incident.id}`}
                                                                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                                                                    title="View on map"
                                                                >
                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                                    No incidents found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.last_page > 1 && (
                                <div className="flex items-center justify-between border-t p-4">
                                    <p className="text-sm text-slate-500">
                                        Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                                        {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                                        {pagination.total} results
                                    </p>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => goToPage(pagination.current_page - 1)}
                                            disabled={pagination.current_page === 1}
                                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                            const page = i + 1;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => goToPage(page)}
                                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                                                        pagination.current_page === page
                                                            ? 'bg-red-600 text-white'
                                                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => goToPage(pagination.current_page + 1)}
                                            disabled={pagination.current_page === pagination.last_page}
                                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Incident Detail Modal */}
            {showDetailModal && selectedIncident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDetailModal(false)}>
                    <div className="mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800">
                                Incident #{selectedIncident.id.toString().padStart(4, '0')}
                            </h2>
                            <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">{typeIcons[selectedIncident.type] || '⚠️'}</span>
                                <div>
                                    <p className="text-xl font-bold capitalize text-slate-800">
                                        {(selectedIncident.type || 'unknown').replace('_', ' ')}
                                    </p>
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[selectedIncident.status] || 'bg-slate-100 text-slate-700'}`}>
                                        {(selectedIncident.status || 'unknown').replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-3 rounded-lg bg-slate-50 p-4">
                                <div>
                                    <p className="text-xs text-slate-500">Reporter</p>
                                    <p className="font-medium text-slate-700">{selectedIncident.user?.name || 'Unknown'}</p>
                                    <p className="text-sm text-slate-500">{selectedIncident.user?.email}</p>
                                    <p className="text-sm text-slate-500">{selectedIncident.user?.phone_number || 'No phone'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Location</p>
                                    <p className="font-medium text-slate-700">{selectedIncident.address || 'No address'}</p>
                                    {selectedIncident.latitude && selectedIncident.longitude && (
                                        <p className="text-xs text-slate-400">
                                            {selectedIncident.latitude.toFixed(6)}, {selectedIncident.longitude.toFixed(6)}
                                        </p>
                                    )}
                                </div>
                                {selectedIncident.description && (
                                    <div>
                                        <p className="text-xs text-slate-500">Description</p>
                                        <p className="text-slate-700">{selectedIncident.description}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-center text-sm">
                                <div className="rounded-lg bg-slate-50 p-2">
                                    <p className="text-xs text-slate-500">Reported</p>
                                    <p className="font-medium text-slate-700">{formatDate(selectedIncident.created_at)}</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-2">
                                    <p className="text-xs text-slate-500">Dispatched</p>
                                    <p className="font-medium text-slate-700">{formatDate(selectedIncident.dispatched_at)}</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-2">
                                    <p className="text-xs text-slate-500">Completed</p>
                                    <p className="font-medium text-slate-700">{formatDate(selectedIncident.completed_at)}</p>
                                </div>
                            </div>

                            {selectedIncident.latitude && selectedIncident.longitude && (
                                <a
                                    href={`/admin/live-map?incident=${selectedIncident.id}`}
                                    className="block rounded-lg bg-red-600 py-2 text-center font-medium text-white hover:bg-red-700"
                                >
                                    View on Live Map
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

