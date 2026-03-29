import { notFound } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import PageRenderer from '@/components/PageRenderer';
import { Metadata } from 'next';
import { PageSection } from '@/components/admin/PageBuilder';

async function getB2BPage() {
    try {
        // Try to find a page specifically named/slugged as b2b
        const page = await prisma.page.findFirst({
            where: {
                slug: { in: ['b2b', 'strona-b2b', 'oferta-b2b'] },
                is_published: true
            },
            orderBy: { updated_at: 'desc' },
            // Add a short timeout to prevent long hangs if DB is unreachable
            // Note: Prisma doesn't have a direct query timeout in findFirst without middleware, 
            // but we can wrap it in a Promise.race if needed. 
            // For now, simple try/catch handles the final rejection.
        });
        return page;
    } catch (error) {
        console.error('CRITICAL: B2B Database connection failed in getB2BPage:', error);
        return null; // Let the page use its internal hardcoded fallback
    }
}

export async function generateMetadata(): Promise<Metadata> {
    let page = null;
    try {
        page = await getB2BPage();
    } catch (e) {
        console.error('Metadata generation failed due to DB error', e);
    }

    if (!page) {
        return {
            title: 'FOTO-DRON | Inspekcje Dronem, Termowizja, Monitoring w Toruniu',
            description: 'Profesjonalne usługi dronowe dla przemysłu, rolnictwa i deweloperów. Mavic 3 Thermal. Licencjonowany operator UAVO.',
            alternates: {
                canonical: 'https://aeroanaliza.pl',
            },
            openGraph: {
                title: 'FOTO-DRON | Usługi Dronem dla Biznesu',
                description: 'Inspekcje termowizyjne, ortofotomapy, monitoring inwestycji. Sprawdź ofertę B2B.',
                url: 'https://aeroanaliza.pl',
                images: ['/assets/b2b/hero-drone.jpg']
            }
        };
    }

    return {
        title: page.meta_title || page.title,
        description: page.meta_description,
        alternates: {
            canonical: 'https://aeroanaliza.pl',
        },
    };
}

export default async function B2BPage() {
    const page = await getB2BPage();

    let sections: PageSection[] = [];

    if (page?.sections) {
        try {
            sections = JSON.parse(page.sections);
        } catch (e) {
            console.error('Failed to parse B2B sections', e);
        }
    }

    // --- B2B "HARDCODED" PREMIUM CONTENT (IF NO DB ENTRY/FALLBACK) ---
    // User requested "full cleaning" of B2C stuff, so we provide a rich B2B structure here.
    if (sections.length === 0) {
        sections = [
            // 1. HERO SECTION - Industrial/Dark
            {
                id: 'b2b-hero',
                type: 'hero',
                title: 'Wnieś Swój Biznes <span class="text-gold-500">Na Wyższy Poziom</span>',
                subtitle: 'Precyzyjne inspekcje techniczne, termowizja i monitoring inwestycji z lotu ptaka. Technologia, która oszczędza Twój czas i pieniądze.',
                image: 'https://images.unsplash.com/photo-1506947411487-a5673826e6e0?q=80&w=2000&auto=format&fit=crop',
                buttonText: 'ZAPYTAJ O OFERTĘ',
                buttonLink: '/b2b/kontakt',
            } as PageSection,
            // 2. STATS - Credibility
            {
                id: 'b2b-stats',
                type: 'b2b_stats',
                b2b_stats: [
                    { id: 's1', value: '4K', label: 'Rozdzielczość Video', prefix: '', suffix: '' },
                    { id: 's2', value: '50+', label: 'Zbadanych Dachów', prefix: '', suffix: '' },
                    { id: 's3', value: '100%', label: 'Zgodności z ULC', prefix: '', suffix: '' }
                ]
            } as PageSection,
            // 3. OFFER GRID - "Co robimy"
            {
                id: 'b2b-offer',
                type: 'features',
                title: 'Specjalistyczne Usługi Dronem',
                subtitle: 'Dostarczamy dane krytyczne dla Twojej branży.',
                items: [
                    {
                        id: 'f1',
                        title: 'Inspekcje Termowizyjne',
                        text: 'Wykrywanie mostków cieplnych, awarii paneli PV i wycieków ciepła za pomocą kamery Mavic 3 Thermal.',
                        icon: 'thermometer'
                    },
                    {
                        id: 'f2',
                        title: 'Monitoring Inwestycji',
                        text: 'Regularna dokumentacja postępów budowy z tej samej perspektywy (Timelapse). Raporty dla inwestorów.',
                        icon: 'building'
                    },
                    {
                        id: 'f3',
                        title: 'Inspekcje Dachów i Infrastruktury',
                        text: 'Bezpieczna ocena stanu technicznego bez konieczności wchodzenia na wysokość. Zdjęcia wysokiej rozdzielczości.',
                        icon: 'shield'
                    },
                    {
                        id: 'f4',
                        title: 'Rolnictwo Precyzyjne',
                        text: 'Szacowanie szkód łowieckich, analiza stanu upraw i mapowanie terenu.',
                        icon: 'leaf'
                    }
                ]
            } as PageSection,
            // 4. PARALLAX BREAK - "Technologia"
            {
                id: 'b2b-tech',
                type: 'parallax',
                image: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=2000&auto=format&fit=crop',
                title: 'Flota: DJI Mavic 3 Thermal',
                content: 'Korzystamy z najnowocześniejszego sprzętu wyposażonego w kamery termowizyjne 640x512px oraz szerokokątne kamery 48MP. Gwarancja precyzji co do centymetra.',
            } as PageSection,
            // 5. CALL TO ACTION - Bottom
            {
                id: 'b2b-cta',
                type: 'info_band',
                title: 'Gotowy na współpracę?',
                subtitle: 'Skontaktuj się z nami, aby omówić szczegóły Twojego projektu. Wycena jest zawsze darmowa.',
                link: '/b2b/kontakt'
            } as PageSection
        ];
    }

    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-gold-500 selection:text-black">
            <PageRenderer sections={sections} />
        </main>
    );
}
