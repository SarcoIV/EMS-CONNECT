import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePage } from '@inertiajs/react';
import { BarChart, ChevronDown, LayoutDashboard, Map, Settings, UserCog, Users } from 'lucide-react';

interface User {
    name: string;
    email: string;
}

interface SidebarProps {
    user: User;
}

export function Sidebar({ user }: SidebarProps) {
    const { url } = usePage(); // Get the current route

    // Function to check if the route matches
    const isActive = (path: string) => url.startsWith(path);

    return (
        <div className="hidden w-64 flex-col border-r bg-white md:flex">
            {/* Header with logo */}
            <div className="flex h-16 items-center gap-4 border-b bg-[#7a1818] px-6">
                <img
                    src="/images/597486658_1215193403858896_2072558280615266887_n.png"
                    alt="EMS Connect logo"
                    className="h-12 w-12 object-contain"
                />
                <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Admin Panel</span>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-auto py-4 bg-white">
                <nav className="grid items-start gap-1 px-3 text-sm font-medium">
                    <Link href={route('admin.dashboard')} className="w-full">
                        <Button
                            variant="ghost"
                            className={`flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2 text-sm ${
                                isActive('/admin/dashboard')
                                    ? 'bg-[#7a1818] text-white shadow-sm'
                                    : 'text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </Button>
                    </Link>

                    <Link href={route('admin.people')} className="w-full">
                        <Button
                            variant="ghost"
                            className={`flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2 text-sm ${
                                isActive('/admin/people')
                                    ? 'bg-[#7a1818] text-white shadow-sm'
                                    : 'text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <Users size={18} />
                            <span>People</span>
                        </Button>
                    </Link>

                    <Link href={route('admin.live-map')} className="w-full">
                        <Button
                            variant="ghost"
                            className={`flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2 text-sm ${
                                isActive('/admin/live-map')
                                    ? 'bg-[#7a1818] text-white shadow-sm'
                                    : 'text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <Map size={18} />
                            <span>Live Map</span>
                        </Button>
                    </Link>

                    <Button
                        variant="ghost"
                        className="flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                        <BarChart size={18} />
                        <span>Incident Reports</span>
                    </Button>

                    <Button
                        variant="ghost"
                        className="flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                        <UserCog size={18} />
                        <span>Administration</span>
                    </Button>
                </nav>
            </div>

            {/* Profile Section */}
            <div className="border-t bg-gradient-to-b from-slate-50 to-white p-3">
                <div className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
                    <Avatar className="h-9 w-9 ring-2 ring-slate-100">
                        <AvatarImage src="/api/placeholder/32/32" alt={user.name} />
                        <AvatarFallback className="bg-[#7a1818] text-xs text-white">
                            {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <span className="truncate text-sm font-semibold text-slate-900">{user.name}</span>
                        <span className="truncate text-[11px] text-slate-500">{user.email}</span>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-700">
                                <ChevronDown size={14} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href={route('admin.settings')} className="w-full">
                                <DropdownMenuItem className="flex w-full cursor-pointer items-center gap-2">
                                    <Settings size={16} />
                                    Settings
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={route('auth.logout')} className="flex w-full cursor-pointer text-red-600">
                                    Logout
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
