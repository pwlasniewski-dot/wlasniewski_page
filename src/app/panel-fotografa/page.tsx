import { Suspense } from 'react';
import PhotographerPanelClient from './PhotographerPanelClient';

export const metadata = {
    title: 'Panel fotografa — Właśniewski',
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Wczytywanie…</div>}>
            <PhotographerPanelClient />
        </Suspense>
    );
}
