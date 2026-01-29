import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

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
                <NotificationDropdown />
            </div>
        </header>
    );
}
