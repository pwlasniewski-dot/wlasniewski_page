import { notFound } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import PageRenderer from '@/components/PageRenderer';
import { Metadata } from 'next';
import { PageSection } from '@/components/admin/PageBuilder';

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function getB2BPage(slug: string) {
    try {
        // Specifically search for B2B domain pages to avoid clashing with B2C slugs
        const page = await prisma.page.findFirst({
            where: {
                slug: { equals: slug, mode: 'insensitive' },
                is_published: true,
                page_type: 'b2b'
            },
            select: {
                slug: true,
                title: true,
                meta_title: true,
                meta_description: true,
                sections: true
            }
        });

        return page;
    } catch (error) {
        console.error(`ERROR: Database connection failed for B2B slug [${slug}]:`, error);
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const page = await getB2BPage(slug);

    if (!page) {
        return {
            title: 'Strona nie znaleziona | B2B',
        };
    }

    return {
        title: page.meta_title || page.title,
        description: page.meta_description,
        keywords: page.meta_keywords,
        openGraph: {
            title: page.meta_title || page.title,
            description: page.meta_description || '',
            type: 'website',
            images: page.hero_image ? [page.hero_image] : [],
        },
    };
}

export default async function B2BDynamicPage({ params }: PageProps) {
    const { slug } = await params;

    // Security measure: don't allow accessing 'b2b' itself as a slug here 
    // (it's handled by src/app/b2b/page.tsx)
    if (slug === 'b2b') notFound();

    const page = await getB2BPage(slug);

    if (!page) {
        notFound();
    }

    let sections: PageSection[] = [];

    if (page.sections) {
        try {
            sections = JSON.parse(page.sections);
        } catch (e) {
            console.error('Failed to parse B2B sections', e);
        }
    }

    // Fallback to HTML content if no sections
    if (sections.length === 0 && page.content) {
        sections = [
            {
                id: 'legacy_content',
                type: 'rich_text',
                data: {
                    content: page.content
                }
            }
        ];
    }

    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-gold-500 selection:text-black">
            <PageRenderer sections={sections} />
        </main>
    );
}
