import prisma from '@/lib/db/prisma';

/** Distinguish an unpublished record from a missing legacy city page. */
export async function loadCityPageState(slug: string) {
    try {
        const page = await prisma.page.findFirst({ where: { slug: { equals: slug, mode: 'insensitive' } } });
        return page ? { status: page.is_published ? 'published' as const : 'unpublished' as const, page }
            : { status: 'missing' as const, page: null };
    } catch (error) {
        console.warn('[city-page] CMS unavailable; using safe starter content.', error);
        return { status: 'unavailable' as const, page: null };
    }
}
