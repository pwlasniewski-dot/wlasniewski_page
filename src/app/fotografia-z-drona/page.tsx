import type { Metadata } from 'next';
import DronePhotographyLanding from '@/components/DronePhotographyLanding';
import { getCategory } from '@/lib/portfolio';
import { loadDronePhotographyCmsPage } from '@/lib/dronePhotographyCms';
import { droneBookingHref, type DroneFaqModule, type DronePortfolioModule } from '@/lib/dronePhotographyOffer';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const { config, metaTitle, metaDescription, metaKeywords } = await loadDronePhotographyCmsPage();
    return {
        title: metaTitle,
        description: metaDescription,
        keywords: metaKeywords,
        alternates: { canonical: config.seo.canonical },
        openGraph: {
            title: config.seo.ogTitle || metaTitle,
            description: config.seo.ogDescription || metaDescription,
            type: 'website',
            url: config.seo.canonical,
            images: config.seo.ogImage ? [{ url: config.seo.ogImage }] : undefined,
        },
    };
}

export default async function DronePhotographyPage() {
    const { config, metaDescription } = await loadDronePhotographyCmsPage();
    const portfolioModules = config.modules.filter((module): module is DronePortfolioModule => module.type === 'portfolio' && module.enabled && module.source === 'portfolio');
    const categorySlugs = [...new Set(portfolioModules.map(module => module.categorySlug).filter(Boolean))];
    const portfolioByCategory: Record<string, Array<{ src: string; alt: string }>> = {};

    await Promise.all(categorySlugs.map(async categorySlug => {
        try {
            const category = await getCategory(categorySlug);
            portfolioByCategory[categorySlug] = (category?.sessions || []).flatMap(session => {
                const candidates = [session.coverImage, ...(session.highlightedPhotos || [])].filter(Boolean) as string[];
                return candidates.map(src => ({ src, alt: `${session.title} — zdjęcie wykonane z drona` }));
            });
        } catch (error) {
            console.warn(`[drone-photography] Portfolio ${categorySlug} unavailable`, error);
            portfolioByCategory[categorySlug] = [];
        }
    }));

    const activePackages = config.packages.filter(item => item.active !== false);
    const faqItems = config.modules
        .filter((module): module is DroneFaqModule => module.type === 'faq' && module.enabled)
        .flatMap(module => module.items);
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Zdjęcia i filmy z drona',
        description: metaDescription,
        url: config.seo.canonical,
        serviceType: 'Fotografia i filmowanie z drona',
        provider: {
            '@type': 'LocalBusiness',
            name: 'Przemysław Właśniewski — Fotograf',
            url: 'https://wlasniewski.pl',
            telephone: '+48530788694',
            address: { '@type': 'PostalAddress', addressRegion: 'kujawsko-pomorskie', addressCountry: 'PL' },
        },
        areaServed: config.areas.map(name => ({ '@type': 'City', name })),
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Pakiety fotografii z drona',
            itemListElement: activePackages.map(item => ({
                '@type': 'Offer',
                name: item.name,
                price: item.price,
                priceCurrency: 'PLN',
                url: `https://wlasniewski.pl${droneBookingHref(item.slug, 'seo-schema')}`,
            })),
        },
    };
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            {faqItems.length ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
            <DronePhotographyLanding config={config} portfolioByCategory={portfolioByCategory} />
        </>
    );
}
