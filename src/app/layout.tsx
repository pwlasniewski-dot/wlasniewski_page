import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat, Playfair_Display, Lato, Great_Vibes, Cinzel } from "next/font/google";
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
import AppShell from "@/components/AppShell";
import "./globals.css";
import { Suspense } from "react";
import { AnalyticsTracker } from "@/hooks/useAnalytics";
import AnalyticsLoader from "@/components/AnalyticsLoader";
import FloatingContact from "@/components/FloatingContact";
import SeasonalEffectsWrapper from "@/components/effects/SeasonalEffectsWrapper";

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
    description: 'Profesjonalna fotografia rodzinna, ślubna, portretowa i komunijna. Naturalne zdjęcia w Toruniu, Wąbrzeźnie, Płużnicy i okolicach. Galeria online, odbitki premium.',
    keywords: [
        'fotograf toruń',
        'fotografia rodzina toruń',
        'fotograf ślubny toruń',
        'sesja zdjęciowa toruń',
        'fotograf bydgoszcz',
        'fotograf grudziądz',
        'fotograf chełmno',
        'fotograf kujawsko-pomorskie',
        'FOTO-DRON Przemysław Właśniewski',
        'inspekcje dronem toruń',
        'termowizja dronem',
        'Mavic 3 Thermal',
        'zdjęcia z drona bydgoszcz',
        'analiza dachów dronem',
        'timeline budowy',
        'koła łowieckie dron',
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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pl" className={`${cormorant.variable} ${montserrat.variable} ${playfair.variable} ${lato.variable} ${greatVibes.variable} ${cinzel.variable}`} suppressHydrationWarning>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "LocalBusiness",
                            "name": "FOTO-DRON Przemysław Właśniewski",
                            "alternateName": "Przemysław Właśniewski Fotografia",
                            "image": "https://wlasniewski.pl/og-image.jpg",
                            "description": "Profesjonalne usługi dronem (termowizja Mavic 3 Thermal, inspekcje dachów, timeline budowy) oraz fotografia artystyczna Sony A7.",
                            "url": "https://wlasniewski.pl",
                            "telephone": "+48530788694",
                            "taxID": "8781430365",
                            "address": {
                                "@type": "PostalAddress",
                                "addressRegion": "Kujawsko-Pomorskie",
                                "addressLocality": "Toruń / Płużnica",
                                "addressCountry": "PL"
                            },
                            "geo": {
                                "@type": "GeoCoordinates",
                                "latitude": 53.01379,
                                "longitude": 18.59844
                            },
                            "areaServed": ["Toruń", "Bydgoszcz", "Grudziądz", "Chełmno", "Wąbrzeźno"],
                            "sameAs": [
                                "https://www.facebook.com/przemyslaw.wlasniewski.fotografia",
                                "https://www.instagram.com/wlasniewski.pl/"
                            ]
                        })
                    }}
                />
            </head>
            <body className="antialiased bg-zinc-950 text-zinc-100 min-h-screen flex flex-col" suppressHydrationWarning>
                <Suspense fallback={null}>
                    <AnalyticsTracker />
                    <AnalyticsLoader />
                </Suspense>
                <SeasonalEffectsWrapper />
                <AppShell>
                    {children}
                </AppShell>
                <FloatingContact />
            </body>
        </html>
    );
}
