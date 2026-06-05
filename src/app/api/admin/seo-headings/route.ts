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

/* ─── GET ─── */
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const [pages, blogs] = await Promise.all([
            prisma.page.findMany({
                select: { id: true, slug: true, title: true, content: true, sections: true, is_published: true },
            }),
            prisma.blogPost.findMany({
                select: { id: true, slug: true, title: true, content: true },
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
                    for (const section of sections) {
                        for (const key of ['title', 'heading', 'h1', 'h2', 'h3', 'subtitle']) {
                            if (typeof section[key] === 'string' && (section[key] as string).trim().length > 0) {
                                const text = (section[key] as string).trim();
                                const level: 'h1' | 'h2' | 'h3' = key === 'h3' ? 'h3' : key === 'h2' ? 'h2' : 'h1';
                                const { hasKeyword, matchedKeywords } = scoreHeading(text);
                                headings.push({
                                    id: `page_section__${page.slug}__${key}__${text.slice(0, 20)}`,
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
        };

        return NextResponse.json({
            success: true,
            headings,
            stats,
            targetKeywords: TARGET_KEYWORDS,
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
            const originalText = parts.slice(3).join('__');
            if (!key || !originalText) {
                return NextResponse.json({ error: 'Nieprawidłowy format sekcji' }, { status: 400 });
            }

            let sections: Array<Record<string, unknown>>;
            try {
                sections = JSON.parse(page.sections) as Array<Record<string, unknown>>;
            } catch {
                return NextResponse.json({ error: 'Nie można odczytać sekcji JSON' }, { status: 422 });
            }

            let updatedCount = 0;
            const updatedSections = sections.map((section) => {
                const currentValue = section[key];
                if (typeof currentValue === 'string' && currentValue.trim() === originalText.trim() && updatedCount === 0) {
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
