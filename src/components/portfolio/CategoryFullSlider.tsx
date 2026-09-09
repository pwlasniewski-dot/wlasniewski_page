'use client';

import React from 'react';
import type { PortfolioSession } from '@/lib/portfolio';
import PortfolioPhotoSlider from './PortfolioPhotoSlider';

export default function CategoryFullSlider({ sessions, title, description }: {
    sessions: PortfolioSession[];
    title: string;
    description?: string;
}) {
    const slides = sessions.flatMap(session => {
        const images = session.highlightedPhotos?.length
            ? session.highlightedPhotos
            : session.coverImage ? [session.coverImage] : [];
        return images.map((image, index) => ({
            id: `${session.id}-${index}`,
            image,
            title: session.title,
            href: `/portfolio/${encodeURIComponent(session.category)}/${encodeURIComponent(session.slug)}`,
        }));
    });

    return <PortfolioPhotoSlider slides={slides} title={title} description={description} />;
}
