'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import GalleryAdmin from '@/components/admin/GalleryAdmin';

export default function GalleryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const galleryId = Number(resolvedParams.id);

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8 md:p-12">
            <div className="max-w-7xl mx-auto">
                {/* Unified Admin Component */}
                <GalleryAdmin
                    galleryId={galleryId}
                    onClose={() => router.push('/admin/clients')} // Default back to clients
                />
            </div>
        </div>
    );
}
