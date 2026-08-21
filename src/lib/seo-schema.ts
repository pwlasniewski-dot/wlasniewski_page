// JSON-LD Structured Data for Professional SEO

export interface LocalBusinessSchema {
    name: string;
    description: string;
    image: string;
    telephone: string;
    email: string;
    address: {
        city: string;
        region: string;
        country: string;
    };
    priceRange: string;
    url: string;
    sameAs: string[];
}

export function generateLocalBusinessSchema(data?: Partial<LocalBusinessSchema>): string {
    const schema = {
        "@context": "https://schema.org",
        "@type": ["LocalBusiness", "PhotographyBusiness"],
        "@id": "https://wlasniewski.pl/#business",
        "name": data?.name || "Przemysław Właśniewski — Fotograf",
        "description": data?.description || "Profesjonalna fotografia rodzinna, ślubna, portretowa i komunijna. Naturalne zdjęcia w Toruniu, Wąbrzeźnie, Płużnicy i okolicach.",
        "image": data?.image || "https://wlasniewski.pl/og-image.jpg",
        "telephone": data?.telephone || "+48 530 788 694",
        "email": data?.email || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "pwlasniewski@gmail.com",
        "url": data?.url || "https://wlasniewski.pl",
        "priceRange": data?.priceRange || "$$",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": data?.address?.city || "Toruń",
            "addressRegion": data?.address?.region || "kujawsko-pomorskie",
            "addressCountry": data?.address?.country || "PL"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": "53.0138",
            "longitude": "18.5984"
        },
        "areaServed": [
            { "@type": "City", "name": "Toruń" },
            { "@type": "City", "name": "Wąbrzeźno" },
            { "@type": "City", "name": "Płużnica" },
            { "@type": "City", "name": "Lisewo" },
            { "@type": "City", "name": "Grudziądz" }
        ],
        "sameAs": data?.sameAs || [
            "https://www.facebook.com/przemyslaw.wlasniewski.fotografia",
            "https://www.instagram.com/wlasniewski.pl/"
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
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Fotografia rodzinna",
                        "description": "Naturalne sesje rodzinne w plenerze lub studio"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Fotografia ślubna",
                        "description": "Kompleksowa obsługa fotograficzna ślubu i wesela"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Fotografia komunijna",
                        "description": "Pamiątkowe zdjęcia z Pierwszej Komunii Świętej"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Portrety i sesje wizerunkowe",
                        "description": "Profesjonalne portrety i zdjęcia biznesowe"
                    }
                }
            ]
        }
    };

    return JSON.stringify(schema);
}

export function generatePersonSchema(): string {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": "https://wlasniewski.pl/#person",
        "name": "Przemysław Właśniewski",
        "jobTitle": "Fotograf",
        "description": "Profesjonalny fotograf specjalizujący się w fotografii rodzinnej, ślubnej i portretowej",
        "image": "https://wlasniewski.pl/og-image.jpg",
        "url": "https://wlasniewski.pl",
        "telephone": "+48 530 788 694",
        "email": process.env.NEXT_PUBLIC_CONTACT_EMAIL || "pwlasniewski@gmail.com",
        "sameAs": [
            "https://www.facebook.com/przemyslaw.wlasniewski.fotografia",
            "https://www.instagram.com/wlasniewski.pl/"
        ],
        "worksFor": {
            "@id": "https://wlasniewski.pl/#business"
        }
    };

    return JSON.stringify(schema);
}

export function generateWebsiteSchema(): string {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://wlasniewski.pl/#website",
        "name": "Przemysław Właśniewski — Fotograf",
        "url": "https://wlasniewski.pl",
        "description": "Profesjonalna fotografia rodzinna, ślubna, portretowa i komunijna w Toruniu i okolicach",
        "publisher": {
            "@id": "https://wlasniewski.pl/#person"
        },
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://wlasniewski.pl/szukaj?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    return JSON.stringify(schema);
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]): string {
    const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
        }))
    };

    return JSON.stringify(schema);
}

export function generateServiceSchema(service: {
    name: string;
    description: string;
    image?: string;
    price?: string;
    url: string;
}): string {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": service.name,
        "description": service.description,
        "image": service.image,
        "provider": {
            "@id": "https://wlasniewski.pl/#business"
        },
        "areaServed": {
            "@type": "State",
            "name": "kujawsko-pomorskie"
        },
        "url": service.url
    };

    return JSON.stringify(schema);
}

// ─── B2B Drone Services Schema (aeroanaliza.pl) ───

export function generateB2BDroneBusinessSchema(): string {
    const schema = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "@id": "https://aeroanaliza.pl/#business",
        "name": "FOTO-DRON — Usługi Dronowe dla Biznesu",
        "description": "Profesjonalne usługi dronowe: inspekcje termowizyjne, ortofotomapy, monitoring inwestycji budowlanych, audyty dachów i paneli fotowoltaicznych. Licencjonowany operator UAVO.",
        "image": "https://aeroanaliza.pl/assets/b2b/hero-drone.jpg",
        "telephone": "+48 530 788 694",
        "email": process.env.NEXT_PUBLIC_CONTACT_EMAIL || "pwlasniewski@gmail.com",
        "url": "https://aeroanaliza.pl",
        "priceRange": "$$-$$$",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Toruń",
            "addressRegion": "kujawsko-pomorskie",
            "addressCountry": "PL"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": "53.0138",
            "longitude": "18.5984"
        },
        "areaServed": [
            { "@type": "State", "name": "kujawsko-pomorskie" },
            { "@type": "Country", "name": "Polska" }
        ],
        "sameAs": [
            "https://wlasniewski.pl"
        ],
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Usługi dronowe B2B",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Inspekcje termowizyjne dronem",
                        "description": "Inspekcje dachów, paneli fotowoltaicznych i instalacji termowizją z drona Mavic 3 Thermal"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Ortofotomapy i fotogrametria",
                        "description": "Precyzyjne ortofotomapy terenu, pomiary objętości, modele 3D z dronów"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Monitoring inwestycji budowlanych",
                        "description": "Cykliczne naloty dokumentujące postęp budowy z perspektywy drona"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Filmowanie i fotografia z powietrza",
                        "description": "Profesjonalne zdjęcia i filmy z drona dla nieruchomości, eventów i przemysłu"
                    }
                }
            ]
        }
    };

    return JSON.stringify(schema);
}
