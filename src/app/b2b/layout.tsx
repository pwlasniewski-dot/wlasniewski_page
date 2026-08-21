import type { Metadata, Viewport } from 'next';
import { AERO_SITE } from '@/lib/aeroanaliza/content';

export const metadata: Metadata = {
    metadataBase: new URL(AERO_SITE.url),
    title: { default: 'Aero Analiza — termowizja i inspekcje dronem', template: '%s | Aero Analiza' },
    description: 'Termowizja, inspekcje dachów i fotowoltaiki oraz monitoring inwestycji dronem w województwie kujawsko-pomorskim.',
    keywords: ['termowizja dronem', 'inspekcja dachu dronem', 'inspekcja fotowoltaiki dronem', 'monitoring inwestycji dronem', 'kujawsko-pomorskie'],
    applicationName: AERO_SITE.name,
    authors: [{ name: 'Przemysław Właśniewski' }],
    creator: 'Przemysław Właśniewski',
    publisher: AERO_SITE.legalName,
    manifest: '/aeroanaliza.webmanifest',
    icons: { icon: '/aeroanaliza-icon.svg', shortcut: '/aeroanaliza-icon.svg', apple: '/aeroanaliza-icon.svg' },
    openGraph: {
        type: 'website',
        locale: 'pl_PL',
        url: AERO_SITE.url,
        siteName: AERO_SITE.name,
        title: 'Aero Analiza — termowizja i inspekcje dronem',
        description: 'Termowizja, inspekcje i monitoring inwestycji dronem w województwie kujawsko-pomorskim.',
        images: [{ url: '/assets/drone/drone-home.webp', alt: 'Dron wykorzystywany do inspekcji Aero Analiza' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Aero Analiza — termowizja i inspekcje dronem',
        description: 'Termowizja, inspekcje i monitoring inwestycji dronem w województwie kujawsko-pomorskim.',
        images: ['/assets/drone/drone-home.webp'],
    },
    appleWebApp: { capable: true, title: AERO_SITE.name, statusBarStyle: 'black-translucent' },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
    category: 'professional-services',
};

export const viewport: Viewport = { themeColor: '#ffffff', colorScheme: 'light' };

export default function AeroLayout({ children }: { children: React.ReactNode }) {
    const schema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': ['LocalBusiness', 'ProfessionalService'],
                '@id': `${AERO_SITE.url}/#business`,
                name: AERO_SITE.name,
                legalName: AERO_SITE.legalName,
                url: AERO_SITE.url,
                email: AERO_SITE.email,
                telephone: AERO_SITE.phoneHref,
                logo: `${AERO_SITE.url}/aeroanaliza-icon.svg`,
                image: `${AERO_SITE.url}/assets/drone/drone-home.webp`,
                description: 'Termowizja i dokumentacja RGB dachów, instalacji fotowoltaicznych, obiektów oraz postępów inwestycji z użyciem drona DJI Mavic 3 Thermal.',
                address: { '@type': 'PostalAddress', addressLocality: AERO_SITE.locality, addressRegion: 'kujawsko-pomorskie', addressCountry: 'PL' },
                areaServed: { '@type': 'AdministrativeArea', name: 'województwo kujawsko-pomorskie' },
                founder: { '@type': 'Person', name: 'Przemysław Właśniewski' },
            },
            {
                '@type': 'WebSite',
                '@id': `${AERO_SITE.url}/#website`,
                url: AERO_SITE.url,
                name: AERO_SITE.name,
                inLanguage: 'pl-PL',
                publisher: { '@id': `${AERO_SITE.url}/#business` },
            },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
            {children}
        </>
    );
}
