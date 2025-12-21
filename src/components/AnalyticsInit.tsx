"use client";

/**
 * Client Component that initializes analytics tracking
 * Import this in layout.tsx to auto-start tracking
 */

import { useEffect } from 'react';

export default function AnalyticsInit() {
    useEffect(() => {
        // Dynamically import tracker (client-side only)
        import('@/lib/analytics-tracker');
    }, []);

    return null; // This component renders nothing
}
