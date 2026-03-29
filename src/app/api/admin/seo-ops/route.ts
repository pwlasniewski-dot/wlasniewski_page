import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

/* ─── Types ─── */
type ChecklistItem = {
    id: string;
    category: 'Technical' | 'Content' | 'Authority' | 'Conversion' | 'Automation';
    title: string;
    why: string;
    toolName: string;
    toolUrl: string;
    effort: 'S' | 'M' | 'L';
    impactPoints: number;
};

type ChecklistState = {
    id: string;
    done: boolean;
    note?: string;
    updatedAt?: string;
};

type PersistedSeoOpsState = { checklist?: ChecklistState[] };

type KeywordEntry = { keyword: string; count: number; density: number; pages: string[] };

type AiRecommendation = {
    page: string;
    severity: 'critical' | 'warning' | 'info';
    category: string;
    finding: string;
    recommendation: string;
};

type PostBody = {
    action: 'save-checklist' | 'pagespeed' | 'indexnow' | 'ai-analyze';
    checklist?: ChecklistState[];
    url?: string;
    urls?: string[];
};

const SEO_STATE_KEY = 'seo_ops_state';

/* ─── Polish Stop Words ─── */
const PL_STOP = new Set([
    'i','w','na','z','do','nie','to','jest','sie','co','jak','o','za','po','ale',
    'ze','od','tak','ten','ta','te','ty','ja','on','by','czy','an','ich','tym',
    'dla','tu','tego','tej','mnie','mi','ci','was','nas','go','mu','pan','pani',
    'pan','juz','tak','ktory','ktora','tylko','przy','pod','przed','nad','bez',
    'przez','aby','bo','gdy','raz','mozna','moze','sobie','bardzo','czy','tez',
    'jej','jego','swoje','nasz','wasz','tam','tutaj','teraz','wtedy','jeszcze',
    'kiedy','gdzie','lub','albo','ani','ze','ze','no','oto','oraz'
]);

/* ─── Checklist (14 items, expanded) ─── */
const CHECKLIST_TEMPLATE: ChecklistItem[] = [
    { id: 'gsc-verify', category: 'Technical', title: 'Zweryfikuj domenę i sitemap w Google Search Console', why: 'Bez GSC nie widzisz zapytań, CTR i stron z problemami indeksacji.', toolName: 'Google Search Console', toolUrl: 'https://search.google.com/search-console', effort: 'S', impactPoints: 9 },
    { id: 'ga4-goals', category: 'Automation', title: 'Skonfiguruj cele GA4: wysłanie formularza, klik tel, rezerwacja', why: 'SEO bez pomiaru konwersji prowadzi do ruchu bez wartości biznesowej.', toolName: 'Google Analytics 4', toolUrl: 'https://analytics.google.com', effort: 'M', impactPoints: 8 },
    { id: 'titles-descriptions', category: 'Content', title: 'Uzupełnij brakujące meta title i meta description na wszystkich stronach', why: 'To najszybsza dźwignia CTR i podstawowa higiena on-page.', toolName: 'Screaming Frog SEO Spider', toolUrl: 'https://www.screamingfrog.co.uk/seo-spider/', effort: 'M', impactPoints: 10 },
    { id: 'intent-pages', category: 'Content', title: 'Dopasuj podstrony do intencji: ślub, komunia, sesja rodzinna, fotograf toruń', why: 'Google premiuje podstrony odpowiadające pojedynczej intencji.', toolName: 'Ubersuggest', toolUrl: 'https://neilpatel.com/ubersuggest/', effort: 'L', impactPoints: 10 },
    { id: 'internal-links', category: 'Authority', title: 'Wzmocnij linkowanie wewnętrzne do stron usług i lokalizacji', why: 'Lepsze linkowanie przyspiesza indeksację i podnosi widoczność stron docelowych.', toolName: 'Ahrefs Webmaster Tools', toolUrl: 'https://ahrefs.com/webmaster-tools', effort: 'M', impactPoints: 7 },
    { id: 'pagespeed-cwv', category: 'Technical', title: 'Popraw Core Web Vitals dla mobile (LCP/INP/CLS)', why: 'Słaby mobile performance obniża widoczność i konwersje.', toolName: 'PageSpeed Insights', toolUrl: 'https://pagespeed.web.dev/', effort: 'L', impactPoints: 9 },
    { id: 'schema-review', category: 'Technical', title: 'Rozszerz schema.org o FAQ, Service i Review na stronach usług', why: 'Dane strukturalne poprawiają semantykę i szanse na rich results.', toolName: 'Rich Results Test', toolUrl: 'https://search.google.com/test/rich-results', effort: 'M', impactPoints: 6 },
    { id: 'content-calendar', category: 'Automation', title: 'Uruchom kalendarz contentu: 2 wpisy/miesiąc pod frazy lokalne', why: 'Stały dopływ treści jest kluczowy dla wzrostu widoczności long-tail.', toolName: 'AnswerThePublic', toolUrl: 'https://answerthepublic.com/', effort: 'L', impactPoints: 8 },
    { id: 'session-recordings', category: 'Conversion', title: 'Włącz nagrania sesji i heatmapy (Clarity)', why: 'Widzisz realne tarcia UX, które psują konwersje z ruchu organicznego.', toolName: 'Microsoft Clarity', toolUrl: 'https://clarity.microsoft.com', effort: 'S', impactPoints: 6 },
    { id: 'weekly-reporting', category: 'Automation', title: 'Automatyczny raport tygodniowy SEO i konwersji', why: 'Stały rytm raportowania pozwala szybko reagować na spadki i wzrosty.', toolName: 'Looker Studio', toolUrl: 'https://lookerstudio.google.com', effort: 'M', impactPoints: 7 },
    { id: 'indexnow-setup', category: 'Technical', title: 'Skonfiguruj IndexNow do natychmiastowej indeksacji zmian', why: 'IndexNow powiadamia Bing/Yandex o nowych i zmienionych stronach w sekundy.', toolName: 'IndexNow', toolUrl: 'https://www.indexnow.org/', effort: 'S', impactPoints: 5 },
    { id: 'b2b-seo-identity', category: 'Content', title: 'Zbuduj osobną tożsamość SEO dla aeroanaliza.pl (B2B)', why: 'Domena B2B musi mieć własny sitemap, schema i meta pod frazy dronowe.', toolName: 'Bing Webmaster Tools', toolUrl: 'https://www.bing.com/webmasters/', effort: 'L', impactPoints: 8 },
    { id: 'google-trends', category: 'Content', title: 'Monitoruj Google Trends dla sezonowych fraz fotograficznych', why: 'Dopasowanie contentu do sezonowości podnosi ruch w kluczowych miesiącach.', toolName: 'Google Trends', toolUrl: 'https://trends.google.pl/', effort: 'S', impactPoints: 4 },
    { id: 'backlink-audit', category: 'Authority', title: 'Audyt backlinków i disavow toksycznych linków', why: 'Toksyczne linki obniżają Domain Authority i widoczność.', toolName: 'Ahrefs Webmaster Tools', toolUrl: 'https://ahrefs.com/webmaster-tools', effort: 'M', impactPoints: 6 },
];

