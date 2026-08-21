import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import {
    AERO_PUBLIC_SLUGS,
    getAeroCmsSlugCandidates,
    getAeroPageDefinition,
    hasAeroContentVersion,
    mergeAeroPageSections,
} from '@/lib/aeroanaliza/content';
import { validateAeroPageSections } from '@/lib/aeroanaliza/page-validation';

function parseSections(value: string | null | undefined) {
    try {
        const parsed = value ? JSON.parse(value) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const pages = [];
        for (const publicSlug of AERO_PUBLIC_SLUGS) {
            const existing = await prisma.page.findFirst({
                where: { slug: { in: getAeroCmsSlugCandidates(publicSlug), mode: 'insensitive' }, page_type: 'b2b' },
                select: { slug: true, sections: true },
                orderBy: { updated_at: 'desc' },
            });
            const action = !existing ? 'create' : hasAeroContentVersion(parseSections(existing.sections)) ? 'skip' : 'convert_with_backup';
            pages.push({ publicSlug: publicSlug || '/', databaseSlug: existing?.slug || publicSlug || 'b2b', action });
        }
        return NextResponse.json({ success: true, preview: true, pages });
    });
}

export async function POST(request: NextRequest) {
    return withAuth(request, async authenticatedRequest => {
        const body = await authenticatedRequest.json().catch(() => ({})) as { mode?: string; confirm?: string };
        const allowConversion = body.mode === 'convert' && body.confirm === 'REPLACE_LEGACY_AERO_CONTENT';
        const results: Array<{ slug: string; action: string }> = [];

        await prisma.$transaction(async transaction => {
            for (const publicSlug of AERO_PUBLIC_SLUGS) {
                const definition = getAeroPageDefinition(publicSlug)!;
                const canonicalDatabaseSlug = publicSlug || 'b2b';
                const existing = await transaction.page.findFirst({
                    where: { slug: { in: getAeroCmsSlugCandidates(publicSlug), mode: 'insensitive' }, page_type: 'b2b' },
                    orderBy: { updated_at: 'desc' },
                });
                const databaseSlug = existing?.slug || canonicalDatabaseSlug;
                const existingSections = parseSections(existing?.sections);

                // The publisher is a migration/bootstrap action, not a CMS reset.
                // Once v2 is present, all later edits belong to the administrator.
                if (existing && hasAeroContentVersion(existingSections)) {
                    results.push({ slug: databaseSlug, action: 'skipped' });
                    continue;
                }

                // Never replace legacy CMS content automatically. Public rendering
                // can use the reviewed fallback, while an administrator qualifies
                // the old sections/media and performs the explicit CMS edit.
                if (existing) {
                    if (!allowConversion) {
                        results.push({ slug: databaseSlug, action: 'needs_review' });
                        continue;
                    }

                    const backupKey = `aero_v2_backup_${existing.id}_${Date.now()}`;
                    await transaction.setting.create({
                        data: { setting_key: backupKey, setting_value: JSON.stringify(existing) },
                    });

                    const convertedSections = mergeAeroPageSections(definition, existingSections);
                    const validation = validateAeroPageSections(convertedSections);
                    if (!validation.valid) throw new Error(`Nie można bezpiecznie przekonwertować strony ${databaseSlug}: ${validation.error}`);
                    const convertedHero = convertedSections.find(section => section.type === 'b2b_hero');
                    await transaction.page.update({
                        where: { id: existing.id },
                        data: {
                            title: definition.serviceName || definition.title,
                            meta_title: definition.title,
                            meta_description: definition.description,
                            meta_keywords: definition.keywords.join(', '),
                            hero_image: convertedHero?.image || existing.hero_image,
                            sections: JSON.stringify(convertedSections),
                            page_type: 'b2b',
                        },
                    });
                    results.push({ slug: databaseSlug, action: 'converted_with_backup' });
                    continue;
                }

                const sections = definition.sections;
                const validation = validateAeroPageSections(sections);
                if (!validation.valid) throw new Error(`Nie można utworzyć strony ${canonicalDatabaseSlug}: ${validation.error}`);
                const hero = sections.find(section => section.type === 'b2b_hero');
                const heroData = (hero as typeof hero & { data?: Record<string, unknown> })?.data || hero as unknown as Record<string, unknown>;

                await transaction.page.create({
                    data: {
                        slug: canonicalDatabaseSlug,
                        title: definition.serviceName || definition.title,
                        content: '',
                        meta_title: definition.title,
                        meta_description: definition.description,
                        meta_keywords: definition.keywords.join(', '),
                        hero_image: typeof heroData?.image === 'string' ? heroData.image : null,
                        sections: JSON.stringify(sections),
                        page_type: 'b2b',
                        is_published: true,
                        is_in_menu: Boolean(publicSlug),
                    },
                });
                results.push({ slug: canonicalDatabaseSlug, action: 'created' });
            }
        });

        return NextResponse.json({ success: true, pages: results });
    });
}
