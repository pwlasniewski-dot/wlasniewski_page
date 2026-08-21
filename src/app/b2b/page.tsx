import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageRenderer from '@/components/PageRenderer';
import { AeroStructuredData } from '@/components/aero/AeroStructuredData';
import { AERO_SITE, applyAeroCmsToDefinition, getAeroPageDefinition, mergeAeroPageSections } from '@/lib/aeroanaliza/content';
import { loadAeroCmsPage } from '@/lib/aeroanaliza/server';

const definition = getAeroPageDefinition('')!;

export async function generateMetadata(): Promise<Metadata> {
    const { page, status } = await loadAeroCmsPage('');
    if (status === 'unpublished') return { title: 'Strona niedostępna', robots: { index: false, follow: false } };
    return {
        title: page?.meta_title || definition.title,
        description: page?.meta_description || definition.description,
        keywords: page?.meta_keywords || definition.keywords,
        alternates: { canonical: AERO_SITE.url },
        openGraph: {
            type: 'website', locale: 'pl_PL', url: AERO_SITE.url, siteName: AERO_SITE.name,
            title: page?.meta_title || definition.title,
            description: page?.meta_description || definition.description,
            images: [{ url: page?.hero_image || '/assets/drone/drone-home.webp', alt: 'Dron wykorzystywany do inspekcji Aero Analiza' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: page?.meta_title || definition.title,
            description: page?.meta_description || definition.description,
            images: [page?.hero_image || '/assets/drone/drone-home.webp'],
        },
    };
}

export default async function AeroHomePage() {
    const { page, sections: cmsSections, status } = await loadAeroCmsPage('');
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
