import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';
import prisma from '@/lib/db/prisma';
import PageRenderer from '@/components/PageRenderer';
import { Metadata } from 'next';
import Link from 'next/link';
import { PageSection } from '@/components/admin/PageBuilder';
import CityLandingPage, { generateMetadata as cityGenerateMetadata } from '@/app/fotograf-[city]/page';
import { b2bPublicPath, isB2bCmsPage } from '@/lib/sites/b2b-routing';
import { findActivePublicPackages } from '@/lib/publicPackagePricing';
import { getServiceGrowthConfig, type ServiceGrowthConfig } from '@/lib/serviceGrowth';
import CityLeadForm from '@/components/CityLeadForm';
import { loadPhotoFunnelConfig } from '@/lib/marketing/photo-funnel.server';
import type { PhotoFunnelConfig } from '@/lib/marketing/photo-funnel';

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

function bookingHref(config: ServiceGrowthConfig, source: string, city?: string | null, packageId?: number) {
    const params = new URLSearchParams({ source, service: config.bookingService });
    if (city) params.set('city', city);
    if (packageId) params.set('package_id', String(packageId));
    return `/rezerwacja?${params.toString()}`;
}

function inquiryHref(config: ServiceGrowthConfig, source: string, city?: string | null, packageId?: number) {
    const params = new URLSearchParams({ source, service: config.bookingService });
    if (city) params.set('city', city);
    if (packageId) params.set('package_slug', `package-${packageId}`);
    return `?${params.toString()}#szybki-kontakt`;
}

function formatPrice(priceInCents: number) {
    return `${new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(priceInCents / 100)} zł`;
}

