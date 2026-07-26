import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Karta podarunkowa na sesję fotograficzną | Toruń',
    description: 'Elegancka karta podarunkowa na sesję fotograficzną. Wybierz wartość, dodaj dedykację i zapłać przez PayU. Karta trafia na e-mail po płatności.',
    keywords: [
        'karta podarunkowa sesja fotograficzna',
        'voucher na sesję zdjęciową',
        'prezent sesja fotograficzna Toruń',
        'bon na sesję rodzinną'
    ],
    alternates: {
        canonical: 'https://wlasniewski.pl/karta-podarunkowa',
    },
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        type: 'website',
        title: 'Karta podarunkowa na sesję fotograficzną',
        description: 'Wybierz wartość karty, dodaj dedykację i podaruj bliskiej osobie sesję w wybranym terminie.',
        url: 'https://wlasniewski.pl/karta-podarunkowa',
        images: [{
            url: '/gift-cards/velvet-premium.webp',
            width: 1600,
            height: 1009,
            alt: 'Elegancka karta podarunkowa na sesję fotograficzną'
        }],
    },
};

const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': 'https://wlasniewski.pl/karta-podarunkowa#product',
    name: 'Karta podarunkowa na sesję fotograficzną',
    description: 'Karta o wybranej wartości do wykorzystania na sesję fotograficzną u Przemysława Właśniewskiego.',
    image: 'https://wlasniewski.pl/gift-cards/velvet-premium.webp',
    brand: {
        '@type': 'Brand',
        name: 'Właśniewski Fotografia'
    },
    offers: {
        '@type': 'Offer',
        url: 'https://wlasniewski.pl/karta-podarunkowa',
        priceCurrency: 'PLN',
        price: '750',
        availability: 'https://schema.org/InStock',
        seller: {
            '@id': 'https://wlasniewski.pl/#business'
        }
    }
};

export default function KartaPodarunkowaLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            {children}
        </>
    );
}
