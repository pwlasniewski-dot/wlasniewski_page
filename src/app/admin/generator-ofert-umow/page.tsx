'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneratorOfertUmowPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/offers');
    }, [router]);

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
            <p className="text-zinc-500 animate-pulse">Przekierowywanie do nowej listy ofert...</p>
        </div>
    );
}
