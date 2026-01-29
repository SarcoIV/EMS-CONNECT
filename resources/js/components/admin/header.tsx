import { Button } from '@/components/ui/button';
import { Bell, Menu } from 'lucide-react';

export function Header() {
    return (
        <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-white px-4 shadow-sm md:px-6">
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="mr-3 md:hidden">
                <Menu size={20} />
            </Button>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-600 hover:text-slate-900">
                    <Bell size={18} />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                </Button>
            </div>
        </header>
    );
}
