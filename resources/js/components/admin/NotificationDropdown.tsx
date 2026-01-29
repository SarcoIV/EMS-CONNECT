import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    data: any;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    time_ago: string;
}

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/admin/notifications');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    // Poll for new notifications every 10 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    // Mark notification as read
    const markAsRead = async (id: number) => {
        try {
            await axios.patch(`/admin/notifications/${id}/mark-as-read`);
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        setIsLoading(true);
        try {
            await axios.post('/admin/notifications/mark-all-as-read');
            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Navigate to action URL if provided
        if (notification.data?.action_url) {
            window.location.href = notification.data.action_url;
        }
    };

    // Get icon based on notification type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_incident':
                return '🚨';
            case 'emergency_call':
                return '📞';
            case 'dispatch_accepted':
                return '✅';
            case 'responder_arrived':
                return '📍';
            case 'incident_completed':
                return '✓';
            default:
                return '🔔';
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-slate-600 hover:text-slate-900"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Dropdown Panel */}
                    <div className="absolute right-0 top-12 z-50 w-96 rounded-lg border bg-white shadow-2xl animate-in slide-in-from-top-2 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-2 text-xs font-normal text-slate-500">
                                        ({unreadCount} unread)
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    disabled={isLoading}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Bell className="mb-2 h-12 w-12 text-slate-300" />
                                    <p className="text-sm text-slate-500">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`border-b p-4 transition-colors cursor-pointer ${
                                            notification.is_read
                                                ? 'bg-white hover:bg-slate-50'
                                                : 'bg-blue-50 hover:bg-blue-100'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg">
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {notification.title}
                                                    </p>
                                                    {!notification.is_read && (
                                                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></div>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {notification.message}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {notification.time_ago}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="border-t p-3 text-center">
                                <a
                                    href="/admin/dashboard"
                                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                >
                                    View all activity
                                </a>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