function ServiceGrowthOffer({
    config,
    packages,
    editorial,
    city,
    funnelConfig,
}: {
    config: ServiceGrowthConfig;
    packages: GrowthPackage[];
    editorial: boolean;
    city?: string | null;
    funnelConfig: PhotoFunnelConfig;
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
                                data-analytics="photo-cta-booking-offer"
                                className={editorial
                                    ? 'inline-flex items-center justify-center rounded-full bg-[#2b251f] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4a4036]'
                                    : 'inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-gold-400'}
                            >
                                {funnelConfig.copy.packageBookingCtaLabel}
                            </Link>
                            {funnelConfig.display.showOfferInquiryCta && (
                                <Link
                                    href={inquiryHref(config, `${config.slug}-offer-inquiry`, city)}
                                    data-analytics="photo-cta-inquiry-offer"
                                    className={editorial
                                        ? 'inline-flex items-center justify-center rounded-full border border-[#a99b89] px-7 py-3.5 text-sm font-semibold transition hover:border-[#2b251f]'
                                        : 'inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold transition hover:border-white'}
                                >
                                    {funnelConfig.copy.inquiryCtaLabel}
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {packages.length > 0 ? packages.slice(0, 3).map((item) => (
                            <article
                                key={item.id}
                                className={`flex min-h-56 flex-col rounded-2xl border p-6 ${cardClass}`}
                            >
                                <h3 className="text-xl font-semibold">{item.name}</h3>
                                <p className={`mt-3 text-sm ${mutedClass}`}>
                                    {item.hours === 1 ? '1 godzina fotografowania' : `${item.hours} godziny fotografowania`}
                                </p>
                                {item.subtitle && <p className={`mt-2 text-sm leading-relaxed ${mutedClass}`}>{item.subtitle}</p>}
                                <div className="mt-auto pt-7">
                                    <span className="text-lg font-semibold">{formatPrice(item.price)}</span>
                                    <div className="mt-5 grid gap-2">
                                        <Link
                                            href={bookingHref(config, `${config.slug}-package`, city, item.id)}
                                            data-analytics="photo-cta-booking-package"
                                            className={editorial
                                                ? 'inline-flex items-center justify-center rounded-full bg-[#2b251f] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#4a4036]'
                                                : 'inline-flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-gold-400'}
                                        >
                                            {funnelConfig.copy.packageBookingCtaLabel}
                                        </Link>
                                        {funnelConfig.display.showPackageInquiryCta && (
                                            <Link
                                                href={inquiryHref(config, `${config.slug}-package-inquiry`, city, item.id)}
                                                data-analytics="photo-cta-inquiry-package"
                                                className={editorial
                                                    ? 'inline-flex items-center justify-center rounded-full border border-[#a99b89] px-4 py-2.5 text-center text-xs font-semibold transition hover:border-[#2b251f]'
                                                    : 'inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2.5 text-center text-xs font-semibold transition hover:border-white'}
                                            >
                                                {funnelConfig.copy.packageInquiryCtaLabel}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </article>
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

function ServiceInquirySection({
    growthConfig,
    city,
    funnelConfig,
}: {
    growthConfig: ServiceGrowthConfig;
    city?: string | null;
    funnelConfig: PhotoFunnelConfig;
}) {
    return (
        <section id="szybki-kontakt" className="scroll-mt-24 border-t border-white/10 bg-zinc-950 px-6 py-16 text-white md:py-20">
            <div className="mx-auto max-w-5xl">
                <div className="mx-auto mb-9 max-w-3xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-400">{funnelConfig.copy.serviceEyebrow}</p>
                    <h2 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">{funnelConfig.copy.serviceTitle}</h2>
                    <p className="mt-4 leading-relaxed text-zinc-300">{funnelConfig.copy.serviceDescription}</p>
                </div>
                <Suspense fallback={<div className="min-h-96 rounded-2xl border border-white/10 bg-zinc-900/70" aria-label="Ładowanie formularza" />}>
                    <CityLeadForm
                        city={city || ''}
                        initialService={growthConfig.bookingService}
                        source={`${growthConfig.slug}-soft-inquiry`}
                        showCityField={!city}
                        funnelConfig={funnelConfig}
                    />
                </Suspense>
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
        return {
            title: 'Strona nie znaleziona',
        };
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

    // City landing pages use rich metadata from the CityLandingPage component
    if (page.page_type === 'city_landing') {
        return cityGenerateMetadata({ params: Promise.resolve({ city: slug.replace('fotograf-', '') }) });
    }

    if (growthConfig) {
        const canonical = `https://wlasniewski.pl/${slug}`;
        let minimumPrice: number | null = null;
        try {
            const packages = await findActivePublicPackages({ serviceName: growthConfig.bookingService });
            minimumPrice = packages.length > 0 ? Math.min(...packages.map(pkg => pkg.price)) : null;
        } catch (error) {
            console.warn(`[service-growth] Metadata price unavailable for ${slug}`, error);
        }
        const priceSuffix = minimumPrice ? ` od ${formatPrice(minimumPrice)}` : ' i terminy';
        const metaTitle = `${growthConfig.metaTitle}${priceSuffix}`;
        const metaDescription = minimumPrice
            ? `${growthConfig.metaDescription} Aktywne pakiety od ${formatPrice(minimumPrice)}.`
            : growthConfig.metaDescription;
        return {
            title: metaTitle,
            description: metaDescription,
            alternates: { canonical },
            openGraph: {
                title: metaTitle,
                description: metaDescription,
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
    const photoFunnelConfig = growthConfig ? await loadPhotoFunnelConfig() : null;

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
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={bookingHref(growthConfig, `${growthConfig.slug}-hero`, growthCity)}
                                data-analytics="photo-cta-booking-hero"
                                className={isEditorialService
                                    ? 'inline-flex items-center justify-center rounded-full bg-[#2b251f] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4a4036]'
                                    : 'inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-gold-400'}
                            >
                                {photoFunnelConfig!.copy.packageBookingCtaLabel}
                            </Link>
                            {photoFunnelConfig?.display.showHeroInquiryCta && (
                                <Link
                                    href={inquiryHref(growthConfig, `${growthConfig.slug}-hero-inquiry`, growthCity)}
                                    data-analytics="photo-cta-inquiry-hero"
                                    className={isEditorialService
                                        ? 'inline-flex items-center justify-center rounded-full border border-[#a99b89] px-7 py-3.5 text-sm font-semibold transition hover:border-[#2b251f]'
                                        : 'inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold transition hover:border-white'}
                                >
                                    {photoFunnelConfig.copy.inquiryCtaLabel}
                                </Link>
                            )}
                        </div>
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
                        ...(growthPackages.length > 0 ? {
                            offers: growthPackages.map((pkg) => ({
                                '@type': 'Offer',
                                name: pkg.name,
                                price: (pkg.price / 100).toFixed(2),
                                priceCurrency: 'PLN',
                                availability: 'https://schema.org/InStock',
                                url: `https://wlasniewski.pl/rezerwacja?service=${encodeURIComponent(growthConfig?.bookingService || serviceLabel)}&package_id=${pkg.id}`,
                            })),
                        } : {}),
                    }),
                }}
            />
            <PageRenderer sections={sections} />

            {growthConfig && photoFunnelConfig?.display.serviceModuleEnabled && photoFunnelConfig.display.servicePosition === 'before_packages' && (
                <ServiceInquirySection growthConfig={growthConfig} city={growthCity} funnelConfig={photoFunnelConfig} />
            )}

            {growthConfig && photoFunnelConfig && (
                <ServiceGrowthOffer config={growthConfig} packages={growthPackages} editorial={isEditorialService} city={growthCity} funnelConfig={photoFunnelConfig} />
            )}

            {growthConfig && photoFunnelConfig?.display.serviceModuleEnabled && photoFunnelConfig.display.servicePosition === 'after_packages' && (
                <ServiceInquirySection growthConfig={growthConfig} city={growthCity} funnelConfig={photoFunnelConfig} />
            )}

            {growthConfig?.slug === 'slub' && (
                <section className={isEditorialService ? 'border-t border-[#d5cabd] bg-[#28221c] px-6 py-14 text-white' : 'border-t border-white/10 bg-zinc-900 px-6 py-14 text-white'}>
                    <div className="mx-auto flex max-w-5xl flex-col justify-between gap-7 md:flex-row md:items-center">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d4b77c]">Dodatek do reportażu</p>
                            <h2 className="mt-3 text-2xl font-semibold md:text-3xl">Zdjęcia i krótki film z drona +690 zł</h2>
                            <p className="mt-3 max-w-2xl leading-relaxed text-white/65">Miejsce ceremonii, sala i otoczenie pokazane z powietrza — jeśli pogoda, przestrzeń i warunki bezpieczeństwa pozwalają wykonać lot.</p>
                        </div>
                        <Link href="/fotografia-z-drona#slub" className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#d4b77c] bg-[#d4b77c] px-7 py-3.5 text-sm font-semibold text-[#28221c] transition hover:border-white hover:bg-white">Zobacz zakres</Link>
                    </div>
                </section>
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
