import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { IncomingCallNotification } from '@/components/admin/IncomingCallNotification';
import { CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Bar, BarChart } from 'recharts';
import axios from 'axios';

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
    latitude: number;
    longitude: number;
    description: string;
    created_at: string;
    dispatched_at?: string;
    completed_at?: string;
    user?: User;
}

interface ActiveCall {
    id: number;
    channel_name: string;
    status: string;
    started_at: string;
    answered_at?: string;
    is_answered: boolean;
    user?: User;
    incident?: {
        id: number;
        type: string;
        status: string;
    };
}

interface Stats {
    totalIncidents: number;
    totalUsers: number;
    totalAdmins: number;
    pendingIncidents: number;
    dispatchedIncidents: number;
    inProgressIncidents: number;
    completedIncidents: number;
    cancelledIncidents: number;
    todayIncidents: number;
    monthIncidents: number;
    activeCalls: number;
    totalCalls: number;
    todayCalls: number;
}

interface IncidentType {
    name: string;
    value: number;
    count: number;
    color: string;
    [key: string]: string | number;
}

interface MonthlyTrend {
    month: string;
    total: number;
    pending: number;
    dispatched: number;
    completed: number;
}

interface DashboardProps {
    user: { name: string; email: string };
    stats: Stats;
    recentIncidents: Incident[];
    activeCalls: ActiveCall[];
    incidentTypes: IncidentType[];
    monthlyTrend: MonthlyTrend[];
}

const POLL_INTERVAL = 10000; // Poll every 10 seconds

