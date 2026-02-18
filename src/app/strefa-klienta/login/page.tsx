'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientLegacyLoginRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/logowanie');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto mb-4"></div>
                <p>Przekierowywanie do logowania...</p>
            </div>
        </div>
    );
}
