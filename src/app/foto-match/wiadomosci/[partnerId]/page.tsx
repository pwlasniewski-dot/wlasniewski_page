import { Suspense } from 'react';
import type { Metadata } from 'next';
import ChatClient from './ChatClient';

export const metadata: Metadata = {
    title: 'Rozmowa — Foto-Match',
    robots: { index: false, follow: false },
};

interface PageProps { params: Promise<{ partnerId: string }> }

export default async function ChatPage({ params }: PageProps) {
    const { partnerId } = await params;
    return (
        <Suspense fallback={null}>
            <ChatClient partnerId={partnerId} />
        </Suspense>
    );
}
