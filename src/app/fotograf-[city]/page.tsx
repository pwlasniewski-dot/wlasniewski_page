import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageRenderer from '@/components/PageRenderer';
import CityLeadSection from '@/components/CityLeadSection';
import type { CmsPublicPackage } from '@/components/sections/CmsOfferSections';
import { loadCachedPhotoFunnelConfig } from '@/lib/marketing/photo-funnel.server';
import { loadCachedPublicPricingSnapshot, findPricedPublicPackages, publicPriceLabel, type PublicMinimumPricesInCents } from '@/lib/publicPackagePricing';
import { loadCityPageState } from '@/lib/seo/city-page';
import { formatPackageDuration, packageScopeLines } from '@/lib/packageScope';
import { hasServerRenderedPrimaryHeading } from '@/lib/seo/page-headings';
import { CITY_SLUGS, cityDefinition, cityFaqItems, citySeoSettings, cityText, parseCitySections, visibleCitySections, type CityPageRecord } from '@/lib/cityLanding';

export function getAllCitySlugs() {
    return CITY_SLUGS.map(slug => slug.replace('fotograf-', ''));
}

export async function generateStaticParams() {
    return getAllCitySlugs().map(city => ({ city }));
}

interface PageProps {
    params: Promise<{ city: string }>;
    page?: CityPageRecord;
}

function cityMetaDescription(data: NonNullable<ReturnType<typeof cityDefinition>>, prices: PublicMinimumPricesInCents) {
    if (!prices.Sesja && !prices['Ślub']) return data.metaDescription;
    return `${data.metaDescription} Sesje rodzinne: ${publicPriceLabel(prices, 'Sesja')}; fotografia ślubna: ${publicPriceLabel(prices, 'Ślub')}.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { city } = await params;
    const data = cityDefinition(city);
    if (!data) notFound();
    const { status, page } = await loadCityPageState(data.slug);
    if (status === 'unpublished') notFound();
    const sections = parseCitySections(page?.sections, data.slug, page);
    const seo = citySeoSettings(sections, data.slug);
    const hero = visibleCitySections(sections).find(section => ['hero', 'hero_parallax', 'image_text'].includes(section.type));
    const prices = (await loadCachedPublicPricingSnapshot()).minimumPrices;
    const metaTitle = page?.meta_title?.trim() || data.metaTitle;
    const metaDescription = page?.meta_description?.trim() || cityMetaDescription(data, prices);
    const image = seo.socialImage?.trim() || hero?.image || page?.hero_image;
    const socialTitle = cityText(seo.socialTitle) || metaTitle;
    const socialDescription = cityText(seo.socialDescription) || metaDescription;
    return {
        title: metaTitle,
        description: metaDescription,
        keywords: page?.meta_keywords?.trim() || undefined,
        alternates: { canonical: seo.canonical },
        openGraph: {
            title: socialTitle,
            description: socialDescription,
            type: 'website', locale: 'pl_PL', url: seo.canonical,
            images: image ? [{ url: image, alt: seo.socialImageAlt || hero?.imageAlt || cityText(hero?.title) }] : [],
        },
        twitter: { card: 'summary_large_image', title: socialTitle, description: socialDescription, images: image ? [image] : [] },
    };
}

function jsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, '\\u003c'); }

export default async function CityLandingPage({ params, page: providedPage }: PageProps) {
    const { city } = await params;
    const data = cityDefinition(city);
    if (!data) notFound();
    const state = providedPage ? { status: 'published', page: providedPage } : await loadCityPageState(data.slug);
    if (state.status === 'unpublished') notFound();
    const page = state.page;
    const sections = parseCitySections(page?.sections, data.slug, page);
    const visible = visibleCitySections(sections);
    const packageServices = new Set(visible.filter(section => section.type === 'public_packages').flatMap(section => section.serviceNames || []));
    let packages: CmsPublicPackage[] = [];
    if (packageServices.size) {
        try {
            packages = (await findPricedPublicPackages()).filter(pkg => packageServices.has(pkg.service.name)).map(pkg => ({
                id: pkg.id, name: pkg.name, subtitle: pkg.subtitle, serviceName: pkg.service.name,
                hours: pkg.hours, price: pkg.price, scopeLines: packageScopeLines(pkg), promotion: pkg.promotion,
            }));
        } catch (error) { console.warn('[city-page] Package catalog unavailable; no default price or scope.', error); }
    }
    const photoFunnelConfig = await loadCachedPhotoFunnelConfig();
    const cityInquiry = photoFunnelConfig.display.cityModuleEnabled ? await CityLeadSection({
        city: data.city, citySlug: city, initialService: 'Sesja', source: 'city-soft-inquiry', funnelConfig: photoFunnelConfig,
    }) : null;
    const faqs = cityFaqItems(sections);
    const seo = citySeoSettings(sections, data.slug);
    const hero = visible.find(section => ['hero', 'hero_parallax'].includes(section.type));
    const title = cityText(hero?.title) || page?.title || data.metaTitle;
    const serviceSchema = {
        '@context': 'https://schema.org', '@type': 'Service',
        name: title, url: seo.canonical,
        description: page?.meta_description?.trim() || data.metaDescription,
        provider: { '@id': 'https://wlasniewski.pl/#business' },
        areaServed: { '@type': 'City', name: data.city },
        offers: packages.map(pkg => ({
            '@type': 'Offer', name: pkg.name, price: pkg.price / 100, priceCurrency: 'PLN',
            url: `https://wlasniewski.pl/rezerwacja?service=${encodeURIComponent(pkg.serviceName)}&package_id=${pkg.id}&city=${encodeURIComponent(data.city)}`,
            description: [formatPackageDuration(pkg.hours), ...pkg.scopeLines].join('. '),
            itemOffered: { '@type': 'Service', name: pkg.serviceName, provider: { '@id': 'https://wlasniewski.pl/#business' } },
        })),
    };
    const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(faq => ({
        '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })) };
    const hasPrimaryHero = hasServerRenderedPrimaryHeading(visible);
    const managedInquiry = sections.some(section => section.type === 'city_inquiry');
    return <main className="min-h-screen bg-[#f4f1eb] text-[#25221f]" data-city-cms={data.slug}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(serviceSchema) }} />
        {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />}
        {!hasPrimaryHero && <header className="mx-auto max-w-6xl px-6 py-14"><h1 className="font-serif text-4xl leading-tight md:text-5xl">{title}</h1></header>}
        <PageRenderer sections={sections} publicPackages={packages} city={data.city} cityInquiry={cityInquiry} />
        {!managedInquiry && cityInquiry}
    </main>;
}
