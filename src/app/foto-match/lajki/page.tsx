import { Suspense } from 'react';
import type { Metadata } from 'next';
import LikesClient from './LikesClient';

export const metadata: Metadata = {
    title: 'Twoje polubienia — Foto-Match',
    robots: { index: false, follow: false },
};

export default function LikesPage() {
    return (
        <Suspense fallback={null}>
            <LikesClient />
        </Suspense>
    );
}
