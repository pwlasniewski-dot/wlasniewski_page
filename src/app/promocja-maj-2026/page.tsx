/**
 * Landing page: PROMOCJA MAJ 2026
 * - countdown do 31 maja
 * - szybka rezerwacja → /api/inquiries/public z source='promo_maj2026'
 * - JSON-LD Offer
 * - Auto UTM tracking via UtmTracker (mounted globally w layout)
 */
import { Metadata } from 'next';
import PromoMajClient from './PromoMajClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Promocja Maj 2026 — sesja + album GRATIS | Wlasniewski Photography',
    description:
        'Sesje fotograficzne w maju 2026: rodzinne, komunijne, ślubne. Album fotograficzny w prezencie (wartość do 690 zł). Zarezerwuj termin online — ostatnie wolne soboty.',
    openGraph: {
        title: 'Promocja Maj 2026 — sesja + album GRATIS',
        description: 'Album w cenie sesji. Ostatnie wolne terminy w maju 2026. Toruń + 30 km.',
        type: 'website',
    },
    alternates: { canonical: '/promocja-maj-2026' },
};

const offerSchema = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: 'Sesja fotograficzna + album w prezencie — Maj 2026',
    description: 'Sesja rodzinna, komunijna lub urodzinowa z albumem fotograficznym nPhoto w prezencie.',
    price: 690,
    priceCurrency: 'PLN',
    priceValidUntil: '2026-05-31',
    availability: 'https://schema.org/LimitedAvailability',
    url: 'https://wlasniewski.pl/promocja-maj-2026',
    seller: {
        '@type': 'LocalBusiness',
        name: 'Wlasniewski Photography',
        address: { '@type': 'PostalAddress', addressLocality: 'Toruń', addressCountry: 'PL' },
    },
};

export default function PromoMajPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
            />
            <PromoMajClient />
        </>
    );
}
