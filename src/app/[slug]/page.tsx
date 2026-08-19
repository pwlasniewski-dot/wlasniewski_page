import { notFound, permanentRedirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import PageRenderer from '@/components/PageRenderer';
import { Metadata } from 'next';
import Link from 'next/link';
import { PageSection } from '@/components/admin/PageBuilder';
import CityLandingPage, { generateMetadata as cityGenerateMetadata } from '@/app/fotograf-[city]/page';
import { b2bPublicPath, isB2bCmsPage } from '@/lib/sites/b2b-routing';
import { findActivePublicPackages } from '@/lib/publicPackagePricing';
import { getServiceGrowthConfig, type ServiceGrowthConfig } from '@/lib/serviceGrowth';

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ city?: string | string[] }>;
}

const LOCAL_CITY_LINKS = [
    { city: 'Toruń', href: '/fotograf-torun' },
    { city: 'Grudziądz', href: '/fotograf-grudziadz' },
    { city: 'Chełmno', href: '/fotograf-chelmno' },
    { city: 'Wąbrzeźno', href: '/fotograf-wabrzezno' },
    { city: 'Świecie', href: '/fotograf-swiecie' },
];

type GrowthPackage = {
    id: number;
    name: string;
    hours: number;
    price: number;
    subtitle: string | null;
};

const GROWTH_CITIES = new Set(['Toruń', 'Grudziądz', 'Wąbrzeźno', 'Chełmno', 'Świecie']);

function safeGrowthCity(value: string | string[] | undefined) {
    const city = Array.isArray(value) ? value[0] : value;
    return city && GROWTH_CITIES.has(city) ? city : null;
}

function bookingHref(config: ServiceGrowthConfig, source: string, city?: string | null) {
    const params = new URLSearchParams({ source, service: config.bookingService });
    if (city) params.set('city', city);
    return `/rezerwacja?${params.toString()}`;
}

function formatPrice(priceInCents: number) {
    return `${new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(priceInCents / 100)} zł`;
}

