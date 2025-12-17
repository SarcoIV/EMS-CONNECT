import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Menu, Search } from 'lucide-react';

export function Header() {
    return (
        <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-white px-4 shadow-sm md:px-6">
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="mr-3 md:hidden">
                <Menu size={20} />
            </Button>

            {/* Search bar */}
            <div className="flex flex-1 items-center gap-4">
                <div className="relative hidden w-full max-w-md md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Quick search..."
                        className="h-9 w-full rounded-full border-slate-200 bg-slate-50 pl-9 text-sm focus-visible:ring-[#7a1818]"
                    />
                </div>
            </div>

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
