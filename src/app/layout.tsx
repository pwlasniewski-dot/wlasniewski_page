import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat, Playfair_Display, Lato, Great_Vibes, Cinzel } from "next/font/google"; // Added fonts

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
import MobileReservationButton from "@/components/MobileReservationButton";
import SeasonalEffects from "@/components/effects/SeasonalEffects";

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
export const metadata: Metadata = {
    metadataBase: new URL('https://wlasniewski.pl'),
    title: {
        default: 'Przemysław Właśniewski — Fotograf Toruń',
        template: '%s | Przemysław Właśniewski Fotograf'
    },
    description: 'Profesjonalna fotografia rodzinna, ślubna, portretowa i komunijna. Naturalne zdjęcia w Toruniu, Wąbrzeźnie, Płużnicy i okolicach. Galeria online, odbitki premium.',
    keywords: [
        'fotograf toruń',
        'fotografia rodzinna toruń',
        'fotograf ślubny toruń',
        'sesja zdjęciowa toruń',
        'fotograf wąbrzeźno',
        'fotograf płużnica',
        'fotograf lisewo',
        'sesja rodzinna',
        'fotografia komunijna',
        'zdjęcia ślubne',
        'fotograf kujawsko-pomorskie'
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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pl" className={`${cormorant.variable} ${montserrat.variable} ${playfair.variable} ${lato.variable} ${greatVibes.variable} ${cinzel.variable}`} suppressHydrationWarning>
            <body className="antialiased bg-zinc-950 text-zinc-100 min-h-screen flex flex-col" suppressHydrationWarning>
                <Suspense fallback={null}>
                    <AnalyticsTracker />
                    <AnalyticsLoader />
                </Suspense>
                <SeasonalEffects />
                <AppShell>
                    {children}
                </AppShell>
                <FloatingContact />
                <MobileReservationButton />
            </body>
        </html>
    );
}
