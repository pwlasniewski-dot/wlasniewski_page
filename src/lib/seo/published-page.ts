import prisma from '@/lib/db/prisma';

// Use the same publication predicate for metadata and body. Do not persistently
// cache this result: unpublishing must also remove the public SEO metadata.
export const getPublishedPage = async (slug: string) => prisma.page.findFirst({
    where: {
        slug: { equals: slug, mode: 'insensitive' },
        is_published: true,
    },
});
