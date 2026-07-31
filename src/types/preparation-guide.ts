export type PreparationGuideTip = {
    id: number | string;
    slug?: string;
    title: string;
    content: string;
    image?: string;
    imageAlt?: string;
    tip_type?: string | null;
    category?: string | null;
    icon?: string | null;
    is_featured?: boolean;
};

export type PreparationGuideFaq = {
    id: number | string;
    question: string;
    answer: string;
    category?: string | null;
};

export type PreparationGuidePalette = {
    id: number | string;
    name: string;
    slug?: string;
    description?: string | null;
    season?: string | null;
    location_type?: string | null;
    mood?: string | null;
    colors: unknown;
    example_images?: unknown;
};

export type PreparationGuideOutfit = {
    id: number;
    title: string;
    slug?: string;
    description?: string | null;
    season?: string | null;
    location_type?: string | null;
    category?: string | null;
    outfit_details?: unknown;
    palette?: {
        id?: number;
        name?: string;
        colors?: unknown;
    } | null;
};

export type PreparationGuidePaletteColor = {
    name: string;
    hex: string;
};

export type PoseGuideCard = {
    id: string;
    title: string;
    purpose: string;
    steps: string[];
    body: string;
    variant: string;
    mistake: string;
    mobility: string;
    image?: string;
    imageAlt: string;
};

export type WardrobeChecklist = {
    title: string;
    items: string[];
};

export type ClientPreparationGuideData = {
    context: {
        offerId: number | null;
        serviceType: string | null;
        location: string | null;
        personalized: boolean;
    };
    wardrobe: {
        palettes: PreparationGuidePalette[];
        outfits: PreparationGuideOutfit[];
        tips: PreparationGuideTip[];
        faqs: PreparationGuideFaq[];
        checklists: WardrobeChecklist[];
    };
    poses: {
        cards: PoseGuideCard[];
        tips: PreparationGuideTip[];
        faqs: PreparationGuideFaq[];
    };
    recommended_palettes: PreparationGuidePalette[];
    recommended_outfits: PreparationGuideOutfit[];
    tips: PreparationGuideTip[];
};
