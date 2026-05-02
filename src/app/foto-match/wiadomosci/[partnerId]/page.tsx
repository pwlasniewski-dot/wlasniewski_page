import { Suspense } from 'react';
import ChatClient from './ChatClient';

export const metadata = { title: 'Rozmowa — Foto-Match' };

interface PageProps { params: Promise<{ partnerId: string }> }

export default async function ChatPage({ params }: PageProps) {
    const { partnerId } = await params;
    return (
        <Suspense fallback={null}>
            <ChatClient partnerId={partnerId} />
        </Suspense>
    );
}
