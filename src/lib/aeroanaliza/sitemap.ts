import { AERO_PUBLIC_SLUGS, getAeroCmsSlugCandidates } from '@/lib/aeroanaliza/content';

export type AeroCmsPublicationState = {
    slug: string;
    is_published: boolean;
    updated_at: Date;
};

export function getSitemapAeroSlugs(cmsPages: AeroCmsPublicationState[] | null) {
    if (cmsPages === null) return AERO_PUBLIC_SLUGS;

    return AERO_PUBLIC_SLUGS.filter(publicSlug => {
        const candidates = new Set(getAeroCmsSlugCandidates(publicSlug).map(value => value.toLowerCase()));
        const matching = cmsPages
            .filter(page => candidates.has(page.slug.toLowerCase()))
            .sort((left, right) => right.updated_at.getTime() - left.updated_at.getTime());
        return matching.length === 0 || matching[0].is_published;
    });
}

export function getAeroCmsLastModified(publicSlug: string, cmsPages: AeroCmsPublicationState[]) {
    const candidates = new Set(getAeroCmsSlugCandidates(publicSlug).map(value => value.toLowerCase()));
    return cmsPages
        .filter(page => page.is_published && candidates.has(page.slug.toLowerCase()))
        .sort((left, right) => right.updated_at.getTime() - left.updated_at.getTime())[0]?.updated_at;
}