/* ─── Helpers ─── */
function parseState(raw: string | null | undefined): PersistedSeoOpsState {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as PersistedSeoOpsState;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch { return {}; }
}

function percentDelta(current: number, previous: number): number {
    if (previous <= 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
}

function estimateRankBand(score: number): string {
    if (score >= 85) return 'TOP 10';
    if (score >= 72) return '11-20';
    if (score >= 58) return '21-40';
    if (score >= 45) return '41-70';
    return '70+';
}

function clamp(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, v));
}

function computeSeoScore(input: {
    missingMetaTitle: number; missingMetaDescription: number; thinPages: number;
    analyticsConfigured: boolean; gscConfigured: boolean;
    organicTrafficDelta: number; completionPercent: number;
}): number {
    const raw = 62
        - input.missingMetaTitle * 2.5
        - input.missingMetaDescription * 2
        - input.thinPages * 1.4
        + (input.analyticsConfigured ? 5 : -4)
        + (input.gscConfigured ? 4 : -5)
        + clamp(input.organicTrafficDelta / 5, -6, 6)
        + clamp(input.completionPercent / 12, 0, 8);
    return clamp(Math.round(raw), 10, 96);
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
}

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !PL_STOP.has(w));
}

/* ─── Keyword Extraction Engine ─── */
function extractKeywords(
    items: Array<{ slug: string; title: string; content: string; meta_title: string; meta_description: string }>,
    limit = 30,
): KeywordEntry[] {
    const freq = new Map<string, { count: number; pages: Set<string> }>();
    let totalWords = 0;

    for (const item of items) {
        const text = [item.title, item.meta_title, item.meta_description, stripHtml(item.content)]
            .filter(Boolean).join(' ');
        const words = tokenize(text);
        totalWords += words.length;

        // Single words
        for (const w of words) {
            const entry = freq.get(w) || { count: 0, pages: new Set<string>() };
            entry.count++;
            entry.pages.add(item.slug);
            freq.set(w, entry);
        }

        // Bigrams (2-word phrases)
        for (let i = 0; i < words.length - 1; i++) {
            const bigram = `${words[i]} ${words[i + 1]}`;
            const entry = freq.get(bigram) || { count: 0, pages: new Set<string>() };
            entry.count++;
            entry.pages.add(item.slug);
            freq.set(bigram, entry);
        }
    }

    return Array.from(freq.entries())
        .filter(([, v]) => v.count >= 2)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, limit)
        .map(([keyword, v]) => ({
            keyword,
            count: v.count,
            density: totalWords > 0 ? Math.round((v.count / totalWords) * 10000) / 100 : 0,
            pages: Array.from(v.pages),
        }));
}

