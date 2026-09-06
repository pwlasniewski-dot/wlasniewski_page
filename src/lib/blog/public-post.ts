import prisma from '@/lib/db/prisma';

// Keep the publication filter and CMS fields consistent for metadata and content.
export async function getPublishedBlogPost(slug: string) {
    return prisma.blogPost.findFirst({
        where: { slug, status: 'published' },
        select: {
            title: true,
            content: true,
            excerpt: true,
            category: true,
            published_at: true,
            meta_title: true,
            meta_description: true,
            featured_image: { select: { file_path: true, alt_text: true } },
        },
    });
}
