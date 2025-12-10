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

    // Parse sections JSON
    let sections: PageSection[] = [];
    if (page.sections) {
        try {
            sections = JSON.parse(page.sections);
        } catch (e) {
            console.error('Failed to parse sections', e);
        }
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white selection:bg-gold-400 selection:text-black">
            {/* If no sections defined, show legacy content or fallback */}
            {sections.length > 0 ? (
                <PageRenderer sections={sections} />
            ) : (
                <div className="pt-32 pb-16 px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
                    <div
                        className="prose prose-invert mx-auto"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                </div>
            )}
        </main>
    );
}
