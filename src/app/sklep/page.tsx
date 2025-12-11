'use client';

// Simply redirect to the gift card shop
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/karta-podarunkowa');
    }, [router]);

    return null;
}
