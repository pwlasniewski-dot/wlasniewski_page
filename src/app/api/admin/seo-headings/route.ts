import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

/* ─── Target keywords for Toruń photography niche ─── */
const TARGET_KEYWORDS: { kw: string; volume: string; intent: string }[] = [
    { kw: 'fotograf toruń', volume: 'wysoki', intent: 'lokalna' },
    { kw: 'fotograf ślubny toruń', volume: 'wysoki', intent: 'lokalna/transakcyjna' },
    { kw: 'sesja zdjęciowa toruń', volume: 'średni', intent: 'lokalna/transakcyjna' },
    { kw: 'zdjęcia ślubne toruń', volume: 'wysoki', intent: 'lokalna/transakcyjna' },
    { kw: 'fotografia ślubna toruń', volume: 'wysoki', intent: 'lokalna' },
    { kw: 'sesja rodzinna toruń', volume: 'średni', intent: 'lokalna/transakcyjna' },
    { kw: 'fotograf komunia toruń', volume: 'średni', intent: 'lokalna/transakcyjna' },
    { kw: 'sesja ciążowa toruń', volume: 'średni', intent: 'lokalna/transakcyjna' },
    { kw: 'fotografia noworodkowa toruń', volume: 'niski', intent: 'lokalna' },
    { kw: 'sesja noworodkowa toruń', volume: 'niski', intent: 'lokalna/transakcyjna' },
    { kw: 'fotograf portretowy toruń', volume: 'niski', intent: 'lokalna' },
    { kw: 'sesja narzeczańska toruń', volume: 'niski', intent: 'lokalna' },
    { kw: 'fotograf biznesowy toruń', volume: 'niski', intent: 'lokalna/transakcyjna' },
    { kw: 'zdjęcia komunijne toruń', volume: 'średni', intent: 'lokalna' },
    { kw: 'fotografia rodzinna toruń', volume: 'średni', intent: 'lokalna' },
    { kw: 'fotografia newborn', volume: 'średni', intent: 'informacyjna' },
    { kw: 'sesja zdjęciowa kujawsko-pomorskie', volume: 'niski', intent: 'lokalna' },
    { kw: 'fotograf wesele', volume: 'wysoki', intent: 'transakcyjna' },
    { kw: 'fotografia ślubna reportaż', volume: 'średni', intent: 'informacyjna' },
    { kw: 'naturalna fotografia ślubna', volume: 'średni', intent: 'informacyjna' },
    { kw: 'wspomnienia światłem', volume: 'niski', intent: 'brandowa' },
    { kw: 'najlepszy fotograf toruń', volume: 'niski', intent: 'transakcyjna' },
    { kw: 'cennik fotograf toruń', volume: 'niski', intent: 'transakcyjna' },
    { kw: 'fotograf toruń opinie', volume: 'niski', intent: 'informacyjna' },
];

/* ─── Suggestion templates by heading level ─── */
const SUGGESTIONS_H1: string[] = [
    'Fotograf Toruń – naturalna fotografia ślubna i rodzinna',
    'Zdjęcia ślubne Toruń | Fotografia pełna emocji',
    'Fotograf ślubny Toruń – wspomnienia zapisane światłem',
    'Sesje zdjęciowe Toruń | Śluby, rodziny, portrety',
    'Fotografia ślubna i rodzinna Toruń – wyjątkowe kadry',
];

const SUGGESTIONS_H2: string[] = [
    'Fotografia ślubna w Toruniu',
    'Sesje rodzinne i portretowe – Toruń i okolice',
    'Dlaczego warto wybrać fotografa z Torunia?',
    'Pakiety i cennik – fotograf ślubny Toruń',
    'Sesja komunijna Toruń – naturalne ujęcia',
    'Fotografia noworodkowa i ciążowa Toruń',
    'Opinie klientów – fotograf Toruń',
    'Portfolio – zdjęcia ślubne Toruń',
];

const SUGGESTIONS_H3: string[] = [
    'Reportaż ślubny Toruń',
    'Sesja plenerowa Toruń i kujawsko-pomorskie',
    'Fotografia komunijna – Toruń',
    'Naturalny reportaż rodzinny',
    'Nasze realizacje – fotografia ślubna',
    'Jak przygotować się do sesji zdjęciowej?',
    'Ceny i pakiety fotograficzne',
];

