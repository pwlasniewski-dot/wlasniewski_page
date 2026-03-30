import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat, Playfair_Display, Lato, Great_Vibes, Cinzel, Inter, Outfit } from "next/font/google";
import prisma from '@/lib/db/prisma'; // Added fonts

// PERFORMANCE: Enable ISR (Incremental Static Regeneration)
// Revalidate every hour instead of on-demand rendering
export const revalidate = 3600;

// ... existing fonts ...

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
});

const lato = Lato({
    subsets: ["latin"],
    variable: "--font-lato",
    weight: ["300", "400", "700"],
    display: "swap",
});

const greatVibes = Great_Vibes({
    subsets: ["latin"],
    variable: "--font-great-vibes",
    weight: ["400"],
    display: "swap",
});

const cinzel = Cinzel({
    subsets: ["latin"],
    variable: "--font-cinzel",
    display: "swap",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
    display: "swap",
});

// REMOVED LOCAL IMPORTS TO FIX BUILD (WEBPACK/SUCRASE ISSUE)

import AppShell from "@/components/AppShell";
import "./globals.css";
import { Suspense } from "react";
import { headers } from "next/headers";
import { AnalyticsTracker } from "@/hooks/useAnalytics";
import AnalyticsLoader from "@/components/AnalyticsLoader";
import FloatingContact from "@/components/FloatingContact";
import SeasonalEffectsWrapper from "@/components/effects/SeasonalEffectsWrapper";
import PhotoCubeIntro from "@/components/PhotoCubeIntro";
import { isB2BContext } from "@/lib/context";

