import type { Metadata } from "next";

/**
 * B2B Layout — aeroanaliza.pl
 * 
 * Nadpisuje metadataBase z wlasniewski.pl (B2C) na aeroanaliza.pl (B2B).
 * Dzięki temu wszystkie kanoniczne URL-e, OG-images i schema.org
 * generowane w podstronach /b2b/* wskazują na właściwą domenę.
 */
export const metadata: Metadata = {
    metadataBase: new URL("https://aeroanaliza.pl"),
    title: {
        default: "FOTO-DRON | Usługi Dronem — aeroanaliza.pl",
        template: "%s | FOTO-DRON aeroanaliza.pl",
    },
    description:
        "Profesjonalne usługi dronem dla biznesu: inspekcje termowizyjne Mavic 3 Thermal, monitoring inwestycji, ortofotomapy. Licencjonowany operator UAVO. Toruń, kujawsko-pomorskie.",
    keywords: [
        "inspekcje dronem toruń",
        "termowizja dronem",
        "Mavic 3 Thermal",
        "inspekcja dachu dronem",
        "analiza paneli fotowoltaicznych dronem",
        "ortofotomapy dron",
        "monitoring budowy dron",
        "timeline budowy dron",
        "koła łowieckie dron",
        "operator UAVO kujawsko-pomorskie",
        "FOTO-DRON Przemysław Właśniewski",
        "aeroanaliza",
        "usługi dronem kujawsko-pomorskie",
    ],
    authors: [{ name: "Przemysław Właśniewski — FOTO-DRON" }],
    creator: "Przemysław Właśniewski",
    publisher: "FOTO-DRON Przemysław Właśniewski",
    openGraph: {
        type: "website",
        locale: "pl_PL",
        url: "https://aeroanaliza.pl",
        siteName: "FOTO-DRON — aeroanaliza.pl",
        title: "FOTO-DRON | Inspekcje Dronem i Termowizja — aeroanaliza.pl",
        description:
            "Specjalistyczne usługi dronem dla firm: inspekcje termowizyjne, monitoring inwestycji, ortofotomapy. Toruń i kujawsko-pomorskie.",
        images: [
            {
                url: "/og-b2b.jpg",
                width: 1200,
                height: 630,
                alt: "FOTO-DRON — Usługi Dronem dla Biznesu",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "FOTO-DRON | Inspekcje Dronem — aeroanaliza.pl",
        description:
            "Profesjonalne usługi dronem: termowizja, inspekcje dachów, monitoring budowy. Toruń i okolice.",
        images: ["/og-b2b.jpg"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    alternates: {
        canonical: "https://aeroanaliza.pl",
    },
    category: "professional-services",
};

export default function B2BLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* B2B Schema.org — ProfessionalService */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ProfessionalService",
                        name: "FOTO-DRON Przemysław Właśniewski",
                        alternateName: "aeroanaliza.pl",
                        url: "https://aeroanaliza.pl",
                        logo: "https://aeroanaliza.pl/logo-b2b.png",
                        image: "https://aeroanaliza.pl/og-b2b.jpg",
                        description:
                            "Profesjonalne usługi dronem dla przemysłu, rolnictwa i deweloperów. Termowizja Mavic 3 Thermal, inspekcje dachów, ortofotomapy, monitoring inwestycji. Licencjonowany operator UAVO.",
                        telephone: "+48530788694",
                        taxID: "8781430365",
                        address: {
                            "@type": "PostalAddress",
                            addressRegion: "Kujawsko-Pomorskie",
                            addressLocality: "Toruń",
                            addressCountry: "PL",
                        },
                        geo: {
                            "@type": "GeoCoordinates",
                            latitude: 53.01379,
                            longitude: 18.59844,
                        },
                        areaServed: {
                            "@type": "State",
                            name: "Kujawsko-Pomorskie",
                        },
                        hasOfferCatalog: {
                            "@type": "OfferCatalog",
                            name: "Usługi Dronem",
                            itemListElement: [
                                {
                                    "@type": "Offer",
                                    itemOffered: {
                                        "@type": "Service",
                                        name: "Inspekcje Termowizyjne",
                                        description:
                                            "Wykrywanie mostków cieplnych, awarii paneli PV i wycieków ciepła kamerą Mavic 3 Thermal.",
                                    },
                                },
                                {
                                    "@type": "Offer",
                                    itemOffered: {
                                        "@type": "Service",
                                        name: "Monitoring Inwestycji",
                                        description:
                                            "Regularna dokumentacja postępów budowy z tej samej perspektywy. Raporty dla inwestorów.",
                                    },
                                },
                                {
                                    "@type": "Offer",
                                    itemOffered: {
                                        "@type": "Service",
                                        name: "Inspekcje Dachów i Infrastruktury",
                                        description:
                                            "Bezpieczna ocena stanu technicznego bez konieczności wchodzenia na wysokość.",
                                    },
                                },
                                {
                                    "@type": "Offer",
                                    itemOffered: {
                                        "@type": "Service",
                                        name: "Ortofotomapy i Rolnictwo Precyzyjne",
                                        description:
                                            "Szacowanie szkód łowieckich, analiza stanu upraw, mapowanie terenu.",
                                    },
                                },
                            ],
                        },
                        sameAs: [
                            "https://www.facebook.com/przemyslaw.wlasniewski.fotografia",
                            "https://www.instagram.com/wlasniewski.pl/",
                        ],
                    }),
                }}
            />
            {children}
        </>
    );
}
