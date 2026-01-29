import { useState } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { IncomingCallNotification } from '@/components/admin/IncomingCallNotification';
import { Switch } from '@/components/ui/switch';
import axios from 'axios';

interface UserData {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    role?: string;
    email_verified: boolean;
    created_at: string;
    last_login_at?: string;
    incident_count?: number;
}

interface AdminData {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    created_at: string;
    last_login_at?: string;
}

interface ResponderData {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    role: string;
    email_verified: boolean;
    created_at: string;
    last_login_at?: string;
}

interface Stats {
    totalUsers: number;
    verifiedUsers: number;
    totalAdmins: number;
    totalResponders: number;
    activeResponders: number;
    activeToday: number;
}

interface PeopleProps {
    user: { id?: number; name: string; email: string };
    users?: UserData[];
    admins?: AdminData[];
    responders?: ResponderData[];
    stats?: Stats;
}

const defaultStats: Stats = {
    totalUsers: 0,
    verifiedUsers: 0,
    totalAdmins: 0,
    totalResponders: 0,
    activeResponders: 0,
    activeToday: 0,
};

export default function People({ 
    user, 
    users: initialUsers = [], 
    admins: initialAdmins = [],
    responders: initialResponders = [],
    stats = defaultStats 
}: PeopleProps) {
    const [users, setUsers] = useState<UserData[]>(initialUsers);
    const [admins, setAdmins] = useState<AdminData[]>(initialAdmins);
    const [responders, setResponders] = useState<ResponderData[]>(initialResponders);
    const [activeTab, setActiveTab] = useState<'users' | 'admins' | 'responders'>('users');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
    const [showCreateResponderModal, setShowCreateResponderModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
    const [newResponder, setNewResponder] = useState({ name: '', email: '', phone_number: '', password: '' });
    const [userIncidents, setUserIncidents] = useState<any[]>([]);

    // Filter users/admins based on search
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone_number?.includes(searchTerm)
    );

    const filteredAdmins = admins.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredResponders = responders.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone_number?.includes(searchTerm)
    );

    // View user details
    const handleViewUser = async (userData: UserData) => {
        try {
            setIsLoading(true);
            const response = await axios.get(`/admin/people/${userData.id}`);
            setSelectedUser(response.data.user);
            setUserIncidents(response.data.incidents || []);
            setShowUserModal(true);
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            alert('Failed to fetch user details');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle user status
    const handleToggleStatus = async (userId: number) => {
        try {
            setIsLoading(true);
            const response = await axios.patch(`/admin/people/${userId}/toggle-status`);
            
            // Update local state
            setUsers(prev => prev.map(u => 
                u.id === userId ? { ...u, email_verified: response.data.user.email_verified } : u
            ));
            
            if (selectedUser?.id === userId) {
                setSelectedUser(prev => prev ? { ...prev, email_verified: response.data.user.email_verified } : null);
            }
            
            console.log('[PEOPLE] ✅', response.data.message);
        } catch (error: any) {
            console.error('Failed to toggle user status:', error);
            alert(error.response?.data?.message || 'Failed to update user status');
        } finally {
            setIsLoading(false);
        }
    };

    // Create new admin
    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const response = await axios.post('/admin/people/admin', newAdmin);
            
            // Add to list
            setAdmins(prev => [response.data.admin, ...prev]);
            setShowCreateAdminModal(false);
            setNewAdmin({ name: '', email: '', password: '' });
            
            console.log('[PEOPLE] ✅ Admin created');
        } catch (error: any) {
            console.error('Failed to create admin:', error);
            alert(error.response?.data?.message || 'Failed to create admin');
        } finally {
            setIsLoading(false);
        }
    };

    // Remove admin access
    const handleRemoveAdmin = async (adminId: number) => {
        if (!confirm('Are you sure you want to remove admin access from this user?')) return;
        
        try {
            setIsLoading(true);
            await axios.delete(`/admin/people/admin/${adminId}`);
            
            // Remove from list
            setAdmins(prev => prev.filter(a => a.id !== adminId));
            
            console.log('[PEOPLE] ✅ Admin access removed');
        } catch (error: any) {
            console.error('Failed to remove admin:', error);
            alert(error.response?.data?.message || 'Failed to remove admin access');
        } finally {
            setIsLoading(false);
        }
    };

    // Create new responder
    const handleCreateResponder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const response = await axios.post('/admin/people/responder', newResponder);
            
            // Add to list
            setResponders(prev => [response.data.responder, ...prev]);
            setShowCreateResponderModal(false);
            setNewResponder({ name: '', email: '', phone_number: '', password: '' });
            
            console.log('[PEOPLE] ✅ Responder created');
        } catch (error: any) {
            console.error('Failed to create responder:', error);
            alert(error.response?.data?.message || 'Failed to create responder');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle responder status
    const handleToggleResponderStatus = async (responderId: number) => {
        try {
            setIsLoading(true);
            const response = await axios.patch(`/admin/people/responder/${responderId}/toggle-status`);
            
            // Update local state
            setResponders(prev => prev.map(r => 
                r.id === responderId ? { ...r, email_verified: response.data.responder.email_verified } : r
            ));
            
            console.log('[PEOPLE] ✅', response.data.message);
        } catch (error: any) {
            console.error('Failed to toggle responder status:', error);
            alert(error.response?.data?.message || 'Failed to update responder status');
        } finally {
            setIsLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-red-50/30">
            <IncomingCallNotification />
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="mx-auto max-w-7xl">
                        {/* Page Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-800">People Management</h1>
                            <p className="text-sm text-slate-500">Manage system users and administrators</p>
                        </div>

                        {/* Stats Cards */}
                        <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">Total Users</p>
                                <p className="mt-1 text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">Verified</p>
                                <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.verifiedUsers}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">Admins</p>
                                <p className="mt-1 text-2xl font-bold text-blue-600">{stats.totalAdmins}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">Responders</p>
                                <p className="mt-1 text-2xl font-bold text-indigo-600">{stats.totalResponders}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">Active Responders</p>
                                <p className="mt-1 text-2xl font-bold text-green-600">{stats.activeResponders}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium uppercase text-slate-500">Active Today</p>
                                <p className="mt-1 text-2xl font-bold text-purple-600">{stats.activeToday}</p>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                            {/* Tabs & Search */}
                            <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActiveTab('users')}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                            activeTab === 'users'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        👤 Users ({users.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('admins')}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                            activeTab === 'admins'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        🛡️ Admins ({admins.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('responders')}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                            activeTab === 'responders'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        🚑 Responders ({responders.length})
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-64 rounded-lg border border-slate-200 px-4 py-2 pl-10 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                        />
                                        <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    {activeTab === 'admins' && (
                                        <button
                                            onClick={() => setShowCreateAdminModal(true)}
                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                        >
                                            + Add Admin
                                        </button>
                                    )}
                                    {activeTab === 'responders' && (
                                        <button
                                            onClick={() => setShowCreateResponderModal(true)}
                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                        >
                                            + Add Responder
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Users Table */}
                            {activeTab === 'users' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">User</th>
                                                <th className="px-4 py-3">Contact</th>
                                                <th className="px-4 py-3">Role</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Incidents</th>
                                                <th className="px-4 py-3">Last Login</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map((userData) => (
                                                    <tr key={userData.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
                                                                    {userData.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-slate-800">{userData.name}</p>
                                                                    <p className="text-xs text-slate-500">ID: {userData.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-slate-700">{userData.email}</p>
                                                            <p className="text-xs text-slate-500">{userData.phone_number || 'No phone'}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                userData.role === 'responder' 
                                                                    ? 'bg-blue-100 text-blue-700' 
                                                                    : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                                {userData.role || 'community'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                userData.email_verified 
                                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                <span className={`h-1.5 w-1.5 rounded-full ${userData.email_verified ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                                {userData.email_verified ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="font-medium text-slate-700">{userData.incident_count || 0}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-slate-500">
                                                            {formatDate(userData.last_login_at)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => handleViewUser(userData)}
                                                                    className="rounded p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 hover:shadow-sm"
                                                                    title="View details"
                                                                >
                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </button>
                                                                <Switch
                                                                    checked={userData.email_verified}
                                                                    onCheckedChange={() => handleToggleStatus(userData.id)}
                                                                    disabled={isLoading}
                                                                    title={userData.email_verified ? 'Active' : 'Inactive'}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                                        No users found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Admins Table */}
                            {activeTab === 'admins' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">Admin</th>
                                                <th className="px-4 py-3">Email</th>
                                                <th className="px-4 py-3">Phone</th>
                                                <th className="px-4 py-3">Created</th>
                                                <th className="px-4 py-3">Last Login</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredAdmins.length > 0 ? (
                                                filteredAdmins.map((admin) => (
                                                    <tr key={admin.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-medium text-red-600">
                                                                    {admin.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-slate-800">{admin.name}</p>
                                                                    {user.id && admin.id === user.id && (
                                                                        <span className="text-xs text-slate-500">(You)</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-700">{admin.email}</td>
                                                        <td className="px-4 py-3 text-slate-500">{admin.phone_number || '-'}</td>
                                                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(admin.created_at)}</td>
                                                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(admin.last_login_at)}</td>
                                                        <td className="px-4 py-3">
                                                            {(!user.id || admin.id !== user.id) && (
                                                                <button
                                                                    onClick={() => handleRemoveAdmin(admin.id)}
                                                                    disabled={isLoading}
                                                                    className="rounded p-2 text-red-600 transition-all hover:bg-red-50 hover:text-red-700 hover:shadow-sm disabled:opacity-50"
                                                                    title="Remove admin access"
                                                                >
                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                        No admins found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Responders Table */}
                            {activeTab === 'responders' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">Responder</th>
                                                <th className="px-4 py-3">Contact</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Created</th>
                                                <th className="px-4 py-3">Last Login</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredResponders.length > 0 ? (
                                                filteredResponders.map((responder) => (
                                                    <tr key={responder.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                                                                    {responder.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-slate-800">{responder.name}</p>
                                                                    <p className="text-xs text-slate-500">ID: {responder.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-slate-700">{responder.email}</p>
                                                            <p className="text-xs text-slate-500">{responder.phone_number || 'No phone'}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                responder.email_verified 
                                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                <span className={`h-1.5 w-1.5 rounded-full ${responder.email_verified ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                                {responder.email_verified ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(responder.created_at)}</td>
                                                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(responder.last_login_at)}</td>
                                                        <td className="px-4 py-3">
                                                            <Switch
                                                                checked={responder.email_verified}
                                                                onCheckedChange={() => handleToggleResponderStatus(responder.id)}
                                                                disabled={isLoading}
                                                                title={responder.email_verified ? 'Active' : 'Inactive'}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                        No responders found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowUserModal(false)}>
                    <div className="mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800">User Details</h2>
                            <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-2xl font-bold text-slate-600">
                                    {selectedUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-800">{selectedUser.name}</p>
                                    <p className="text-sm text-slate-500">{selectedUser.email}</p>
                                </div>
                            </div>

                            <div className="grid gap-3 rounded-lg bg-slate-50 p-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Phone</span>
                                    <span className="text-sm font-medium text-slate-700">{selectedUser.phone_number || 'Not provided'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Role</span>
                                    <span className="text-sm font-medium text-slate-700">{selectedUser.role || 'community'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Status</span>
                                    <span className={`text-sm font-medium ${selectedUser.email_verified ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {selectedUser.email_verified ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Joined</span>
                                    <span className="text-sm font-medium text-slate-700">{formatDate(selectedUser.created_at)}</span>
                                </div>
                            </div>

                            {userIncidents.length > 0 && (
                                <div>
                                    <h3 className="mb-2 font-semibold text-slate-700">Incident History</h3>
                                    <div className="max-h-48 space-y-2 overflow-y-auto">
                                        {userIncidents.map((incident: any) => (
                                            <div key={incident.id} className="rounded-lg border bg-white p-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-700">#{incident.id} - {incident.type}</span>
                                                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                                                        incident.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        incident.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {incident.status}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500">{incident.address}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Admin Modal */}
            {showCreateAdminModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateAdminModal(false)}>
                    <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-4 text-lg font-bold text-slate-800">Create Admin Account</h2>
                        
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                                <input
                                    type="text"
                                    value={newAdmin.name}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                    required
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    required
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                                <input
                                    type="password"
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                    required
                                    minLength={8}
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateAdminModal(false)}
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating...' : 'Create Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Responder Modal */}
            {showCreateResponderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateResponderModal(false)}>
                    <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-4 text-lg font-bold text-slate-800">Create Responder Account</h2>
                        
                        <form onSubmit={handleCreateResponder} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                                <input
                                    type="text"
                                    value={newResponder.name}
                                    onChange={(e) => setNewResponder({ ...newResponder, name: e.target.value })}
                                    required
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={newResponder.email}
                                    onChange={(e) => setNewResponder({ ...newResponder, email: e.target.value })}
                                    required
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number (Optional)</label>
                                <input
                                    type="tel"
                                    value={newResponder.phone_number}
                                    onChange={(e) => setNewResponder({ ...newResponder, phone_number: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                                <input
                                    type="password"
                                    value={newResponder.password}
                                    onChange={(e) => setNewResponder({ ...newResponder, password: e.target.value })}
                                    required
                                    minLength={8}
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                />
                                <p className="mt-1 text-xs text-slate-500">Minimum 8 characters</p>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateResponderModal(false)}
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating...' : 'Create Responder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

