import prisma from '@/lib/db/prisma';
import type { PageSection } from '@/components/admin/PageBuilder';
import { getAeroCmsSlugCandidates, hasAeroContentVersion } from '@/lib/aeroanaliza/content';
import { validateAeroPageSections } from '@/lib/aeroanaliza/page-validation';

export async function loadAeroCmsPage(slug: string) {
    const normalized = slug.replace(/^\/+|\/+$/g, '');
    const candidates = getAeroCmsSlugCandidates(normalized);

    try {
        const page = await prisma.page.findFirst({
            where: { slug: { in: candidates, mode: 'insensitive' }, page_type: 'b2b' },
            select: { title: true, meta_title: true, meta_description: true, meta_keywords: true, hero_image: true, sections: true, updated_at: true, is_published: true },
            orderBy: { updated_at: 'desc' },
        });
        let sections: PageSection[] = [];
        if (page?.sections) {
            try {
                const parsed = JSON.parse(page.sections);
                if (Array.isArray(parsed)) sections = parsed;
            } catch (error) {
                console.error(`[aeroanaliza] Invalid CMS sections for ${normalized || 'home'}`, error);
            }
        }
        const status = page ? (page.is_published ? 'published' : 'unpublished') : 'missing';
        if (page?.is_published && hasAeroContentVersion(sections)) {
            const validation = validateAeroPageSections(sections);
            if (!validation.valid) {
                console.error(`[aeroanaliza] Published CMS v2 rejected for ${normalized || 'home'}: ${validation.error}`);
                return { page: null, sections: [] as PageSection[], status: 'invalid' } as const;
            }
        }

        // Legacy B2B copy can contain old claims and metadata. The public site
        // consumes only a sanitized thermal pair from it; reviewed code content
        // remains authoritative until the explicit v2 migration is accepted.
        return { page: hasAeroContentVersion(sections) ? page : null, sections, status } as const;
    } catch (error) {
        console.error(`[aeroanaliza] CMS unavailable for ${normalized || 'home'}`, error);
        return { page: null, sections: [] as PageSection[], status: 'unavailable' } as const;
    }
}