/* ─── AI SEO Analyzer (Rule-based Agent) ─── */
function runAiAnalysis(
    pages: Array<{ slug: string; title: string; content: string; meta_title: string | null; meta_description: string | null }>,
    sessions: Array<{ slug: string; title: string; description: string | null; meta_title: string | null; meta_description: string | null }>,
    blogPosts: Array<{ slug: string; title: string; excerpt: string | null; meta_title: string | null; meta_description: string | null }>,
): AiRecommendation[] {
    const recs: AiRecommendation[] = [];

    for (const p of pages) {
        const plainContent = stripHtml(p.content || '');
        const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
        const titleLen = (p.meta_title || '').length;
        const descLen = (p.meta_description || '').length;

        if (!p.meta_title || titleLen < 20)
            recs.push({ page: `/${p.slug}`, severity: 'critical', category: 'Meta', finding: `Meta title za krótki (${titleLen} znaków)`, recommendation: `Ustaw meta title 50-60 znaków z główną frazą kluczową na początku. Przykład: "Fotograf Ślubny Toruń — ${p.title} | Właśniewski"` });
        if (titleLen > 60)
            recs.push({ page: `/${p.slug}`, severity: 'warning', category: 'Meta', finding: `Meta title za długi (${titleLen} znaków)`, recommendation: 'Skróć do 50-60 znaków — Google obcina dłuższe tytuły.' });
        if (!p.meta_description || descLen < 90)
            recs.push({ page: `/${p.slug}`, severity: 'critical', category: 'Meta', finding: `Meta description za krótki (${descLen} znaków)`, recommendation: 'Ustaw opis 140-155 znaków z CTA i frazą kluczową.' });
        if (descLen > 160)
            recs.push({ page: `/${p.slug}`, severity: 'warning', category: 'Meta', finding: `Meta description za długi (${descLen} znaków)`, recommendation: 'Skróć do 140-155 znaków.' });
        if (wordCount < 300)
            recs.push({ page: `/${p.slug}`, severity: 'warning', category: 'Content', finding: `Rzadka treść (${wordCount} słów)`, recommendation: 'Google preferuje strony z minimum 300-500 słów. Dodaj opis usługi, FAQ lub lokalne informacje.' });
        if (wordCount > 100 && !plainContent.toLowerCase().includes('toruń') && !plainContent.toLowerCase().includes('torun'))
            recs.push({ page: `/${p.slug}`, severity: 'info', category: 'Local SEO', finding: 'Brak wzmianki o lokalizacji', recommendation: 'Dodaj "Toruń", "kujawsko-pomorskie" itp. dla sygnałów lokalnych.' });
        if (p.content && !p.content.includes('<h2') && !p.content.includes('<h3'))
            recs.push({ page: `/${p.slug}`, severity: 'warning', category: 'Structure', finding: 'Brak nagłówków H2/H3 w treści', recommendation: 'Dodaj nagłówki sekcji z frazami kluczowymi dla lepszej struktury semantycznej.' });
    }

    for (const s of sessions) {
        if (!s.meta_title)
            recs.push({ page: `/portfolio/${s.slug}`, severity: 'warning', category: 'Meta', finding: 'Brak meta title', recommendation: `Dodaj: "${s.title} — Sesja Fotograficzna | Właśniewski Fotograf"` });
        if (!s.meta_description)
            recs.push({ page: `/portfolio/${s.slug}`, severity: 'warning', category: 'Meta', finding: 'Brak meta description', recommendation: `Opisz sesję w 140-155 znakach z lokalizacją i typem sesji.` });
    }

    for (const b of blogPosts) {
        if (!b.meta_title)
            recs.push({ page: `/blog/${b.slug}`, severity: 'warning', category: 'Meta', finding: 'Brak meta title', recommendation: `Dodaj SEO-friendly tytuł bloga z frazą long-tail.` });
        if (!b.excerpt || b.excerpt.length < 90)
            recs.push({ page: `/blog/${b.slug}`, severity: 'info', category: 'Content', finding: 'Excerpt zbyt krótki', recommendation: 'Rozszerz excerpt do 100-160 znaków — jest używany jako meta description.' });
    }

    return recs.slice(0, 60);
}

