import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PageRenderer from '@/components/PageRenderer';
import { AeroStructuredData } from '@/components/aero/AeroStructuredData';
import { AERO_SITE, applyAeroCmsToDefinition, getAeroPageDefinition, mergeAeroPageSections } from '@/lib/aeroanaliza/content';
import { loadAeroCmsPage } from '@/lib/aeroanaliza/server';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const definition = getAeroPageDefinition(slug);
    if (!definition) return { title: 'Strona nie istnieje', robots: { index: false, follow: false } };
    const { page, status } = await loadAeroCmsPage(slug);
    if (status === 'unpublished') return { title: 'Strona niedostępna', robots: { index: false, follow: false } };
    const url = `${AERO_SITE.url}/${slug}`;
    const title = page?.meta_title || definition.title;
    const description = page?.meta_description || definition.description;
    return {
        title, description, keywords: page?.meta_keywords || definition.keywords,
        alternates: { canonical: url },
        openGraph: { type: 'website', locale: 'pl_PL', siteName: AERO_SITE.name, url, title, description, images: [{ url: page?.hero_image || '/assets/drone/drone-home.webp', alt: `${definition.serviceName || definition.title} — Aero Analiza` }] },
        twitter: { card: 'summary_large_image', title, description, images: [page?.hero_image || '/assets/drone/drone-home.webp'] },
    };
}

export default async function AeroServicePage({ params }: PageProps) {
    const { slug } = await params;
    const definition = getAeroPageDefinition(slug);
    if (!definition) notFound();
    const { page, sections: cmsSections, status } = await loadAeroCmsPage(slug);
    if (status === 'unpublished') notFound();
    const sections = mergeAeroPageSections(definition, cmsSections);
    const effectiveDefinition = applyAeroCmsToDefinition(definition, page, sections);
    return (
        <main className="min-h-screen bg-[#07100f] text-zinc-200 selection:bg-emerald-300 selection:text-[#07100f]">
            <AeroStructuredData page={effectiveDefinition} />
            <PageRenderer sections={sections} />
        </main>
    );
}
