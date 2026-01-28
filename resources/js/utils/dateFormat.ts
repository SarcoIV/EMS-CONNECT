/**
 * Date Formatting Utilities
 * Consistent date formatting across the application
 */

/**
 * Format date to locale string (e.g., "Jan 28, 2026, 10:30 AM")
 */
export function formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    try {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return 'Invalid date';
    }
}

/**
 * Format date only (e.g., "Jan 28, 2026")
 */
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return 'Invalid date';
    }
}

/**
 * Format short date (e.g., "Jan 28")
 */
export function formatShortDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return 'Invalid date';
    }
}

/**
 * Format time only (e.g., "10:30 AM")
 */
export function formatTime(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    try {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return 'Invalid time';
    }
}

/**
 * Format time ago (e.g., "2 minutes ago", "3 hours ago")
 */
export function formatTimeAgo(dateString: string | null | undefined): string {
    if (!dateString) return 'Never';

    try {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

        return formatDate(dateString);
    } catch {
        return 'Invalid date';
    }
}

/**
 * Format full datetime with seconds (e.g., "Jan 28, 2026, 10:30:45 AM")
 */
export function formatFullDateTime(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    try {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch {
        return 'Invalid date';
    }
}

/**
 * Format relative date (e.g., "Today", "Yesterday", or full date)
 */
export function formatRelativeDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return formatDate(dateString);
    } catch {
        return 'Invalid date';
    }
}