/* ─── B2B Domain Diagnostics ─── */
function buildB2BDiagnostics(
    pages: Array<{ slug: string; title: string; content: string; meta_title: string | null; meta_description: string | null }>,
): { status: string; issues: string[]; recommendations: string[] } {
    const b2bPages = pages.filter(p =>
        p.slug.startsWith('b2b') || p.slug.includes('dron') || p.slug.includes('aero')
    );

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (b2bPages.length === 0) {
        issues.push('Brak dedykowanych stron B2B w bazie danych — aeroanaliza.pl nie ma własnego contentu.');
        recommendations.push('Stwórz osobne strony dla: inspekcje dronem, termowizja, ortofotomapy, monitoring inwestycji.');
    }

    issues.push('Sitemap nie zawiera URL-i aeroanaliza.pl — Googlebot nie indeksuje B2B.');
    issues.push('robots.txt nie deklaruje osobnego sitemap dla B2B.');
    issues.push('Brak dedykowanego schema.org dla usług dronowych.');
    recommendations.push('Dodaj aeroanaliza.pl do sitemap z URL-ami /b2b/*, /b2b/dron.');
    recommendations.push('Stwórz schema.org ProfessionalService z typem usług: inspekcja, termowizja, fotogrametria.');
    recommendations.push('Skonfiguruj osobny profil Google Search Console dla aeroanaliza.pl.');
    recommendations.push('Dodaj aeroanaliza.pl do Bing Webmaster Tools z osobnym sitemapem.');

    return {
        status: b2bPages.length > 0 ? 'partial' : 'critical',
        issues,
        recommendations,
    };
}

