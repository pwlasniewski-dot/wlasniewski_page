import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import PageRenderer from '@/components/PageRenderer';
import { Metadata } from 'next';
import { PageSection } from '@/components/admin/PageBuilder';
import CityLandingPage, { generateMetadata as cityGenerateMetadata } from '@/app/fotograf-[city]/page';

interface PageProps {
    params: Promise<{ slug: string }>;
}

const LOCAL_CITY_LINKS = [
    { city: 'Toruń', href: '/fotograf-torun' },
    { city: 'Grudziądz', href: '/fotograf-grudziadz' },
    { city: 'Chełmno', href: '/fotograf-chelmno' },
    { city: 'Płużnica', href: '/fotograf-pluznica' },
    { city: 'Wąbrzeźno', href: '/fotograf-wabrzezno' },
];

function getServiceLabelBySlug(slug: string) {
    const lower = slug.toLowerCase();

    if (lower.includes('slub')) return 'fotograf ślubny';
    if (lower.includes('rodzin')) return 'sesja rodzinna';
    if (lower.includes('komuni')) return 'fotograf komunijny';
    if (lower.includes('portret')) return 'sesja portretowa';
    if (lower.includes('biznes') || lower.includes('wizerunk')) return 'fotograf biznesowy';
    if (lower.includes('rezerw')) return 'rezerwacja sesji';

    return 'fotograf';
}

async function getPage(slug: string) {
    const page = await prisma.page.findFirst({
        where: {
            slug: { equals: slug, mode: 'insensitive' },
            is_published: true
        },
    });
    return page;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const page = await getPage(slug);

    if (!page) {
        // Delegate to city landing metadata if this is a fotograf-{city} URL
        if (slug.startsWith('fotograf-')) {
            return cityGenerateMetadata({ params: Promise.resolve({ city: slug.replace('fotograf-', '') }) });
        }
        return {
            title: 'Strona nie znaleziona',
        };
    }

    // City landing pages use rich metadata from the CityLandingPage component
    if (page.page_type === 'city_landing') {
        return cityGenerateMetadata({ params: Promise.resolve({ city: slug.replace('fotograf-', '') }) });
    }

    return {
        title: page.meta_title || page.title,
        description: page.meta_description,
        keywords: page.meta_keywords,
        alternates: {
            canonical: `https://wlasniewski.pl/${slug}`,
        },
        openGraph: {
            title: page.meta_title || page.title,
            description: page.meta_description || '',
            type: 'website',
            url: `https://wlasniewski.pl/${slug}`,
            images: page.hero_image ? [page.hero_image] : [],
        },
    };
}

export default async function DynamicPage({ params }: PageProps) {
    const { slug } = await params;
    const page = await getPage(slug);

    if (!page) {
        // Delegate to city landing page if this is a fotograf-{city} URL
        if (slug.startsWith('fotograf-')) {
            return CityLandingPage({ params: Promise.resolve({ city: slug.replace('fotograf-', '') }) });
        }
        notFound();
    }

    // Delegate city landing pages to the rich CityLandingPage component
    if (page!.page_type === 'city_landing') {
        return CityLandingPage({ params: Promise.resolve({ city: slug.replace('fotograf-', '') }) });
    }

    // Redirect B2B pages to their proper path
    if (page!.page_type === 'b2b') {
        redirect(`/b2b/${page!.slug.toLowerCase()}`);
    }

    const serviceLabel = getServiceLabelBySlug(page!.slug);
    const localCoverageLabel = LOCAL_CITY_LINKS.map(l => l.city).join(', ');

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
            {/* SEO: deterministic SSR <h1>. Always render — even when a section "could" have h1
                (e.g. hero_slider), DB content often has empty titles, leaving page without h1. */}
            <h1 className="sr-only">{page.title}</h1>
            {/* Schema.org Service — gives Google explicit understanding that this is a service page
                offered locally in Toruń, increasing relevance for "fotograf [usługa] toruń" queries. */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Service',
                        name: page.meta_title || page.title,
                        description: page.meta_description || undefined,
                        url: `https://wlasniewski.pl/${slug}`,
                        provider: {
                            '@type': 'LocalBusiness',
                            name: 'Przemysław Właśniewski — Fotografia',
                            url: 'https://wlasniewski.pl',
                            telephone: '+48530788694',
                            address: {
                                '@type': 'PostalAddress',
                                addressLocality: 'Toruń',
                                addressRegion: 'kujawsko-pomorskie',
                                addressCountry: 'PL',
                            },
                        },
                        areaServed: [
                            { '@type': 'City', name: 'Toruń' },
                            { '@type': 'City', name: 'Grudziądz' },
                            { '@type': 'City', name: 'Bydgoszcz' },
                            { '@type': 'City', name: 'Chełmno' },
                            { '@type': 'AdministrativeArea', name: 'województwo kujawsko-pomorskie' },
                        ],
                        image: page.hero_image || undefined,
                    }),
                }}
            />
            <PageRenderer sections={sections} />

            {/* Local SEO reinforcement block for service intent + city coverage */}
            <section className="border-t border-white/5 bg-zinc-950 py-14 px-6">
                <div className="mx-auto max-w-5xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-5">
                        {serviceLabel} — {localCoverageLabel} i okolice
                    </h2>
                    <p className="text-zinc-300 leading-relaxed mb-6">
                        Realizuję usługi jako {serviceLabel} na terenie: {localCoverageLabel}.
                        Pracuję naturalnie, z naciskiem na emocje, światło i autentyczny reportaż.
                    </p>

                    <h3 className="text-lg md:text-xl font-semibold text-gold-400 mb-3">
                        Lokalnie: sprawdź dedykowane strony miast
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {LOCAL_CITY_LINKS.map((item) => (
                            <li key={item.href}>
                                <a
                                    href={item.href}
                                    className="block rounded-lg border border-white/10 px-4 py-3 text-zinc-200 hover:text-white hover:border-gold-400/50 transition"
                                >
                                    {serviceLabel} {item.city}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </main>
    );
}
