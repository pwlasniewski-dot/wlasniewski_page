// Portfolio metadata configuration
// This file enriches the dynamic folder structure with titles and descriptions.

export type PortfolioPhoto = {
    src: string;
    alt: string;
    title: string;
};

export type PortfolioSession = {
    slug: string;
    title: string;
    photos: PortfolioPhoto[];
};

export type PortfolioCategory = {
    slug: string;
    title: string;
    description: string;
    sessions: PortfolioSession[];
};

// Metadata mapping for folders found in public/assets/portfolio
// Slug must match the folder name exactly.
export const portfolioCategories: PortfolioCategory[] = [
    {
        slug: "family",
        title: "Sesje Rodzinne",
        description: "Naturalne, pełne emocji kadry rodzinne. Chwile, które warto zatrzymać.",
        sessions: [],
    },
    {
        slug: "wedding",
        title: "Fotografia Ślubna",
        description: "Reportaż ślubny i sesje plenerowe. Wasza historia opowiedziana światłem.",
        sessions: [],
    },
    {
        slug: "business",
        title: "Fotografia Biznesowa",
        description: "Profesjonalne portrety korporacyjne i zdjęcia wizerunkowe.",
        sessions: [],
    },
    {
        slug: "portrait",
        title: "Portrety",
        description: "Sesje indywidualne, kobiece i męskie. Odkryj swoje piękno.",
        sessions: [],
    },
    {
        slug: "communion",
        title: "Komunie",
        description: "Uroczyste sesje komunijne. Pamiątka ważnego dnia.",
        sessions: [],
    },
    {
        slug: "events",
        title: "Wydarzenia",
        description: "Reportaże z wydarzeń, eventów firmowych i uroczystości.",
        sessions: [],
    },
    {
        slug: "drone",
        title: "Dron",
        description: "Niesamowite ujęcia z powietrza. Licencjonowany operator NSTS-01.",
        sessions: [],
    },
    {
        slug: "Sesja_portretowa",
        title: "Sesja Portretowa",
        description: "Indywidualne sesje w plenerze lub studio.",
        sessions: [],
    }
];

// Helper to get metadata (used by the dynamic loader)
export function getCategoryMetadata(slug: string): PortfolioCategory | undefined {
    return portfolioCategories.find(cat => cat.slug === slug);
}
