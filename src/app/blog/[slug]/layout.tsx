import type { Metadata } from 'next';
import prisma from '@/lib/db/prisma';

type Props = {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
    const { slug } = await params;
    const canonical = `https://wlasniewski.pl/blog/${encodeURIComponent(slug)}`;

    try {
        const post = await prisma.blogPost.findUnique({
            where: { slug },
            select: {
                title: true,
                excerpt: true,
                meta_title: true,
                meta_description: true,
                status: true,
                featured_image: { select: { file_path: true, alt_text: true } },
            },
        });

        if (!post || post.status !== 'published') {
            return {
                title: 'Wpis nie znaleziony',
                robots: { index: false, follow: true },
            };
        }

        const title = post.meta_title || post.title;
        const description =
            post.meta_description ||
            post.excerpt ||
            `Przeczytaj artykuł „${post.title}” na blogu fotografa Przemysława Właśniewskiego.`;

        return {
            title,
            description,
            alternates: { canonical },
            robots: { index: true, follow: true },
            openGraph: {
                type: 'article',
                url: canonical,
                title,
                description,
                images: post.featured_image?.file_path
                    ? [{
                        url: post.featured_image.file_path,
                        alt: post.featured_image.alt_text || post.title,
                    }]
                    : undefined,
            },
        };
    } catch (error) {
        console.warn('[blog-metadata] Falling back because the database is unavailable', error);
        return {
            title: 'Blog fotograficzny',
            alternates: { canonical },
            robots: { index: true, follow: true },
        };
    }
}

export default function BlogPostLayout({ children }: Props) {
    return children;
}