/* ─── HTML heading extractor ─── */
function extractHeadingsFromHtml(
    html: string,
    source: string,
    slug: string
): HeadingEntry[] {
    if (!html) return [];
    const results: HeadingEntry[] = [];
    const regex = /<(h[123])[^>]*>([\s\S]*?)<\/\1>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
        const level = match[1].toLowerCase() as 'h1' | 'h2' | 'h3';
        const rawText = match[2].replace(/<[^>]+>/g, '').trim();
        if (rawText.length === 0) continue;
        results.push({
            id: `${source}__${slug}__${level}__${results.length}`,
            source,
            slug,
            level,
            text: rawText,
            editable: true,
            htmlTag: match[1].toLowerCase(),
        });
    }
    return results;
}

/* ─── Keyword check ─── */
function scoreHeading(text: string): { hasKeyword: boolean; matchedKeywords: string[] } {
    const lower = text.toLowerCase();
    const matched = TARGET_KEYWORDS.filter(k => lower.includes(k.kw)).map(k => k.kw);
    return { hasKeyword: matched.length > 0, matchedKeywords: matched };
}

function getSuggestions(level: 'h1' | 'h2' | 'h3', text: string): string[] {
    const pool = level === 'h1' ? SUGGESTIONS_H1 : level === 'h2' ? SUGGESTIONS_H2 : SUGGESTIONS_H3;
    // Return 3 suggestions that don't match current text
    return pool.filter(s => s.toLowerCase() !== text.toLowerCase()).slice(0, 3);
}

function levelFromSectionKey(key: string): 'h1' | 'h2' | 'h3' {
    if (key === 'h1') return 'h1';
    if (key === 'h3' || key === 'subtitle') return 'h3';
    return 'h2';
}

/* ─── Types ─── */
export type HeadingEntry = {
    id: string;
    source: 'page_title' | 'page_content' | 'blog_title' | 'blog_content' | string;
    slug: string;
    level: 'h1' | 'h2' | 'h3';
    text: string;
    editable: boolean;
    htmlTag: string;
    pageLabel?: string;
    hasKeyword?: boolean;
    matchedKeywords?: string[];
    suggestions?: string[];
};

type StructureConflict = {
    entityKey: string;
    sourceType: 'page' | 'blog';
    slug: string;
    pageLabel: string;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    issues: string[];
};

type Recommendation = {
    id: string;
    entityKey: string;
    sourceType: 'page' | 'blog';
    slug: string;
    pageLabel: string;
    level: 'h1' | 'h2' | 'h3';
    actionType: 'replace' | 'manual';
    severity: 'critical' | 'warning' | 'info';
    currentText?: string;
    suggestedText: string;
    reason: string;
    targetKeyword: string;
    headingId?: string;
    editable: boolean;
    sortOrder: number;
};

type SeoStrategy = {
    primaryKeyword: string;
    suggestH1: (current: string) => string;
    h2Suggestions: string[];
    h3Suggestions: string[];
};

const CITY_LABELS: Record<string, string> = {
    torun: 'Toruń',
    grudziadz: 'Grudziądz',
    chelmno: 'Chełmno',
    wabrzezno: 'Wąbrzeźno',
    lisewo: 'Lisewo',
    pluznica: 'Płużnica',
    swiecie: 'Świecie',
    bydgoszcz: 'Bydgoszcz',
};

function getEntitySortOrder(slug: string, sourceType: 'page' | 'blog'): number {
    if (sourceType === 'page' && slug === 'strona-glowna') return 0;
    if (sourceType === 'page' && slug === 'o-mnie') return 1;
    if (sourceType === 'page' && slug === 'rezerwacja') return 2;
    if (sourceType === 'page' && slug === 'kontakt') return 3;
    if (sourceType === 'page' && slug.startsWith('fotograf-')) return 4;
    if (sourceType === 'page' && slug.includes('portfolio')) return 5;
    if (sourceType === 'blog') return 90;
    return 20;
}

