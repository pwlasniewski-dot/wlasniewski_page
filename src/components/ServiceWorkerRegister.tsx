'use client';

import { useEffect } from 'react';

/**
 * Rejestruje service worker po ~3s (po LCP), żeby nie blokować pierwszego renderu.
 * SW włączamy TYLKO w produkcji — w devie często powoduje stale cache.
 */
export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (process.env.NODE_ENV !== 'production') return;
        if (!('serviceWorker' in navigator)) return;

        const t = setTimeout(() => {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/' })
                .catch(() => { /* silently ignore */ });
        }, 3000);

        return () => clearTimeout(t);
    }, []);

    return null;
}
