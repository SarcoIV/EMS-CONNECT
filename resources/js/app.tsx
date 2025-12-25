import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
// Removed initializeTheme since we want to force light mode
// import { initializeTheme } from './hooks/use-appearance';

// Initialize Laravel Echo for real-time broadcasting
import './echo';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Force light mode by ensuring the 'dark' class is not present
document.documentElement.classList.remove('dark');

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name: string) => {
        const pages = import.meta.glob('./pages/**/*.tsx', { eager: false });
        
        // First try exact match: Admin/LiveMap -> ./pages/Admin/LiveMap.tsx
        const exactPath = `./pages/${name}.tsx`;
        
        // Then try folder with index: Admin/LiveMap -> ./pages/Admin/LiveMap/index.tsx
        const folderPath = `./pages/${name}/index.tsx`;
        
        // Check which path exists in the glob
        if (folderPath in pages) {
            return resolvePageComponent(folderPath, pages);
        }
        
        // Fallback to exact path (or let it throw if not found)
        return resolvePageComponent(exactPath, pages);
    },
    setup({ el, App, props }: { el: HTMLElement; App: any; props: any }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// Removed initializeTheme() call to prevent overriding our forced white mode
// initializeTheme();
