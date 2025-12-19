import React, { useState } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp, UserPen } from 'lucide-react';

interface User {
    name: string;
    email: string;
}

interface UserEditProps {
    user: User;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    contactNumber: string;
    avatar?: string;
    isActive: boolean;
}

export default function UserEdit({ user }: UserEditProps) {
    const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [titleFilter, setTitleFilter] = useState('');

    // Mock user data
    const [users, setUsers] = useState<UserData[]>([
        {
            id: 1,
            name: 'Arlene McCoy',
            email: 'Navin@gmail.com',
            contactNumber: '0945678901',
            isActive: true,
        },
        {
            id: 2,
            name: 'Cody Fisher',
            email: 'Navin@gmail.com',
            contactNumber: '0945678901',
            isActive: false,
        },
        {
            id: 3,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            contactNumber: '0945678902',
            isActive: true,
        },
        {
            id: 4,
            name: 'John Doe',
            email: 'john.doe@example.com',
            contactNumber: '0945678903',
            isActive: false,
        },
        {
            id: 5,
            name: 'Sarah Johnson',
            email: 'sarah.j@example.com',
            contactNumber: '0945678904',
            isActive: true,
        },
        {
            id: 6,
            name: 'Mike Williams',
            email: 'mike.w@example.com',
            contactNumber: '0945678905',
            isActive: true,
        },
    ]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(new Set(users.map((u) => u.id)));
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

    const handleToggleStatus = (userId: number) => {
        setUsers((prevUsers) =>
            prevUsers.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
        );
    };

    const handleSort = (key: string) => {
        setSortConfig((prev) => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const sortedUsers = [...users].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = String(a[sortConfig.key as keyof UserData] ?? '');
        const bValue = String(b[sortConfig.key as keyof UserData] ?? '');

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredUsers = sortedUsers.filter((u) =>
        u.name.toLowerCase().includes(titleFilter.toLowerCase())
    );

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
                        {/* Header with Count and Filter */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">All ({users.length})</h1>
                                <ChevronDown className="h-5 w-5 text-gray-500" />
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
                                                        checked={selectedUsers.size === users.length && users.length > 0}
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
                                                        Title
                                                        <SortIcon columnKey="name" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    Email
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                                    <button
                                                        onClick={() => handleSort('contactNumber')}
                                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                                    >
                                                        Contact number
                                                        <SortIcon columnKey="contactNumber" />
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
                                                        placeholder="Enter Title..."
                                                        value={titleFilter}
                                                        onChange={(e) => setTitleFilter(e.target.value)}
                                                        className="h-8 w-full text-sm"
                                                    />
                                                </td>
                                                <td className="px-6 py-3"></td>
                                                <td className="px-6 py-3"></td>
                                                <td className="px-6 py-3"></td>
                                            </tr>

                                            {/* User Rows */}
                                            {filteredUsers.map((userData) => (
                                                <tr
                                                    key={userData.id}
                                                    className="transition-colors hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4">
                                                        <Checkbox
                                                            checked={selectedUsers.has(userData.id)}
                                                            onCheckedChange={(checked) =>
                                                                handleSelectUser(userData.id, checked as boolean)
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={userData.avatar} alt={userData.name} />
                                                            <AvatarFallback className="bg-[#7a1818] text-white text-sm font-semibold">
                                                                {getInitials(userData.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {userData.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">{userData.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">
                                                            {userData.contactNumber}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Button
                                                            onClick={() => handleToggleStatus(userData.id)}
                                                            className={`h-8 px-4 text-xs font-semibold ${
                                                                userData.isActive
                                                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                                            }`}
                                                        >
                                                            {userData.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Selected Count Indicator */}
                        {selectedUsers.size > 0 && (
                            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                                <p className="text-sm font-medium text-blue-900">
                                    {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