function getSeoStrategy(slug: string, sourceType: 'page' | 'blog'): SeoStrategy {
    if (sourceType === 'blog') {
        return {
            primaryKeyword: 'fotograf toruń',
            suggestH1: (current) => current.toLowerCase().includes('fotograf toruń') ? current : `${current} | Fotograf Toruń`,
            h2Suggestions: [
                'Jak przygotować się do sesji zdjęciowej w Toruniu?',
                'Co warto wiedzieć przed wyborem fotografa w Toruniu?',
                'Zdjęcia ślubne i rodzinne w Toruniu – praktyczne wskazówki',
            ],
            h3Suggestions: [
                'Fotograf Toruń – praktyczna wskazówka',
                'Sesja zdjęciowa Toruń – checklist',
            ],
        };
    }

    if (slug === 'strona-glowna') {
        return {
            primaryKeyword: 'fotograf toruń',
            suggestH1: () => 'Fotograf Toruń – naturalna fotografia ślubna i rodzinna',
            h2Suggestions: [
                'Fotografia ślubna i rodzinna w Toruniu',
                'Sesje zdjęciowe Toruń i okolice',
                'Dlaczego warto wybrać fotografa z Torunia?',
            ],
            h3Suggestions: [
                'Zdjęcia ślubne Toruń – portfolio',
                'Sesja rodzinna Toruń – jak pracuję',
            ],
        };
    }

    if (slug === 'o-mnie') {
        return {
            primaryKeyword: 'fotograf toruń',
            suggestH1: () => 'O mnie – fotograf Toruń | Przemysław Właśniewski',
            h2Suggestions: [
                'Jak pracuję jako fotograf w Toruniu',
                'Naturalna fotografia ślubna i rodzinna – moje podejście',
                'Dlaczego klienci wybierają fotografa z Torunia?',
            ],
            h3Suggestions: [
                'Moje podejście do sesji zdjęciowej',
                'Fotograf Toruń – emocje zamiast pozowania',
            ],
        };
    }

    if (slug === 'kontakt') {
        return {
            primaryKeyword: 'fotograf toruń kontakt',
            suggestH1: () => 'Kontakt – fotograf Toruń | Umów sesję zdjęciową',
            h2Suggestions: [
                'Umów sesję zdjęciową w Toruniu',
                'Jak skontaktować się z fotografem z Torunia?',
            ],
            h3Suggestions: [
                'Odpowiadam na wiadomości o sesjach w Toruniu',
            ],
        };
    }

    if (slug === 'rezerwacja') {
        return {
            primaryKeyword: 'sesja zdjęciowa toruń',
            suggestH1: () => 'Rezerwacja sesji zdjęciowej – Toruń i okolice',
            h2Suggestions: [
                'Jak zarezerwować sesję zdjęciową w Toruniu?',
                'Dostępne terminy na sesje ślubne i rodzinne',
            ],
            h3Suggestions: [
                'Co przygotować przed rezerwacją sesji?',
            ],
        };
    }

    if (slug.startsWith('fotograf-')) {
        const cityKey = slug.replace('fotograf-', '');
        const city = CITY_LABELS[cityKey] || cityKey;
        return {
            primaryKeyword: `fotograf ${city.toLowerCase()}`,
            suggestH1: () => `Fotograf ${city} – naturalna fotografia ślubna i rodzinna`,
            h2Suggestions: [
                `Fotografia ślubna ${city}`,
                `Sesja rodzinna ${city} – naturalne kadry`,
                `Dlaczego warto wybrać fotografa w ${city}?`,
            ],
            h3Suggestions: [
                `Zdjęcia ślubne ${city}`,
                `Sesja zdjęciowa ${city} – jak wygląda współpraca?`,
            ],
        };
    }

    if (slug.includes('portfolio')) {
        return {
            primaryKeyword: 'zdjęcia ślubne toruń',
            suggestH1: () => 'Portfolio – zdjęcia ślubne i rodzinne Toruń',
            h2Suggestions: [
                'Portfolio fotografa z Torunia',
                'Zdjęcia ślubne Toruń – wybrane realizacje',
            ],
            h3Suggestions: [
                'Naturalna fotografia ślubna – wybrane kadry',
            ],
        };
    }

    return {
        primaryKeyword: 'fotograf toruń',
        suggestH1: (current) => current.toLowerCase().includes('fotograf toruń') ? current : `${current} | Fotograf Toruń`,
        h2Suggestions: [
            'Fotograf Toruń – oferta i podejście',
            'Sesje zdjęciowe w Toruniu i okolicach',
        ],
        h3Suggestions: [
            'Fotograf Toruń – szczegóły współpracy',
        ],
    };
}

