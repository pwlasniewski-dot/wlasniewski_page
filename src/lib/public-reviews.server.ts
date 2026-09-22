import prisma from '@/lib/db/prisma';
import { unstable_cache, unstable_noStore as noStore } from 'next/cache';

/** One CMS-backed collection for home, service pages, cities and booking. */
export async function loadPublicReviews() {
    noStore();
    return prisma.testimonial.findMany({
        orderBy: [{ display_order: 'asc' }, { id: 'desc' }],
        include: { client_photo: { select: { id: true, file_path: true, alt_text: true } } },
    });
}

export const loadCachedPublicReviews = unstable_cache(
    () => prisma.testimonial.findMany({
        orderBy: [{ display_order: 'asc' }, { id: 'desc' }],
        include: { client_photo: { select: { id: true, file_path: true, alt_text: true } } },
    }),
    ['public-marketing-reviews'],
    { revalidate: 300, tags: ['public-offer', 'testimonials'] },
);
