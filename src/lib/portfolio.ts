import { portfolioCategories, PortfolioCategory } from "@/data/portfolioData";
import { unstable_cache } from 'next/cache';

export type PortfolioImage = {
    src: string;
    width: number;
    height: number;
    alt?: string;
};

export type PortfolioSession = {
    id: number;
    slug: string;
    title: string;
    coverImage?: string;
    imageCount: number;
    photos: PortfolioImage[];
    highlightedPhotos?: string[]; // URLs of highlighted photos
    category: string;
    date: string;
    description?: string;
    location?: string;
    isCategoryHero?: boolean;
};

export type DynamicCategory = Omit<PortfolioCategory, 'sessions'> & {
    coverImage?: string;
    imageCount: number;
    sessions: PortfolioSession[];
};
// ... (skip unchanged function groupSessionsByCategory)

// ... inside fetchLocalPortfolio map:




// Helper to group flat sessions into categories
function groupSessionsByCategory(sessions: any[]): DynamicCategory[] {
    const categoriesMap = new Map<string, DynamicCategory>();

    // Initialize with static metadata
    portfolioCategories.forEach(cat => {
        categoriesMap.set(cat.slug, {
            ...cat,
            coverImage: undefined,
            imageCount: 0,
            sessions: []
        });
    });

    sessions.forEach(session => {
        // Normalize category slug
        let catSlug = session.category;

        // Match existing static categories case-insensitively
        const matchedSlug = Array.from(categoriesMap.keys()).find(k => k.toLowerCase() === catSlug.toLowerCase());
        const finalSlug = matchedSlug || catSlug;

        if (!categoriesMap.has(finalSlug)) {
            categoriesMap.set(finalSlug, {
                slug: finalSlug,
                title: finalSlug.charAt(0).toUpperCase() + finalSlug.slice(1),
                description: "",
                coverImage: undefined,
                imageCount: 0,
                sessions: []
            });
        }

        const category = categoriesMap.get(finalSlug)!;

        // Parse media_ids to get photo count
        const photoCount = session.media_ids ? JSON.parse(session.media_ids).length : 0;

        category.sessions.push({
            id: session.id,
            slug: session.slug,
            title: session.title,
            coverImage: session.cover_image_url || "/assets/placeholder.jpg",
            imageCount: photoCount,
            photos: [], // Loaded on detail page
            highlightedPhotos: session.highlightedPhotos || [],
            category: finalSlug,
            date: session.date
        });

        category.imageCount += photoCount;
    });

    // Set cover image for category (use first session's cover)
    // Set cover image for category (prioritize isCategoryHero, else use first/newest session)
    for (const cat of categoriesMap.values()) {
        if (cat.sessions.length > 0) {
            const heroSession = cat.sessions.find(s => s.isCategoryHero);
            if (heroSession) {
                cat.coverImage = heroSession.coverImage;
            } else {
                cat.coverImage = cat.sessions[0].coverImage;
            }
        }
    }

    // Filter out empty categories
    return Array.from(categoriesMap.values()).filter(c => c.sessions.length > 0);
}

/**
 * Fetches the portfolio structure from the LOCAL API.
 */
/**
 * Fetches the portfolio structure directly from the database (Server-Side).
 * IMPORTANT: Uses lazy import to prevent DB access during build-time module analysis
 * CACHED: Results are cached for 1 hour to improve performance
 */
const fetchLocalPortfolio = unstable_cache(
    async (): Promise<DynamicCategory[]> => {
        try {
            // LAZY IMPORT - prevents DB connection during build-time module analysis
            const prisma = (await import("@/lib/db/prisma")).default;

            const sessions = await prisma.portfolioSession.findMany({
                where: {
                    is_published: true
                },
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    category: true,
                    description: true,
                    location: true,
                    session_date: true,
                    highlighted_media_ids: true,
                    media_ids: true,
                    is_category_hero: true,
                    cover_image: {
                        select: { 
                            file_path: true 
                        }
                    }
                },
                orderBy: { session_date: 'desc' },
            });

            // To get highlighted URLs, we need to query MediaLibrary where ID IN (all highlighted IDs).
            const allHighlightedIds = sessions.flatMap(s =>
                (s as any).highlighted_media_ids ? JSON.parse((s as any).highlighted_media_ids) as number[] : []
            );

            const highlightedMedia = await prisma.mediaLibrary.findMany({
                where: { id: { in: allHighlightedIds } },
                select: { id: true, file_path: true }
            });

            const mediaMap = new Map(highlightedMedia.map(m => [m.id, m.file_path]));

        const mappedSessions = sessions.map(s => {
            const hIds = (s as any).highlighted_media_ids ? JSON.parse((s as any).highlighted_media_ids) as number[] : [];
            const hPhotos = hIds.map(id => mediaMap.get(id)).filter(Boolean) as string[];

            return {
                ...s,
                id: Number(s.id),
                cover_image_url: s.cover_image?.file_path || null,
                highlightedPhotos: hPhotos,
                date: s.session_date ? s.session_date.toISOString() : new Date().toISOString(),
                isCategoryHero: (s as any).is_category_hero
            };
        });

        return groupSessionsByCategory(mappedSessions);
    } catch (error) {
        console.error("[Portfolio] Error fetching portfolio from DB:", error);
        return [];
    }
},
    ['portfolio-categories'],
    { 
        revalidate: 3600, // Cache for 1 hour
        tags: ['portfolio', 'portfolio-sessions'] 
    }
);

/**
 * Returns a list of all portfolio categories.
 */
export async function getPortfolioCategories(): Promise<DynamicCategory[]> {
    return await fetchLocalPortfolio();
}

/**
 * Returns a specific category with its sessions.
 */
export async function getCategory(slug: string): Promise<DynamicCategory | undefined> {
    const categories = await fetchLocalPortfolio();
    const decodedSlug = decodeURIComponent(slug);
    return categories.find(c => c.slug.toLowerCase() === decodedSlug.toLowerCase());
}
