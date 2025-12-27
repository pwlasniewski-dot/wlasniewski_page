import { notFound } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import PageRenderer from '@/components/PageRenderer';
import { Metadata } from 'next';
import { PageSection } from '@/components/admin/PageBuilder';

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function getPage(slug: string) {
    const page = await prisma.page.findUnique({
        where: { slug, is_published: true },
    });
    return page;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const page = await getPage(slug);

    if (!page) {
        return {
            title: 'Strona nie znaleziona',
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

export default async function DynamicPage({ params }: PageProps) {
    const { slug } = await params;
    const page = await getPage(slug);

    if (!page) {
        notFound();
    }

    // Intelligent Content Merging Strategy (Zero Loss Protocol)
    let sections: PageSection[] = [];

    // 1. Try to parse dynamic sections
    if (page.sections) {
        try {
            sections = JSON.parse(page.sections);
        } catch (e) {
            console.error('Failed to parse sections', e);
        }
    }

    // 2. Fallback Safety: If no sections found (or empty), check for legacy content
    // and inject it as a rich_text section to prevent empty page.
    if ((!sections || sections.length === 0) && page.content) {
        sections = [
            {
                id: 'legacy_content_fallback',
                type: 'rich_text',
                data: {
                    content: page.content
                }
            }
        ];
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white selection:bg-gold-400 selection:text-black">
            <PageRenderer sections={sections} />
        </main>
    );
}