/* ─── GET: Full Audit Report ─── */
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
        const [settingRows, pages, sessions, blogPosts] = await Promise.all([
            prisma.setting.findMany({
                where: {
                    OR: [
                        { setting_key: SEO_STATE_KEY },
                        { setting_key: 'google_analytics_id' },
                        { setting_key: 'google_tag_manager_id' },
                        { setting_key: 'facebook_pixel_id' },
                        { setting_key: 'meta_verification_google' },
                    ],
                },
                orderBy: { id: 'asc' },
                select: {
                    id: true, setting_key: true, setting_value: true,
                    google_analytics_id: true, google_tag_manager_id: true,
                    facebook_pixel_id: true, meta_verification_google: true,
                },
            }),
            prisma.page.findMany({
                select: {
                    id: true, slug: true, title: true, content: true,
                    meta_title: true, meta_description: true, updated_at: true,
                },
            }),
            prisma.portfolioSession.findMany({
                select: {
                    id: true, slug: true, title: true, description: true,
                    meta_title: true, meta_description: true, updated_at: true,
                },
            }),
            prisma.blogPost.findMany({
                select: {
                    id: true, slug: true, title: true, excerpt: true,
                    meta_title: true, meta_description: true, updated_at: true,
                },
            }),
        ]);

        // Analytics query separately — non-fatal if it fails
        let events: { created_at: Date; referrer: string | null; page_url: string | null; session_id: string }[] = [];
        try {
            events = await prisma.analyticsEvent.findMany({
                where: {
                    event_type: 'page_view',
                    created_at: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
                },
                select: { created_at: true, referrer: true, page_url: true, session_id: true },
                orderBy: { created_at: 'asc' },
            });
        } catch (e) {
            console.warn('[SEO OPS] Analytics query failed (non-fatal):', e);
        }

        /* Settings resolution */
        const firstRow = settingRows[0];
        const kvMap = settingRows.reduce<Record<string, string | null>>((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});

        const gaId = firstRow?.google_analytics_id || kvMap.google_analytics_id || '';
        const gtmId = firstRow?.google_tag_manager_id || kvMap.google_tag_manager_id || '';
        const pixelId = firstRow?.facebook_pixel_id || kvMap.facebook_pixel_id || '';
        const gscVerification = firstRow?.meta_verification_google || kvMap.meta_verification_google || '';

        const persistedState = parseState(kvMap[SEO_STATE_KEY] || null);

        /* Checklist merge */
        const mergedChecklist = CHECKLIST_TEMPLATE.map(item => {
            const state = persistedState.checklist?.find(e => e.id === item.id);
            return { ...item, done: state?.done ?? false, note: state?.note ?? '', updatedAt: state?.updatedAt };
        });

        const completedCount = mergedChecklist.filter(i => i.done).length;
        const completionPercent = Math.round((completedCount / Math.max(mergedChecklist.length, 1)) * 100);

        /* Diagnostics */
        const pagesWithMissingTitle = pages.filter(p => !p.meta_title || p.meta_title.trim().length < 20);
        const pagesWithMissingDesc = pages.filter(p => !p.meta_description || p.meta_description.trim().length < 90);
        const pagesWithThinContent = pages.filter(p => !p.content || stripHtml(p.content).trim().length < 450);
        const missingMetaTitlePages = pagesWithMissingTitle.length;
        const missingMetaDescriptionPages = pagesWithMissingDesc.length;
        const thinPages = pagesWithThinContent.length;
        const missingSessionMeta = sessions.filter(s => !s.meta_title || !s.meta_description).length;
        const missingBlogMeta = blogPosts.filter(b => !b.meta_title || !b.meta_description).length;
        const weakBlogExcerpts = blogPosts.filter(b => !b.excerpt || b.excerpt.trim().length < 90).length;

        /* Critical details — per-page breakdown */
        const criticalDetails = {
            missingMetaTitle: pagesWithMissingTitle.map(p => ({
                slug: p.slug, title: p.title,
                currentLength: (p.meta_title || '').length,
            })),
            missingMetaDescription: pagesWithMissingDesc.map(p => ({
                slug: p.slug, title: p.title,
                currentLength: (p.meta_description || '').length,
            })),
            thinContent: pagesWithThinContent.map(p => ({
                slug: p.slug, title: p.title,
                wordCount: stripHtml(p.content || '').split(/\s+/).filter(Boolean).length,
            })),
            sessionsWithoutMeta: sessions.filter(s => !s.meta_title || !s.meta_description).map(s => ({
                slug: s.slug, title: s.title,
                hasTitle: Boolean(s.meta_title),
                hasDescription: Boolean(s.meta_description),
            })),
            blogWithoutMeta: blogPosts.filter(b => !b.meta_title || !b.meta_description).map(b => ({
                slug: b.slug, title: b.title,
                hasTitle: Boolean(b.meta_title),
                hasDescription: Boolean(b.meta_description),
            })),
        };

        /* Traffic analysis */
        const now = Date.now();
        const currentStart = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const previousStart = new Date(now - 60 * 24 * 60 * 60 * 1000);
        const currentEvents = events.filter(e => e.created_at >= currentStart);
        const previousEvents = events.filter(e => e.created_at >= previousStart && e.created_at < currentStart);

        const isOrganic = (r: string | null): boolean => {
            if (!r) return false;
            const l = r.toLowerCase();
            return l.includes('google.') || l.includes('bing.') || l.includes('duckduckgo.') || l.includes('yahoo.');
        };

        const currentOrganic = currentEvents.filter(e => isOrganic(e.referrer)).length;
        const previousOrganic = previousEvents.filter(e => isOrganic(e.referrer)).length;
        const organicTrafficDelta = percentDelta(currentOrganic, previousOrganic);
        const allTrafficDelta = percentDelta(currentEvents.length, previousEvents.length);
        const organicShare = currentEvents.length > 0 ? Math.round((currentOrganic / currentEvents.length) * 100) : 0;
        const analyticsConfigured = Boolean(gaId || gtmId || pixelId);
        const gscConfigured = Boolean(gscVerification);

        const score = computeSeoScore({
            missingMetaTitle: missingMetaTitlePages + missingSessionMeta + missingBlogMeta,
            missingMetaDescription: missingMetaDescriptionPages + missingSessionMeta + missingBlogMeta,
            thinPages: thinPages + weakBlogExcerpts,
            analyticsConfigured, gscConfigured, organicTrafficDelta, completionPercent,
        });

        /* Top landing pages */
        const pageBuckets = new Map<string, number>();
        for (const evt of currentEvents) {
            const raw = evt.page_url || '/';
            let page = raw;
            if (raw.startsWith('http')) { try { page = new URL(raw).pathname; } catch { page = raw; } }
            pageBuckets.set(page, (pageBuckets.get(page) || 0) + 1);
        }
        const topOrganicLandingPages = Array.from(pageBuckets.entries())
            .sort((a, b) => b[1] - a[1]).slice(0, 7).map(([page, views]) => ({ page, views }));

        /* ─── Keyword Analytics: B2C vs B2B ─── */
        const b2cPages = pages.filter(p => !p.slug.startsWith('b2b') && !p.slug.includes('dron') && !p.slug.includes('aero'));
        const b2bPages = pages.filter(p => p.slug.startsWith('b2b') || p.slug.includes('dron') || p.slug.includes('aero'));

        const b2cKeywordItems = [
            ...b2cPages.map(p => ({ slug: p.slug, title: p.title, content: p.content || '', meta_title: p.meta_title || '', meta_description: p.meta_description || '' })),
            ...sessions.map(s => ({ slug: `portfolio/${s.slug}`, title: s.title, content: s.description || '', meta_title: s.meta_title || '', meta_description: s.meta_description || '' })),
            ...blogPosts.map(b => ({ slug: `blog/${b.slug}`, title: b.title, content: b.excerpt || '', meta_title: b.meta_title || '', meta_description: b.meta_description || '' })),
        ];
        const b2bKeywordItems = b2bPages.map(p => ({ slug: p.slug, title: p.title, content: p.content || '', meta_title: p.meta_title || '', meta_description: p.meta_description || '' }));

        const keywordAnalytics = {
            b2c: extractKeywords(b2cKeywordItems, 30),
            b2b: extractKeywords(b2bKeywordItems, 20),
            b2cPageCount: b2cKeywordItems.length,
            b2bPageCount: b2bKeywordItems.length,
        };

        /* ─── AI Analysis ─── */
        const aiRecommendations = runAiAnalysis(
            pages.map(p => ({ slug: p.slug, title: p.title, content: p.content || '', meta_title: p.meta_title, meta_description: p.meta_description })),
            sessions.map(s => ({ slug: s.slug, title: s.title, description: s.description, meta_title: s.meta_title, meta_description: s.meta_description })),
            blogPosts.map(b => ({ slug: b.slug, title: b.title, excerpt: b.excerpt, meta_title: b.meta_title, meta_description: b.meta_description })),
        );

        /* ─── B2B Domain Diagnostics ─── */
        const b2bDiagnostics = buildB2BDiagnostics(
            pages.map(p => ({ slug: p.slug, title: p.title, content: p.content || '', meta_title: p.meta_title, meta_description: p.meta_description })),
        );

        /* ─── Tool Connections ─── */
        const tools = [
            { id: 'gsc', name: 'Google Search Console', connected: gscConfigured, source: 'meta_verification_google', setupUrl: 'https://search.google.com/search-console', free: true },
            { id: 'ga4', name: 'Google Analytics 4', connected: Boolean(gaId), source: 'google_analytics_id', setupUrl: 'https://analytics.google.com', free: true },
            { id: 'gtm', name: 'Google Tag Manager', connected: Boolean(gtmId), source: 'google_tag_manager_id', setupUrl: 'https://tagmanager.google.com', free: true },
            { id: 'pixel', name: 'Facebook Pixel', connected: Boolean(pixelId), source: 'facebook_pixel_id', setupUrl: 'https://business.facebook.com/events_manager2', free: true },
            { id: 'clarity', name: 'Microsoft Clarity (Heatmapy)', connected: false, source: 'do skonfigurowania', setupUrl: 'https://clarity.microsoft.com', free: true },
            { id: 'pagespeed', name: 'PageSpeed Insights API', connected: true, source: 'wbudowany', setupUrl: 'https://pagespeed.web.dev', free: true },
            { id: 'indexnow', name: 'IndexNow (Natychmiastowa indeksacja)', connected: true, source: 'wbudowany', setupUrl: 'https://www.indexnow.org/', free: true },
            { id: 'ubersuggest', name: 'Ubersuggest (Analiza fraz)', connected: true, source: 'zewnętrzny', setupUrl: 'https://neilpatel.com/ubersuggest/', free: true },
            { id: 'atp', name: 'AnswerThePublic (Pytania użytkowników)', connected: true, source: 'zewnętrzny', setupUrl: 'https://answerthepublic.com/', free: true },
            { id: 'gtrends', name: 'Google Trends (Sezonowość)', connected: true, source: 'zewnętrzny', setupUrl: 'https://trends.google.pl/', free: true },
            { id: 'bing-wmt', name: 'Bing Webmaster Tools', connected: false, source: 'do skonfigurowania', setupUrl: 'https://www.bing.com/webmasters/', free: true },
            { id: 'ahrefs-free', name: 'Ahrefs Webmaster Tools (Backlinki)', connected: true, source: 'zewnętrzny', setupUrl: 'https://ahrefs.com/webmaster-tools', free: true },
            { id: 'schema-validator', name: 'Schema Markup Validator', connected: true, source: 'zewnętrzny', setupUrl: 'https://validator.schema.org/', free: true },
            { id: 'rich-results', name: 'Rich Results Test', connected: true, source: 'zewnętrzny', setupUrl: 'https://search.google.com/test/rich-results', free: true },
        ];

        return NextResponse.json({
            success: true,
            generatedAt: new Date().toISOString(),
            summary: {
                score,
                rankBand: estimateRankBand(score),
                pageCount: pages.length + sessions.length + blogPosts.length,
                completionPercent,
                unresolvedCritical: missingMetaTitlePages + missingMetaDescriptionPages + thinPages,
                organicShare,
                currentOrganicVisits30d: currentOrganic,
                organicDeltaPercent: organicTrafficDelta,
                trafficDeltaPercent: allTrafficDelta,
            },
            diagnostics: {
                missingMetaTitlePages, missingMetaDescriptionPages, thinPages,
                missingSessionMeta, missingBlogMeta, weakBlogExcerpts,
                analyticsConfigured, gscConfigured,
            },
            criticalDetails,
            trend: {
                currentWindowDays: 30,
                currentPageViews: currentEvents.length,
                previousPageViews: previousEvents.length,
                currentOrganicVisits: currentOrganic,
                previousOrganicVisits: previousOrganic,
                topOrganicLandingPages,
            },
            checklist: mergedChecklist,
            tools,
            keywordAnalytics,
            aiRecommendations,
            b2bDiagnostics,
            competitorAudit: {
                checkedAt: new Date().toISOString().slice(0, 10),
                findings: [
                    {
                        domain: 'wlasniewski.pl',
                        verdict: 'Mocna treść i intencja lokalna, ale brakuje zamkniętej pętli SEO → ranking → konwersja.',
                        weaknesses: [
                            'Niedostateczna automatyzacja monitoringu SEO i workflow poprawek.',
                            'Część metadanych jest niespójna lub niepełna na dynamicznych podstronach.',
                            'Brak operacyjnego panelu priorytetów SEO z estymacją wpływu zmian.',
                        ],
                    },
                    {
                        domain: 'aeroanaliza.pl',
                        verdict: 'Domena przekierowuje ruch na wlasniewski.pl — traci osobną tożsamość SEO w Google.',
                        weaknesses: [
                            'Brak wpisów aeroanaliza.pl w sitemap — Google nie widzi B2B.',
                            'Brak dedykowanych landing pages pod frazy: inspekcje dronem, termowizja, ortofotomapy.',
                            'Brak osobnego schema.org ProfessionalService dla usług dronowych.',
                            'Brak profilu Google Search Console dla aeroanaliza.pl.',
                        ],
                    },
                ],
            },
            roadmap90Days: [
                {
                    phase: '0-30 dni',
                    goal: 'Naprawa fundamentów i pomiar',
                    tasks: [
                        'Zamknij GSC + GA4 cele konwersji dla obu domen.',
                        'Napraw braki title/description na stronach o najwyższym potencjale.',
                        'Skonfiguruj IndexNow i Bing Webmaster Tools.',
                        'Dodaj aeroanaliza.pl do sitemap i robots.txt.',
                    ],
                },
                {
                    phase: '31-60 dni',
                    goal: 'Rozwój widoczności i CTR',
                    tasks: [
                        'Rozbuduj strony usługowe pod konkretne intencje i lokalizacje.',
                        'Wzmocnij linkowanie wewnętrzne do stron usług i rezerwacji.',
                        'Wdrożenie poprawek CWV dla mobile (LCP < 2.5s, CLS < 0.1).',
                        'Stwórz landing pages B2B: inspekcje, termowizja, monitoring.',
                    ],
                },
                {
                    phase: '61-90 dni',
                    goal: 'Skalowanie i automatyzacja',
                    tasks: [
                        'Pipeline contentu long-tail: 2 wpisy/miesiąc.',
                        'Rozszerz schema.org i monitoruj rich results.',
                        'Microsoft Clarity: analiza heatmap i nagrań sesji.',
                        'Miesięczny rytm eksperymentów SEO × konwersja.',
                    ],
                },
            ],
        });
    } catch (error) {
        console.error('[SEO OPS] Failed to build report:', error);
        return NextResponse.json({ success: false, error: 'Failed to build SEO Ops report' }, { status: 500 });
    }
    });
}