function buildRecommendations(
    headings: HeadingEntry[],
    exposedEntityKeys: Set<string>
): Recommendation[] {
    const grouped = new Map<string, HeadingEntry[]>();

    for (const heading of headings) {
        const sourceType: 'page' | 'blog' = heading.source.startsWith('blog') ? 'blog' : 'page';
        const entityKey = `${sourceType}:${heading.slug}`;
        if (!exposedEntityKeys.has(entityKey)) continue;

        if (!grouped.has(entityKey)) {
            grouped.set(entityKey, []);
        }
        grouped.get(entityKey)!.push(heading);
    }

    const recommendations: Recommendation[] = [];

    for (const [entityKey, entityHeadings] of grouped.entries()) {
        const first = entityHeadings[0];
        if (!first) continue;

        const sourceType: 'page' | 'blog' = first.source.startsWith('blog') ? 'blog' : 'page';
        const sortOrder = getEntitySortOrder(first.slug, sourceType);
        const strategy = getSeoStrategy(first.slug, sourceType);

        const h1s = entityHeadings.filter(h => h.level === 'h1');
        const h2s = entityHeadings.filter(h => h.level === 'h2');
        const h3s = entityHeadings.filter(h => h.level === 'h3');

        const primaryH1 = h1s[0];
        if (primaryH1) {
            const suggested = strategy.suggestH1(primaryH1.text);
            if ((!primaryH1.hasKeyword || primaryH1.text !== suggested) && primaryH1.text !== suggested) {
                recommendations.push({
                    id: `${entityKey}__h1_main`,
                    entityKey,
                    sourceType,
                    slug: first.slug,
                    pageLabel: first.pageLabel || first.slug,
                    level: 'h1',
                    actionType: 'replace',
                    severity: 'critical',
                    currentText: primaryH1.text,
                    suggestedText: suggested,
                    reason: 'Główny H1 powinien zawierać frazę docelową i jasno opisywać intencję strony.',
                    targetKeyword: strategy.primaryKeyword,
                    headingId: primaryH1.id,
                    editable: primaryH1.editable,
                    sortOrder,
                });
            }
        } else {
            recommendations.push({
                id: `${entityKey}__missing_h1`,
                entityKey,
                sourceType,
                slug: first.slug,
                pageLabel: first.pageLabel || first.slug,
                level: 'h1',
                actionType: 'manual',
                severity: 'critical',
                suggestedText: strategy.suggestH1(''),
                reason: 'Strona nie ma H1. Dodaj jeden główny nagłówek na początku treści.',
                targetKeyword: strategy.primaryKeyword,
                editable: false,
                sortOrder,
            });
        }

        for (const extraH1 of h1s.slice(1, 3)) {
            recommendations.push({
                id: `${entityKey}__extra_h1__${extraH1.id}`,
                entityKey,
                sourceType,
                slug: first.slug,
                pageLabel: first.pageLabel || first.slug,
                level: 'h1',
                actionType: 'manual',
                severity: 'critical',
                currentText: extraH1.text,
                suggestedText: extraH1.text,
                reason: 'Ta strona ma więcej niż jedno H1. Zmień ten nagłówek na H2 w edytorze treści.',
                targetKeyword: strategy.primaryKeyword,
                editable: false,
                sortOrder,
            });
        }

        h2s.filter(h => !h.hasKeyword).slice(0, 2).forEach((heading, idx) => {
            const suggested = strategy.h2Suggestions[idx] || strategy.h2Suggestions[strategy.h2Suggestions.length - 1];
            if (suggested && heading.text !== suggested) {
                recommendations.push({
                    id: `${entityKey}__h2__${heading.id}`,
                    entityKey,
                    sourceType,
                    slug: first.slug,
                    pageLabel: first.pageLabel || first.slug,
                    level: 'h2',
                    actionType: 'replace',
                    severity: 'warning',
                    currentText: heading.text,
                    suggestedText: suggested,
                    reason: 'Ten H2 nie wzmacnia fraz lokalnych ani intencji podstrony.',
                    targetKeyword: strategy.primaryKeyword,
                    headingId: heading.id,
                    editable: heading.editable,
                    sortOrder,
                });
            }
        });

        h3s.filter(h => !h.hasKeyword).slice(0, 1).forEach((heading, idx) => {
            const suggested = strategy.h3Suggestions[idx] || strategy.h3Suggestions[strategy.h3Suggestions.length - 1];
            if (suggested && heading.text !== suggested) {
                recommendations.push({
                    id: `${entityKey}__h3__${heading.id}`,
                    entityKey,
                    sourceType,
                    slug: first.slug,
                    pageLabel: first.pageLabel || first.slug,
                    level: 'h3',
                    actionType: 'replace',
                    severity: 'info',
                    currentText: heading.text,
                    suggestedText: suggested,
                    reason: 'Warto doprecyzować śródtytuł słowem kluczowym lub lokalizacją.',
                    targetKeyword: strategy.primaryKeyword,
                    headingId: heading.id,
                    editable: heading.editable,
                    sortOrder,
                });
            }
        });
    }

    return recommendations.sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
        const severityRank = { critical: 0, warning: 1, info: 2 };
        if (severityRank[left.severity] !== severityRank[right.severity]) {
            return severityRank[left.severity] - severityRank[right.severity];
        }
        return left.pageLabel.localeCompare(right.pageLabel, 'pl');
    });
}

