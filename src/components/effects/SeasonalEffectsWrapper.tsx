'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const SeasonalEffects = dynamic(() => import('./SeasonalEffects'), {
    ssr: false
});

export default function SeasonalEffectsWrapper() {
    const pathname = usePathname();
    // Hide visual effects on B2B / Dron pages for professional look
    const isB2B = pathname?.startsWith('/b2b') || pathname?.startsWith('/dron');

    if (isB2B) return null;

    return <SeasonalEffects />;
}
