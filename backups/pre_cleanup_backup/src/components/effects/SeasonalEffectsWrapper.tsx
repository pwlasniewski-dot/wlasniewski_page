'use client';

import dynamic from 'next/dynamic';

const SeasonalEffects = dynamic(() => import('./SeasonalEffects'), {
    ssr: false
});

export default function SeasonalEffectsWrapper() {
    return <SeasonalEffects />;
}