export default function AdminDashboard({ 
    user, 
    stats: initialStats,
    recentIncidents: initialIncidents,
    activeCalls: initialCalls,
    incidentTypes: initialTypes,
    monthlyTrend: initialTrend
}: DashboardProps) {
    const [stats, setStats] = useState<Stats>(initialStats);
    const [recentIncidents, setRecentIncidents] = useState<Incident[]>(initialIncidents);
    const [activeCalls, setActiveCalls] = useState<ActiveCall[]>(initialCalls);
    const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>(initialTypes);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Fetch real-time stats
    const fetchStats = useCallback(async () => {
        try {
            console.log('[DASHBOARD] 🔄 Fetching real-time stats...');
            const response = await axios.get('/admin/dashboard/stats');
            const data = response.data;

            setStats(data.stats);
            setRecentIncidents(data.recentIncidents);
            setActiveCalls(data.activeCalls);
            setIncidentTypes(data.incidentTypes);
            setLastUpdated(new Date());

            if (data.stats.pendingIncidents > 0 || data.activeCalls.length > 0) {
                console.log('[DASHBOARD] 🔔 Active emergencies:', {
                    pending: data.stats.pendingIncidents,
                    activeCalls: data.activeCalls.length,
                });
            }
        } catch (error) {
            console.error('[DASHBOARD] ❌ Failed to fetch stats:', error);
        }
    }, []);

    // Set up polling
    useEffect(() => {
        console.log('[DASHBOARD] 🚀 Starting real-time updates (every 10 seconds)');
        
        const interval = setInterval(fetchStats, POLL_INTERVAL);

        return () => {
            console.log('[DASHBOARD] 🛑 Stopping real-time updates');
            clearInterval(interval);
        };
    }, [fetchStats]);

    // Dispatch incident (pending → dispatched)
    const handleDispatch = async (incidentId: number) => {
        if (!confirm('Are you sure you want to dispatch this incident? This will mark it as dispatched and lock it for response coordination.')) {
            return;
        }

        try {
            setIsLoading(true);
            console.log('[DISPATCH] 🚑 Dispatching incident:', incidentId);
            
            const response = await axios.patch(`/admin/incidents/${incidentId}/dispatch`);
            
            // Refresh data
            await fetchStats();
            
            console.log('[DISPATCH] ✅ Incident dispatched successfully:', response.data);
            alert('Incident dispatched successfully!');
        } catch (error: any) {
            console.error('[DISPATCH] ❌ Failed to dispatch incident:', error);
            const message = error.response?.data?.message || 'Failed to dispatch incident. Please try again.';
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    // Update incident status
    const handleUpdateStatus = async (incidentId: number, newStatus: string) => {
        try {
            setIsLoading(true);
            await axios.patch(`/admin/incidents/${incidentId}/status`, {
                status: newStatus,
            });
            
            // Refresh data
            await fetchStats();
            console.log('[DASHBOARD] ✅ Incident status updated');
        } catch (error) {
            console.error('[DASHBOARD] ❌ Failed to update status:', error);
            alert('Failed to update incident status');
        } finally {
            setIsLoading(false);
        }
    };

    // Get status badge color
    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            dispatched: 'bg-blue-100 text-blue-700 border-blue-200',
            in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
            completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
        };
        return badges[status] || 'bg-slate-100 text-slate-700';
    };

    // Get emergency type badge
    const getTypeBadge = (type: string) => {
        const badges: Record<string, string> = {
            medical: 'bg-emerald-100 text-emerald-700',
            fire: 'bg-orange-100 text-orange-700',
            accident: 'bg-sky-100 text-sky-700',
            crime: 'bg-red-100 text-red-700',
            natural_disaster: 'bg-purple-100 text-purple-700',
            other: 'bg-slate-100 text-slate-700',
        };
        return badges[type] || 'bg-slate-100 text-slate-700';
    };

    // Format time ago
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-red-50/30">
            {/* Incoming Call Notification */}
            <IncomingCallNotification />

            {/* Sidebar */}
            <Sidebar user={user} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6">
                        
                        {/* Page Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                                <p className="text-sm text-slate-500">
                                    Real-time emergency monitoring • Last updated: {lastUpdated.toLocaleTimeString()}
                                </p>
                            </div>
                            <button
                                onClick={fetchStats}
                                disabled={isLoading}
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                            >
                                <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                        </div>

                        {/* Emergency Summary Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {/* New Emergencies */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-amber-100">Pending</p>
                                        <p className="mt-1 text-3xl font-bold">{stats.pendingIncidents}</p>
                                    </div>
                                    <div className="rounded-full bg-white/20 p-3">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-amber-100">Awaiting dispatch</div>
                                {stats.pendingIncidents > 0 && (
                                    <div className="absolute -right-2 -top-2 h-4 w-4 animate-ping rounded-full bg-white" />
                                )}
                            </div>

                            {/* Active Emergencies */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-100">Dispatched</p>
                                        <p className="mt-1 text-3xl font-bold">{stats.dispatchedIncidents}</p>
                                    </div>
                                    <div className="rounded-full bg-white/20 p-3">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-blue-100">Units responding</div>
                            </div>

                            {/* Completed Today */}
                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-emerald-100">Completed</p>
                                        <p className="mt-1 text-3xl font-bold">{stats.completedIncidents}</p>
                                    </div>
                                    <div className="rounded-full bg-white/20 p-3">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-emerald-100">Successfully resolved</div>
                            </div>

                            {/* Active Calls */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-5 text-white shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-red-100">Active Calls</p>
                                        <p className="mt-1 text-3xl font-bold">{stats.activeCalls}</p>
                                    </div>
                                    <div className="rounded-full bg-white/20 p-3">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-red-100">Ongoing emergency calls</div>
                                {stats.activeCalls > 0 && (
                                    <div className="absolute -right-2 -top-2 h-4 w-4 animate-ping rounded-full bg-white" />
                                )}
                            </div>
                        </div>

                        {/* Active Calls Section */}
                        {activeCalls.length > 0 && (
                            <section className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 shadow-sm">
                                <header className="mb-4 flex items-center gap-3">
                                    <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                                    <h2 className="text-lg font-bold text-red-700">Active Emergency Calls</h2>
                                </header>
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {activeCalls.map((call) => (
                                        <div key={call.id} className="rounded-xl bg-white p-4 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${call.is_answered ? 'bg-green-500' : 'animate-pulse bg-red-500'}`} />
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {call.is_answered ? 'In Call' : 'Calling...'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-500">{formatTimeAgo(call.started_at)}</span>
                                            </div>
                                            <p className="mt-2 font-semibold text-slate-800">{call.user?.name || 'Unknown'}</p>
                                            <p className="text-sm text-slate-500">{call.user?.phone_number || call.user?.email}</p>
                                            {call.incident && (
                                                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getTypeBadge(call.incident.type)}`}>
                                                    {call.incident.type.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Charts Row */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Monthly Trend Chart */}
                            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                                <header className="mb-4">
                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600">
                                        Monthly Trend
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-600">Incidents over the last 6 months</p>
                                </header>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={initialTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '11px' }} />
                                            <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: 'white', 
                                                    border: '1px solid #e2e8f0', 
                                                    borderRadius: '8px',
                                                    fontSize: '12px'
                                                }} 
                                            />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="dispatched" name="Dispatched" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            {/* Incident Type Distribution */}
                            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                                <header className="mb-4">
                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600">
                                        Incident Types
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-600">Distribution by emergency type</p>
                                </header>
                                <div className="flex items-center gap-6">
                                    <div className="relative h-48 w-48 flex-shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={incidentTypes.length > 0 ? incidentTypes : [{ name: 'No data', value: 100, count: 0, color: '#e2e8f0' }]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {(incidentTypes.length > 0 ? incidentTypes : [{ name: 'No data', value: 100, count: 0, color: '#e2e8f0' }]).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'white', 
                                                        border: '1px solid #e2e8f0', 
                                                        borderRadius: '8px' 
                                                    }} 
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-slate-800">{stats.totalIncidents}</p>
                                                <p className="text-xs text-slate-500">Total</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        {incidentTypes.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="text-sm text-slate-700">{item.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-semibold text-slate-800">{item.value}%</span>
                                                    <span className="ml-1 text-xs text-slate-500">({item.count})</span>
                                                </div>
                                            </div>
                                        ))}
                                        {incidentTypes.length === 0 && (
                                            <p className="text-center text-sm text-slate-500">No incidents recorded yet</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Recent Incidents Table */}
                        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                            <header className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600">
                                        Recent Incidents
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Latest emergency reports and their current status
                                    </p>
                                </div>
                                <a 
                                    href="/admin/incident-reports" 
                                    className="text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                    View all →
                                </a>
                            </header>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">ID</th>
                                            <th className="px-4 py-3">Reporter</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Location</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Time</th>
                                            <th className="px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-slate-700">
                                        {recentIncidents.length > 0 ? (
                                            recentIncidents.map((incident) => (
                                                <tr key={incident.id} className="hover:bg-slate-50 transition">
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                                        #{incident.id.toString().padStart(4, '0')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="font-medium">{incident.user?.name || 'Unknown'}</p>
                                                            <p className="text-xs text-slate-500">{incident.user?.phone_number || incident.user?.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getTypeBadge(incident.type)}`}>
                                                            {incident.type.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 max-w-[200px]">
                                                        <p className="truncate text-sm" title={incident.address}>
                                                            {incident.address || 'No address'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadge(incident.status)}`}>
                                                            {incident.status === 'pending' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />}
                                                            {incident.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-500">
                                                        {formatTimeAgo(incident.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1">
                                                            <a
                                                                href={`/admin/live-map?incident=${incident.id}`}
                                                                className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                                                title="View on map"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                                </svg>
                                                            </a>
                                                            {incident.status === 'pending' && (
                                                                <a
                                                                    href={`/admin/dispatch/${incident.id}`}
                                                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 inline-block"
                                                                    title="Select responders and dispatch"
                                                                >
                                                                    🚑 Dispatch
                                                                </a>
                                                            )}
                                                            {incident.status === 'dispatched' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(incident.id, 'completed')}
                                                                    disabled={isLoading}
                                                                    className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                                                                    title="Mark as resolved"
                                                                >
                                                                    Complete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                                    No incidents recorded yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Quick Stats Footer */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Today's Incidents</p>
                                <p className="mt-1 text-2xl font-bold text-slate-800">{stats.todayIncidents}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">This Month</p>
                                <p className="mt-1 text-2xl font-bold text-slate-800">{stats.monthIncidents}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Users</p>
                                <p className="mt-1 text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