function ServiceGrowthOffer({
    config,
    packages,
    editorial,
    city,
}: {
    config: ServiceGrowthConfig;
    packages: GrowthPackage[];
    editorial: boolean;
    city?: string | null;
}) {
    const sectionClass = editorial
        ? 'border-t border-[#d5cabd] bg-[#ebe4da] px-6 py-16 text-[#2b251f]'
        : 'border-t border-white/10 bg-zinc-900 px-6 py-16 text-white';
    const cardClass = editorial
        ? 'border-[#d5cabd] bg-[#f8f5f0] text-[#2b251f]'
        : 'border-white/10 bg-zinc-950 text-white';
    const mutedClass = editorial ? 'text-[#686057]' : 'text-zinc-300';

    return (
        <section className={sectionClass} aria-labelledby={`${config.slug}-packages-heading`}>
            <div className="mx-auto max-w-6xl">
                <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                    <div>
                        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${editorial ? 'text-[#8a7048]' : 'text-gold-400'}`}>
                            Zakres i cena
                        </p>
                        <h2 id={`${config.slug}-packages-heading`} className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
                            Wybierz pakiet i sprawdź termin
                        </h2>
                        <p className={`mt-5 max-w-xl leading-relaxed ${mutedClass}`}>{config.packageSummary}</p>
                        <p className={`mt-4 text-sm leading-relaxed ${mutedClass}`}>
                            {city
                                ? `Wybrane miasto: ${city}. Pozostałe szczegóły spotkania podasz podczas rezerwacji.`
                                : 'Pracuję w Toruniu, Grudziądzu, Wąbrzeźnie, Chełmnie i Świeciu. Miasto oraz szczegóły spotkania podasz podczas rezerwacji.'}
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={bookingHref(config, config.slug, city)}
                                className={editorial
                                    ? 'inline-flex items-center justify-center rounded-full bg-[#2b251f] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4a4036]'
                                    : 'inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-gold-400'}
                            >
                                {config.bookingLabel}
                            </Link>
                            <Link
                                href="/kontakt"
                                className={editorial
                                    ? 'inline-flex items-center justify-center rounded-full border border-[#a99b89] px-7 py-3.5 text-sm font-semibold transition hover:border-[#2b251f]'
                                    : 'inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold transition hover:border-white'}
                            >
                                Zapytaj o inny zakres
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {packages.length > 0 ? packages.slice(0, 3).map((item) => (
                            <Link
                                key={item.id}
                                href={bookingHref(config, `${config.slug}-package`, city)}
                                className={`group flex min-h-48 flex-col rounded-2xl border p-6 transition hover:-translate-y-0.5 ${cardClass}`}
                            >
                                <h3 className="text-xl font-semibold">{item.name}</h3>
                                <p className={`mt-3 text-sm ${mutedClass}`}>
                                    {item.hours === 1 ? '1 godzina fotografowania' : `${item.hours} godziny fotografowania`}
                                </p>
                                {item.subtitle && <p className={`mt-2 text-sm leading-relaxed ${mutedClass}`}>{item.subtitle}</p>}
                                <div className="mt-auto flex items-end justify-between gap-3 pt-7">
                                    <span className="text-lg font-semibold">{formatPrice(item.price)}</span>
                                    <span className="transition group-hover:translate-x-1" aria-hidden="true">→</span>
                                </div>
                            </Link>
                        )) : (
                            <div className={`rounded-2xl border p-6 md:col-span-3 ${cardClass}`}>
                                <p className="font-semibold">Aktualne pakiety i ceny są dostępne w rezerwacji.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

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
    const growthConfig = getServiceGrowthConfig(slug);

    if (!page) {
        // Delegate to city landing metadata if this is a fotograf-{city} URL
    if (slug.startsWith('fotograf-')) {
        return cityGenerateMetadata({ params: Promise.resolve({ city: slug.replace('fotograf-', '') }) });
    }

    if (isB2bCmsPage(page)) {
        const canonical = `https://aeroanaliza.pl${b2bPublicPath(page.slug)}`;
        return {
            title: page.meta_title || page.title,
            description: page.meta_description,
            keywords: page.meta_keywords,
            alternates: { canonical },
            openGraph: {
                title: page.meta_title || page.title,
                description: page.meta_description || '',
                type: 'website',
                url: canonical,
                images: page.hero_image ? [page.hero_image] : [],
            },
        };
    }
        return {
            title: 'Strona nie znaleziona',
        };
    }

    // City landing pages use rich metadata from the CityLandingPage component
    if (page.page_type === 'city_landing') {
        return cityGenerateMetadata({ params: Promise.resolve({ city: slug.replace('fotograf-', '') }) });
    }

    if (growthConfig) {
        const canonical = `https://wlasniewski.pl/${slug}`;
        return {
            title: growthConfig.metaTitle,
            description: growthConfig.metaDescription,
            alternates: { canonical },
            openGraph: {
                title: growthConfig.metaTitle,
                description: growthConfig.metaDescription,
                type: 'website',
                url: canonical,
                images: page.hero_image ? [page.hero_image] : [],
            },
        };
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

export default async function DynamicPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const page = await getPage(slug);
    const growthConfig = getServiceGrowthConfig(slug);
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const growthCity = safeGrowthCity(resolvedSearchParams?.city);

    if (!page) {
        // Delegate to city landing page if this is a fotograf-{city} URL
        if (slug.startsWith('fotograf-')) {
            return CityLandingPage({ params: Promise.resolve({ city: slug.replace('fotograf-', '') }) });
        }
        notFound();
    }

    // City landing keeps its bespoke editorial layout, while media sections
    // configured in Admin (gallery / parallax) are passed through to the template.
    if (page!.page_type === 'city_landing') {
        let citySections: PageSection[] = [];
        if (page!.sections) {
            try {
                citySections = JSON.parse(page!.sections);
            } catch (error) {
                console.error('Failed to parse city landing sections', error);
            }
        }

        return CityLandingPage({
            params: Promise.resolve({ city: slug.replace('fotograf-', '') }),
            sections: citySections,
        });
    }

    // Redirect B2B pages to their proper path
    if (isB2bCmsPage(page!)) {
        permanentRedirect(`https://aeroanaliza.pl${b2bPublicPath(page!.slug)}`);
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

    const hasVisiblePrimaryHeading = sections.some((section) => {
        const sectionData = section.data && typeof section.data === 'object' ? section.data : section;
        return sectionData.isPrimaryHeading === true;
    });
    const isEditorialService = ['sesja', 'sesja-rodzinna'].includes(page!.slug.toLowerCase()) || sections.some((section) => {
        const sectionData = section.data && typeof section.data === 'object' ? section.data : section;
        return sectionData.pageStyle === 'editorial';
    });
    const serviceLabel = getServiceLabelBySlug(page!.slug);
    const localCoverageLabel = LOCAL_CITY_LINKS.map(l => l.city).join(', ');
    let growthPackages: GrowthPackage[] = [];
    if (growthConfig) {
        try {
            growthPackages = (await findActivePublicPackages({ serviceName: growthConfig.bookingService })).map((item) => ({
                id: item.id,
                name: item.name,
                hours: item.hours,
                price: item.price,
                subtitle: item.subtitle,
            }));
        } catch (error) {
            console.warn(`[service-growth] Packages unavailable for ${slug}`, error);
        }
    }

    return (
        <main className={isEditorialService ? 'min-h-screen bg-[#f3efe8] text-[#2b251f] selection:bg-[#c9ad74] selection:text-[#2b251f]' : 'min-h-screen bg-zinc-950 text-white selection:bg-gold-400 selection:text-black'}>
            {/* Fallback H1 keeps legacy pages semantic; SEO templates provide a visible H1 themselves. */}
            {!hasVisiblePrimaryHeading && growthConfig ? (
                <section className={isEditorialService ? 'border-b border-[#d5cabd] bg-[#f3efe8] px-6 py-16 md:py-24' : 'border-b border-white/10 bg-zinc-950 px-6 py-16 md:py-24'}>
                    <div className="mx-auto max-w-5xl">
                        <p className={isEditorialService ? 'text-xs font-semibold uppercase tracking-[0.28em] text-[#8a7048]' : 'text-xs font-semibold uppercase tracking-[0.28em] text-gold-400'}>
                            {growthConfig.eyebrow}
                        </p>
                        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">{growthConfig.h1}</h1>
                        <p className={isEditorialService ? 'mt-7 max-w-3xl text-lg leading-relaxed text-[#686057]' : 'mt-7 max-w-3xl text-lg leading-relaxed text-zinc-300'}>
                            {growthConfig.intro}
                        </p>
                        <Link
                            href={bookingHref(growthConfig, `${growthConfig.slug}-hero`, growthCity)}
                            className={isEditorialService
                                ? 'mt-8 inline-flex rounded-full bg-[#2b251f] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4a4036]'
                                : 'mt-8 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-gold-400'}
                        >
                            {growthConfig.bookingLabel}
                        </Link>
                    </div>
                </section>
            ) : !hasVisiblePrimaryHeading ? <h1 className="sr-only">{page.title}</h1> : null}
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

            {growthConfig && (
                <ServiceGrowthOffer config={growthConfig} packages={growthPackages} editorial={isEditorialService} city={growthCity} />
            )}

            {/* Local SEO reinforcement block for service intent + city coverage */}
            <section className={isEditorialService ? 'border-t border-[#d5cabd] bg-[#f3efe8] py-14 px-6 text-[#2b251f]' : 'border-t border-white/5 bg-zinc-950 py-14 px-6'}>
                <div className="mx-auto max-w-5xl">
                    <h2 className={`text-2xl md:text-3xl font-bold mb-5 ${isEditorialService ? 'text-[#2b251f]' : 'text-white'}`}>
                        {serviceLabel} — {localCoverageLabel} i okolice
                    </h2>
                    <p className={`${isEditorialService ? 'text-[#686057]' : 'text-zinc-300'} leading-relaxed mb-6`}>
                        Realizuję usługi jako {serviceLabel} na terenie: {localCoverageLabel}.
                        Przed rezerwacją zobaczysz zakres, cenę i dostępne terminy. Jeśli potrzebujesz innego wariantu, napisz do mnie przed wpłatą.
                    </p>

                    <h3 className={`text-lg md:text-xl font-semibold mb-3 ${isEditorialService ? 'text-[#a16f25]' : 'text-gold-400'}`}>
                        Lokalnie: sprawdź dedykowane strony miast
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {LOCAL_CITY_LINKS.map((item) => (
                            <li key={item.href}>
                                <a
                                    href={item.href}
                                    className={isEditorialService ? 'block rounded-lg border border-[#d5cabd] px-4 py-3 text-[#494139] hover:bg-white/70 hover:border-[#a16f25] transition' : 'block rounded-lg border border-white/10 px-4 py-3 text-zinc-200 hover:text-white hover:border-gold-400/50 transition'}
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
