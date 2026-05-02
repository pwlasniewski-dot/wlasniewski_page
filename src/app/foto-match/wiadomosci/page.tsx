import { Suspense } from 'react';
import MessagesListClient from './MessagesListClient';

export const metadata = { title: 'Wiadomości — Foto-Match' };

export default function MessagesPage() {
    return (
        <Suspense fallback={null}>
            <MessagesListClient />
        </Suspense>
    );
}