const cormorant = Cormorant_Garamond({
    subsets: ["latin"],
    variable: "--font-display",
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

const montserrat = Montserrat({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

// Full PRO SEO Configuration
const baseMetadata: Metadata = {
    metadataBase: new URL('https://wlasniewski.pl'),
    title: {
        default: 'Przemysław Właśniewski — Fotograf Toruń',
        template: '%s | Przemysław Właśniewski Fotograf'
    },
    description: 'Profesjonalna fotografia rodzinna, ślubna, portretowa i komunijna w Toruniu, Grudziądzu, Chełmnie, Wąbrzeźnie i okolicach. Naturalne sesje plenerowe, galeria online, odbitki premium.',
    keywords: [
        'fotograf toruń',
        'fotograf ślubny toruń',
        'sesja rodzinna toruń',
        'fotografia portretowa toruń',
        'sesja zdjęciowa toruń',
        'fotograf grudziądz',
        'fotograf chełmno',
        'fotograf wąbrzeźno',
        'fotograf bydgoszcz',
        'fotograf świecie',
        'fotograf lisewo',
        'fotograf kujawsko-pomorskie',
        'sesja narzeczeńska toruń',
        'fotografia komunijna toruń',
        'fotografia wizerunkowa toruń',
        'zdjęcia plenerowe toruń',
        'fotograf toruń starówka',
        'FOTO-DRON Przemysław Właśniewski',
        'zdjęcia z drona toruń',
        'Sony A7'
    ],
    authors: [{ name: 'Przemysław Właśniewski' }],
    creator: 'Przemysław Właśniewski',
    publisher: 'Przemysław Właśniewski',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: 'website',
        locale: 'pl_PL',
        url: 'https://wlasniewski.pl',
        siteName: 'Przemysław Właśniewski — Fotograf',
        title: 'Przemysław Właśniewski — Fotograf Toruń',
        description: 'Profesjonalna fotografia rodzinna, ślubna, portretowa i komunijna. Naturalne zdjęcia w Toruniu i okolicach.',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Przemysław Właśniewski — Fotograf',
            }
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Przemysław Właśniewski — Fotograf Toruń',
        description: 'Profesjonalna fotografia rodzinna, ślubna i portretowa w Toruniu.',
        images: ['/og-image.jpg'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: 'https://wlasniewski.pl',
    },
    category: 'photography',
};

export async function generateMetadata(): Promise<Metadata> {
    try {
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' },
            select: { meta_verification_google: true, meta_verification_facebook: true }
        });

        // Clean Google Code - user might paste "google-site-verification=CODE" or just "CODE"
        let googleCode = settings?.meta_verification_google || undefined;
        if (googleCode && googleCode.includes('google-site-verification=')) {
            googleCode = googleCode.replace('google-site-verification=', '');
        }

        return {
            ...baseMetadata,
            verification: {
                google: googleCode,
                other: {
                    'facebook-domain-verification': settings?.meta_verification_facebook || [],
                }
            }
        };
    } catch (e) {
        console.error('Failed to generate dynamic metadata', e);
        return baseMetadata;
    }
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const isB2B = isB2BContext({ hostname: host.split(':')[0] });

    return (
        <html lang="pl" className={`${cormorant.variable} ${montserrat.variable} ${playfair.variable} ${lato.variable} ${greatVibes.variable} ${cinzel.variable} ${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
            <head>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css" />
                {!isB2B && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                "@context": "https://schema.org",
                                "@graph": [
                                    {
                                        "@type": ["LocalBusiness", "PhotographyBusiness"],
                                        "@id": "https://wlasniewski.pl/#business",
                                        "name": "Przemysław Właśniewski — Fotograf",
                                        "alternateName": "FOTO-DRON Przemysław Właśniewski",
                                        "image": "https://wlasniewski.pl/og-image.jpg",
                                        "description": "Profesjonalna fotografia rodzinna, ślubna, portretowa i komunijna w Toruniu, Grudziądzu, Chełmnie, Wąbrzeźnie i okolicach. Usługi dronem i termowizja.",
                                        "url": "https://wlasniewski.pl",
                                        "telephone": "+48530788694",
                                        "email": "kontakt@wlasniewski.pl",
                                        "taxID": "8781430365",
                                        "priceRange": "$$",
                                        "address": {
                                            "@type": "PostalAddress",
                                            "addressRegion": "Kujawsko-Pomorskie",
                                            "addressLocality": "Toruń",
                                            "addressCountry": "PL"
                                        },
                                        "geo": {
                                            "@type": "GeoCoordinates",
                                            "latitude": 53.01379,
                                            "longitude": 18.59844
                                        },
                                        "areaServed": [
                                            { "@type": "City", "name": "Toruń" },
                                            { "@type": "City", "name": "Grudziądz" },
                                            { "@type": "City", "name": "Chełmno" },
                                            { "@type": "City", "name": "Wąbrzeźno" },
                                            { "@type": "City", "name": "Bydgoszcz" },
                                            { "@type": "City", "name": "Świecie" },
                                            { "@type": "City", "name": "Lisewo" },
                                            { "@type": "City", "name": "Płużnica" }
                                        ],
                                        "openingHoursSpecification": {
                                            "@type": "OpeningHoursSpecification",
                                            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                                            "opens": "08:00",
                                            "closes": "20:00"
                                        },
                                        "hasOfferCatalog": {
                                            "@type": "OfferCatalog",
                                            "name": "Usługi fotograficzne",
                                            "itemListElement": [
                                                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Fotografia rodzinna", "description": "Naturalne sesje rodzinne w plenerze lub studio" } },
                                                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Fotografia ślubna", "description": "Kompleksowa obsługa fotograficzna ślubu i wesela" } },
                                                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Fotografia komunijna", "description": "Pamiątkowe zdjęcia z Pierwszej Komunii Świętej" } },
                                                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Fotografia portretowa", "description": "Sesje wizerunkowe i artystyczne portrety" } }
                                            ]
                                        },
                                        "sameAs": [
                                            "https://www.facebook.com/przemyslaw.wlasniewski.fotografia",
                                            "https://www.instagram.com/wlasniewski.pl/"
                                        ]
                                    },
                                    {
                                        "@type": "Person",
                                        "@id": "https://wlasniewski.pl/#person",
                                        "name": "Przemysław Właśniewski",
                                        "jobTitle": "Fotograf",
                                        "image": "https://wlasniewski.pl/og-image.jpg",
                                        "url": "https://wlasniewski.pl",
                                        "telephone": "+48 530 788 694",
                                        "email": "kontakt@wlasniewski.pl",
                                        "sameAs": [
                                            "https://www.facebook.com/przemyslaw.wlasniewski.fotografia",
                                            "https://www.instagram.com/wlasniewski.pl/"
                                        ]
                                    },
                                    {
                                        "@type": "WebSite",
                                        "@id": "https://wlasniewski.pl/#website",
                                        "name": "Przemysław Właśniewski — Fotograf",
                                        "url": "https://wlasniewski.pl",
                                        "description": "Profesjonalna fotografia rodzinna, ślubna, portretowa i komunijna w Toruniu i okolicach",
                                        "publisher": { "@id": "https://wlasniewski.pl/#person" }
                                    }
                                ]
                            })
                        }}
                    />
                )}
            </head>
            <body className="antialiased bg-zinc-950 text-zinc-100 min-h-screen flex flex-col" suppressHydrationWarning>
                <Suspense fallback={null}>
                    <AnalyticsTracker />
                    <AnalyticsLoader />
                </Suspense>
                <SeasonalEffectsWrapper />
                <PhotoCubeIntro />
                <AppShell isB2B={isB2B}>
                    {children}
                </AppShell>
                <FloatingContact />
            </body>
        </html>
    );
}
