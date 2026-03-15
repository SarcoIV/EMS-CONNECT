import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
}

interface UserEditProps {
    user: User;
    admins: AdminData[];
}

interface AdminData {
    id: number;
    name: string;
    email: string;
    phone_number: string | null;
    is_active: boolean;
}

export default function UserEdit({ user, admins: initialAdmins }: UserEditProps) {
    const [admins, setAdmins] = useState<AdminData[]>(initialAdmins);
    const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [titleFilter, setTitleFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(new Set(admins.map((a) => a.id)));
        } else {
            setSelectedUsers(new Set());
        }
    };

    const handleSelectUser = (userId: number, checked: boolean) => {
        const newSelected = new Set(selectedUsers);
        if (checked) {
            newSelected.add(userId);
        } else {
            newSelected.delete(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleToggleStatus = async (adminId: number) => {
        if (adminId === user.id) {
            alert('You cannot deactivate your own account.');
            return;
        }

        try {
            const response = await axios.patch(`/admin/user-edit/${adminId}/toggle-status`);
            setAdmins((prev) =>
                prev.map((a) =>
                    a.id === adminId ? { ...a, is_active: response.data.admin.is_active } : a
                )
            );
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleSort = (key: string) => {
        setSortConfig((prev) => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const sortedAdmins = [...admins].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = String(a[sortConfig.key as keyof AdminData] ?? '');
        const bValue = String(b[sortConfig.key as keyof AdminData] ?? '');

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredAdmins = sortedAdmins.filter((a) => {
        const matchesTitle = a.name.toLowerCase().includes(titleFilter.toLowerCase());
        const matchesSearch = !searchTerm || (
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.phone_number || '').includes(searchTerm)
        );
        return matchesTitle && matchesSearch;
    });

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return null;
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="ml-1 h-4 w-4 inline" />
        ) : (
            <ChevronDown className="ml-1 h-4 w-4 inline" />
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex h-screen bg-white">
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">
                    <div className="mx-auto max-w-7xl">
                        {/* Header with Count and Search */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">Admins ({admins.length})</h1>
                            </div>
                            <div className="relative w-80">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or contact..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-4 py-2 pl-10 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                />
                                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Table Card */}
                        <Card className="shadow-lg">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="w-12 px-6 py-4">
                                                    <Checkbox
                                                        checked={selectedUsers.size === admins.length && admins.length > 0}
                                                        onCheckedChange={handleSelectAll}
                                                    />
                                                </th>
                                                <th className="w-16 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    Image
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    <button
                                                        onClick={() => handleSort('name')}
                                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                                    >
                                                        Name
                                                        <SortIcon columnKey="name" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    Email
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    <button
                                                        onClick={() => handleSort('phone_number')}
                                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                                    >
                                                        Contact Number
                                                        <SortIcon columnKey="phone_number" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {/* Search/Filter Row */}
                                            <tr className="bg-gray-50">
                                                <td className="px-6 py-3"></td>
                                                <td className="px-6 py-3"></td>
                                                <td className="px-6 py-3">
                                                    <Input
                                                        placeholder="Filter by name..."
                                                        value={titleFilter}
                                                        onChange={(e) => setTitleFilter(e.target.value)}
                                                        className="h-8 w-full text-sm"
                                                    />
                                                </td>
                                                <td className="px-6 py-3"></td>
                                                <td className="px-6 py-3"></td>
                                                <td className="px-6 py-3"></td>
                                            </tr>

                                            {/* Admin Rows */}
                                            {filteredAdmins.length > 0 ? (
                                                filteredAdmins.map((adminData) => (
                                                    <tr
                                                        key={adminData.id}
                                                        className="transition-colors hover:bg-gray-50"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <Checkbox
                                                                checked={selectedUsers.has(adminData.id)}
                                                                onCheckedChange={(checked) =>
                                                                    handleSelectUser(adminData.id, checked as boolean)
                                                                }
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarFallback className="bg-[#7a1818] text-white text-sm font-semibold">
                                                                    {getInitials(adminData.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {adminData.name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-600">{adminData.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-600">
                                                                {adminData.phone_number || 'No phone'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleToggleStatus(adminData.id)}
                                                                className={`rounded p-2 transition-all ${
                                                                    adminData.is_active
                                                                        ? 'text-red-600 hover:bg-red-50 hover:text-red-700 hover:shadow-sm'
                                                                        : 'text-green-600 hover:bg-green-50 hover:text-green-700 hover:shadow-sm'
                                                                }`}
                                                                title={adminData.is_active ? 'Deactivate admin' : 'Activate admin'}
                                                            >
                                                                {adminData.is_active ? (
                                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center">
                                                        <p className="text-lg font-medium text-gray-900">No admins found</p>
                                                        <p className="mt-2 text-sm text-gray-500">
                                                            {searchTerm || titleFilter
                                                                ? 'Try adjusting your search criteria'
                                                                : 'No admin accounts exist yet'}
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Selected Count */}
                        <div className="mt-4 flex items-center justify-between">
                            {selectedUsers.size > 0 && (
                                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                                    <p className="text-sm font-medium text-blue-900">
                                        {selectedUsers.size} admin{selectedUsers.size !== 1 ? 's' : ''} selected
                                    </p>
                                </div>
                            )}
                            {searchTerm && (
                                <p className="text-sm text-gray-600">
                                    Showing {filteredAdmins.length} of {admins.length} admins
                                </p>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
