type CmsPageMedia = {
    hero_image?: string | null;
    sections?: string | null;
};

const asImageUrl = (value: unknown): string | null =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

function imageFromSection(section: unknown): string | null {
    if (!section || typeof section !== 'object') return null;

    const item = section as Record<string, unknown>;
    const data = item.data && typeof item.data === 'object'
        ? item.data as Record<string, unknown>
        : item;

    const direct = asImageUrl(data.image) || asImageUrl(data.image_url);
    if (direct) return direct;

    for (const collection of [data.slides, data.mini_gallery_items, data.chronological_items]) {
        if (!Array.isArray(collection)) continue;
        for (const entry of collection) {
            if (!entry || typeof entry !== 'object') continue;
            const record = entry as Record<string, unknown>;
            const candidate = asImageUrl(record.image) || asImageUrl(record.src);
            if (candidate) return candidate;
        }
    }

    if (Array.isArray(data.images)) {
        for (const image of data.images) {
            const candidate = asImageUrl(image);
            if (candidate) return candidate;
        }
    }

    return null;
}

/**
 * Keep the social preview controlled by the same CMS media as the public page.
 * A dedicated hero wins; older pages safely fall back to their first visual section.
 */
export function resolvePageSocialImage(page: CmsPageMedia): string | null {
    const hero = asImageUrl(page.hero_image);
    if (hero) return hero;

    if (!page.sections) return null;

    try {
        const sections = JSON.parse(page.sections);
        if (!Array.isArray(sections)) return null;

        for (const section of sections) {
            const candidate = imageFromSection(section);
            if (candidate) return candidate;
        }
    } catch {
        return null;
    }

    return null;
}