/* ─── GET ─── */
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const [pages, blogs] = await Promise.all([
            prisma.page.findMany({
                select: { id: true, slug: true, title: true, content: true, sections: true, is_published: true },
            }),
            prisma.blogPost.findMany({
                select: { id: true, slug: true, title: true, content: true, status: true },
            }),
        ]);

        const headings: HeadingEntry[] = [];

        // ─── Pages ───
        for (const page of pages) {
            const label = `Strona: /${page.slug}${!page.is_published ? ' (szkic)' : ''}`;

            // Title → H1
            if (page.title) {
                const { hasKeyword, matchedKeywords } = scoreHeading(page.title);
                headings.push({
                    id: `page_title__${page.slug}`,
                    source: 'page_title',
                    slug: page.slug,
                    level: 'h1',
                    text: page.title,
                    editable: true,
                    htmlTag: 'h1',
                    pageLabel: label,
                    hasKeyword,
                    matchedKeywords,
                    suggestions: getSuggestions('h1', page.title),
                });
            }

            // Content HTML → h1/h2/h3
            if (page.content) {
                const found = extractHeadingsFromHtml(page.content, 'page_content', page.slug);
                for (const h of found) {
                    const { hasKeyword, matchedKeywords } = scoreHeading(h.text);
                    headings.push({ ...h, pageLabel: label, hasKeyword, matchedKeywords, suggestions: getSuggestions(h.level, h.text) });
                }
            }

            // Sections JSON → try to find heading-like fields
            if (page.sections) {
                try {
                    const sections = JSON.parse(page.sections) as Record<string, unknown>[];
                    for (const [sectionIndex, section] of sections.entries()) {
                        for (const key of ['title', 'heading', 'h1', 'h2', 'h3', 'subtitle']) {
                            if (typeof section[key] === 'string' && (section[key] as string).trim().length > 0) {
                                const text = (section[key] as string).trim();
                                const level = levelFromSectionKey(key);
                                const { hasKeyword, matchedKeywords } = scoreHeading(text);
                                headings.push({
                                    id: `page_section__${page.slug}__${key}__${sectionIndex}`,
                                    source: 'page_section',
                                    slug: page.slug,
                                    level,
                                    text,
                                    editable: true,
                                    htmlTag: level,
                                    pageLabel: label,
                                    hasKeyword,
                                    matchedKeywords,
                                    suggestions: getSuggestions(level, text),
                                });
                            }
                        }
                    }
                } catch {
                    // ignore malformed JSON
                }
            }
        }

        // ─── Blog posts ───
        for (const post of blogs) {
            const label = `Blog: /blog/${post.slug}`;

            if (post.title) {
                const { hasKeyword, matchedKeywords } = scoreHeading(post.title);
                headings.push({
                    id: `blog_title__${post.slug}`,
                    source: 'blog_title',
                    slug: post.slug,
                    level: 'h1',
                    text: post.title,
                    editable: true,
                    htmlTag: 'h1',
                    pageLabel: label,
                    hasKeyword,
                    matchedKeywords,
                    suggestions: getSuggestions('h1', post.title),
                });
            }

            if (post.content) {
                const found = extractHeadingsFromHtml(post.content, 'blog_content', post.slug);
                for (const h of found) {
                    const { hasKeyword, matchedKeywords } = scoreHeading(h.text);
                    headings.push({ ...h, pageLabel: label, hasKeyword, matchedKeywords, suggestions: getSuggestions(h.level, h.text) });
                }
            }
        }

        const stats = {
            total: headings.length,
            withKeyword: headings.filter(h => h.hasKeyword).length,
            withoutKeyword: headings.filter(h => !h.hasKeyword).length,
            h1Count: headings.filter(h => h.level === 'h1').length,
            h2Count: headings.filter(h => h.level === 'h2').length,
            h3Count: headings.filter(h => h.level === 'h3').length,
            conflictEntitiesCount: 0,
            recommendationGroupsCount: 0,
        };

        const entities = new Map<string, {
            sourceType: 'page' | 'blog';
            slug: string;
            pageLabel: string;
            h1Count: number;
            h2Count: number;
            h3Count: number;
        }>();

        for (const heading of headings) {
            const sourceType: 'page' | 'blog' = heading.source.startsWith('blog') ? 'blog' : 'page';
            const entityKey = `${sourceType}:${heading.slug}`;

            if (!entities.has(entityKey)) {
                entities.set(entityKey, {
                    sourceType,
                    slug: heading.slug,
                    pageLabel: heading.pageLabel || heading.slug,
                    h1Count: 0,
                    h2Count: 0,
                    h3Count: 0,
                });
            }

            const entity = entities.get(entityKey)!;
            if (heading.level === 'h1') entity.h1Count += 1;
            if (heading.level === 'h2') entity.h2Count += 1;
            if (heading.level === 'h3') entity.h3Count += 1;
        }

        const structureConflicts: StructureConflict[] = [];
        for (const [entityKey, entity] of entities.entries()) {
            const issues: string[] = [];
            if (entity.h1Count === 0) issues.push('Brak nagłówka H1');
            if (entity.h1Count > 1) issues.push(`Wiele H1 (${entity.h1Count})`);
            if (entity.h3Count > 0 && entity.h2Count === 0) issues.push('H3 bez H2');

            if (issues.length > 0) {
                structureConflicts.push({
                    entityKey,
                    sourceType: entity.sourceType,
                    slug: entity.slug,
                    pageLabel: entity.pageLabel,
                    h1Count: entity.h1Count,
                    h2Count: entity.h2Count,
                    h3Count: entity.h3Count,
                    issues,
                });
            }
        }

        stats.conflictEntitiesCount = structureConflicts.length;

        const exposedEntityKeys = new Set<string>();
        for (const page of pages) {
            if (page.is_published) {
                exposedEntityKeys.add(`page:${page.slug}`);
            }
        }
        for (const blog of blogs) {
            if (blog.status === 'published') {
                exposedEntityKeys.add(`blog:${blog.slug}`);
            }
        }

        const recommendations = buildRecommendations(headings, exposedEntityKeys);
        stats.recommendationGroupsCount = new Set(recommendations.map(item => item.entityKey)).size;

        return NextResponse.json({
            success: true,
            headings,
            stats,
            targetKeywords: TARGET_KEYWORDS,
            structureConflicts,
            recommendations,
        });
    });
}

