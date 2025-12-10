// Helper to determine API URL based on environment
const API_BASE_URL = (process.env.STRAPI_API_URL || process.env.NEXT_PUBLIC_STRAPI_API_URL || '').replace(/\/$/, '');

export const getApiUrl = (endpoint: string) => {
    // Remove leading slash if present
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Prefer external API base when provided, otherwise fall back to Next.js API routes
    if (API_BASE_URL) {
        return `${API_BASE_URL}/${path}`;
    }

    return `/api/${path}`;
};

/**
 * Safe JSON fetch helper that keeps the build alive when the API is unavailable.
 */
export async function fetchFromApi<T>(endpoint: string, fallback: T, init?: RequestInit & { next?: { revalidate?: number } }): Promise<T> {
    const url = getApiUrl(endpoint);

    try {
        const response = await fetch(url, {
            next: { revalidate: 60, ...(init?.next || {}) },
            ...init,
        });

        if (!response.ok) {
            console.error(`API responded with status ${response.status} for ${url}`);
            return fallback;
        }

        return await response.json() as T;
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return fallback;
    }
}
