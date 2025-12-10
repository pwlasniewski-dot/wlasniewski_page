import { portfolioCategories, PortfolioCategory } from "@/data/portfolioData";

export type PortfolioImage = {
    src: string;
    width: number;
    height: number;
    alt?: string;
};

export type PortfolioSession = {
    slug: string;
    title: string;
    coverImage?: string;
    imageCount: number;
    photos: PortfolioImage[];
    category: string;
    date: string;
};

export type DynamicCategory = PortfolioCategory & {
    coverImage?: string;
    imageCount: number;
    sessions: PortfolioSession[];
};

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
            slug: session.slug,
            title: session.title,
            coverImage: session.cover_image_url || "/assets/placeholder.jpg",
            imageCount: photoCount,
            photos: [], // Loaded on detail page
            category: finalSlug,
            date: session.date
        });

        category.imageCount += photoCount;
    });

    // Set cover image for category (use first session's cover)
    for (const cat of categoriesMap.values()) {
        if (cat.sessions.length > 0) {
            cat.coverImage = cat.sessions[0].coverImage;
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
 */
async function fetchLocalPortfolio(): Promise<DynamicCategory[]> {
    try {
        // LAZY IMPORT - prevents DB connection during build-time module analysis
        const prisma = (await import("@/lib/db/prisma")).default;

        const sessions = await prisma.portfolioSession.findMany({
            include: {
                cover_image: {
                    select: { file_path: true }
                }
            },
            orderBy: { session_date: 'desc' },
        });

        const mappedSessions = sessions.map(s => ({
            ...s,
            id: Number(s.id),
            cover_image_url: s.cover_image?.file_path || null,
            date: s.session_date ? s.session_date.toISOString() : new Date().toISOString()
        }));

        return groupSessionsByCategory(mappedSessions);
    } catch (error) {
        console.error("[Portfolio] Error fetching portfolio from DB:", error);
        return [];
    }
}

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