/* ─── PATCH – update heading text ─── */
export async function PATCH(request: NextRequest) {
    return withAuth(request, async () => {
        const body = await request.json() as { id: string; newText: string };
        const { id, newText } = body;

        if (!id || typeof newText !== 'string' || newText.trim().length === 0) {
            return NextResponse.json({ error: 'Brak id lub newText' }, { status: 400 });
        }

        const clean = newText.trim();

        // id format: source__slug__...
        const parts = id.split('__');
        const source = parts[0];
        const slug = parts[1];

        if (!source || !slug) {
            return NextResponse.json({ error: 'Nieprawidłowy format id' }, { status: 400 });
        }

        if (source === 'page_title') {
            await prisma.page.update({ where: { slug }, data: { title: clean } });
            return NextResponse.json({ success: true });
        }

        if (source === 'blog_title') {
            await prisma.blogPost.update({ where: { slug }, data: { title: clean } });
            return NextResponse.json({ success: true });
        }

        if (source === 'page_content') {
            // Update heading in HTML content
            const page = await prisma.page.findUnique({ where: { slug }, select: { content: true } });
            if (!page) return NextResponse.json({ error: 'Strona nie znaleziona' }, { status: 404 });

            // Find the heading by index (4th part of id is the index)
            const idx = parseInt(parts[3] ?? '0', 10);
            let counter = 0;
            const updated = page.content.replace(/<(h[123])([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag, attrs, _inner) => {
                if (counter === idx) {
                    counter++;
                    return `<${tag}${attrs}>${clean}</${tag}>`;
                }
                counter++;
                return full;
            });
            await prisma.page.update({ where: { slug }, data: { content: updated } });
            return NextResponse.json({ success: true });
        }

        if (source === 'blog_content') {
            const post = await prisma.blogPost.findUnique({ where: { slug }, select: { content: true } });
            if (!post) return NextResponse.json({ error: 'Post nie znaleziony' }, { status: 404 });

            const idx = parseInt(parts[3] ?? '0', 10);
            let counter = 0;
            const updated = post.content.replace(/<(h[123])([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag, attrs, _inner) => {
                if (counter === idx) {
                    counter++;
                    return `<${tag}${attrs}>${clean}</${tag}>`;
                }
                counter++;
                return full;
            });
            await prisma.blogPost.update({ where: { slug }, data: { content: updated } });
            return NextResponse.json({ success: true });
        }

        if (source === 'page_section') {
            const page = await prisma.page.findUnique({ where: { slug }, select: { sections: true } });
            if (!page) return NextResponse.json({ error: 'Strona nie znaleziona' }, { status: 404 });
            if (!page.sections) return NextResponse.json({ error: 'Brak sekcji do edycji' }, { status: 404 });

            const key = parts[2];
            const sectionRef = parts.slice(3).join('__');
            if (!key || !sectionRef) {
                return NextResponse.json({ error: 'Nieprawidłowy format sekcji' }, { status: 400 });
            }

            let sections: Array<Record<string, unknown>>;
            try {
                sections = JSON.parse(page.sections) as Array<Record<string, unknown>>;
            } catch {
                return NextResponse.json({ error: 'Nie można odczytać sekcji JSON' }, { status: 422 });
            }

            const sectionIndex = Number.parseInt(sectionRef, 10);
            const isIndexRef = Number.isInteger(sectionIndex) && sectionIndex >= 0;

            let updatedCount = 0;
            const updatedSections = sections.map((section, idx) => {
                const currentValue = section[key];

                if (typeof currentValue !== 'string' || updatedCount > 0) {
                    return section;
                }

                if (isIndexRef && idx === sectionIndex) {
                    updatedCount += 1;
                    return { ...section, [key]: clean };
                }

                // Backward compatibility for previously generated IDs based on truncated text.
                if (!isIndexRef && currentValue.trim().startsWith(sectionRef.trim())) {
                    updatedCount += 1;
                    return { ...section, [key]: clean };
                }

                return section;
            });

            if (updatedCount === 0) {
                return NextResponse.json({ error: 'Nie znaleziono wskazanego nagłówka sekcji' }, { status: 404 });
            }

            await prisma.page.update({
                where: { slug },
                data: { sections: JSON.stringify(updatedSections) },
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Nieobsługiwany typ źródła (sekcje JSON edytuj przez edytor stron)' }, { status: 422 });
    });
}