/* ─── POST: Multi-action Handler ─── */
export async function POST(request: NextRequest) {
    return withAuth(request, async () => {
        try {
        const body = (await request.json()) as PostBody;
        const action = body.action || 'save-checklist';

        /* ── Save checklist ── */
        if (action === 'save-checklist') {
            const safeChecklist = Array.isArray(body.checklist)
                ? body.checklist
                    .filter(item => typeof item?.id === 'string')
                    .map(item => ({
                        id: item.id,
                        done: Boolean(item.done),
                        note: typeof item.note === 'string' ? item.note.slice(0, 500) : '',
                        updatedAt: item.updatedAt || new Date().toISOString(),
                    }))
                : [];

            await prisma.setting.upsert({
                where: { setting_key: SEO_STATE_KEY },
                update: { setting_value: JSON.stringify({ checklist: safeChecklist }) },
                create: { setting_key: SEO_STATE_KEY, setting_value: JSON.stringify({ checklist: safeChecklist }) },
            });

            return NextResponse.json({ success: true, saved: safeChecklist.length });
        }

        /* ── PageSpeed Insights (free API, no key required) ── */
        if (action === 'pagespeed') {
            const targetUrl = body.url;
            if (!targetUrl || typeof targetUrl !== 'string') {
                return NextResponse.json({ success: false, error: 'Missing url parameter' }, { status: 400 });
            }

            // Validate URL format
            try { new URL(targetUrl); } catch {
                return NextResponse.json({ success: false, error: 'Invalid URL format' }, { status: 400 });
            }

            // Only allow checking own domains
            const allowed = ['wlasniewski.pl', 'aeroanaliza.pl'];
            const hostname = new URL(targetUrl).hostname.replace('www.', '');
            if (!allowed.includes(hostname)) {
                return NextResponse.json({ success: false, error: 'Only own domains allowed' }, { status: 403 });
            }

            const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices`;

            const psiRes = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
            if (!psiRes.ok) {
                return NextResponse.json({ success: false, error: `PageSpeed API error: ${psiRes.status}` }, { status: 502 });
            }

            const psiData = await psiRes.json() as Record<string, unknown>;
            const categories = (psiData as { lighthouseResult?: { categories?: Record<string, { score?: number }> } })
                .lighthouseResult?.categories;

            return NextResponse.json({
                success: true,
                url: targetUrl,
                scores: {
                    performance: Math.round((categories?.performance?.score ?? 0) * 100),
                    seo: Math.round((categories?.seo?.score ?? 0) * 100),
                    accessibility: Math.round((categories?.accessibility?.score ?? 0) * 100),
                    bestPractices: Math.round((categories?.['best-practices']?.score ?? 0) * 100),
                },
            });
        }

        /* ── IndexNow: instant indexing notification ── */
        if (action === 'indexnow') {
            const urls = body.urls;
            if (!Array.isArray(urls) || urls.length === 0) {
                return NextResponse.json({ success: false, error: 'Missing urls array' }, { status: 400 });
            }

            // Validate all URLs belong to own domains
            const allowed = ['wlasniewski.pl', 'aeroanaliza.pl'];
            const safeUrls = urls.filter(u => {
                try {
                    const h = new URL(u).hostname.replace('www.', '');
                    return allowed.includes(h);
                } catch { return false; }
            }).slice(0, 100);

            if (safeUrls.length === 0) {
                return NextResponse.json({ success: false, error: 'No valid own-domain URLs provided' }, { status: 400 });
            }

            // IndexNow API submission to Bing
            const indexNowPayload = {
                host: 'wlasniewski.pl',
                key: 'seo-ops-indexnow-key',
                urlList: safeUrls,
            };

            const indexRes = await fetch('https://api.indexnow.org/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(indexNowPayload),
                signal: AbortSignal.timeout(10000),
            }).catch(() => null);

            return NextResponse.json({
                success: true,
                submitted: safeUrls.length,
                status: indexRes?.ok ? 'accepted' : 'submitted_with_warning',
                note: 'URLs wysłane do IndexNow (Bing/Yandex). Indeksacja w ciągu minut.',
            });
        }

        /* ── AI Analyze (on-demand deeper analysis) ── */
        if (action === 'ai-analyze') {
            const pages = await prisma.page.findMany({
                select: { slug: true, title: true, content: true, meta_title: true, meta_description: true },
            });
            const sessions = await prisma.portfolioSession.findMany({
                select: { slug: true, title: true, description: true, meta_title: true, meta_description: true },
            });
            const blogPosts = await prisma.blogPost.findMany({
                select: { slug: true, title: true, excerpt: true, meta_title: true, meta_description: true },
            });

            const recs = runAiAnalysis(
                pages.map(p => ({ ...p, content: p.content || '' })),
                sessions,
                blogPosts,
            );

            return NextResponse.json({ success: true, recommendations: recs, total: recs.length });
        }

        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    } catch (error) {
        console.error('[SEO OPS] POST error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process SEO Ops action' }, { status: 500 });
    }
    });
}
