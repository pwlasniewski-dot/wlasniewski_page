'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// PERF: te komponenty są ładowane PO hydracji głównej treści — nie blokują LCP/TTI.
const UtmTracker = dynamic(() => import('./UtmTracker'), { ssr: false });
const FloatingContact = dynamic(() => import('./FloatingContact'), { ssr: false });
const SeasonalEffectsWrapper = dynamic(() => import('./effects/SeasonalEffectsWrapper'), { ssr: false });
const PhotoCubeIntro = dynamic(() => import('./PhotoCubeIntro'), { ssr: false });

export default function DeferredClientChrome({ disabled = false }: { disabled?: boolean }) {
    const pathname = usePathname();
    const isStandaloneSurface = pathname?.startsWith('/admin') || pathname?.startsWith('/laboratorium-fizyki');
    if (disabled || isStandaloneSurface) return null;
    return (
        <>
            <UtmTracker />
            <SeasonalEffectsWrapper />
            <PhotoCubeIntro />
            <FloatingContact />
        </>
    );
}
