import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { isB2bCmsPage } from '@/lib/sites/b2b-routing';

export const dynamic = 'force-dynamic';

// ─── Types ───
type AutopilotAction =
    | 'auto-fix-meta'
    | 'inject-faq-schema'
    | 'inject-service-schema'
    | 'indexnow-b2c'
    | 'indexnow-b2b'
    | 'indexnow-all'
    | 'preview'
    | 'ai-generate'
    | 'status';

type Tone = 'professional' | 'friendly' | 'luxury' | 'dynamic' | 'emotional';

type PostBody = {
    action: AutopilotAction;
    domain?: 'b2c' | 'b2b' | 'all';
    previewAction?: string;
    tone?: Tone;
    targetSlug?: string;
    field?: 'meta_title' | 'meta_description';
};

// ─── Tone definitions for text generation ───
const TONE_CONFIG: Record<Tone, { suffix_b2c: string; suffix_b2b: string; cta_b2c: string; cta_b2b: string; style: string }> = {
    professional: {
        suffix_b2c: ' | Właśniewski Fotograf',
        suffix_b2b: ' | FOTO-DRON aeroanaliza.pl',
        cta_b2c: 'Sprawdź ofertę i zarezerwuj sesję.',
        cta_b2b: 'Zamów bezpłatną wycenę.',
        style: 'Rzeczowy, konkretny, ekspercki ton',
    },
    friendly: {
        suffix_b2c: ' | Właśniewski Fotografia ❤️',
        suffix_b2b: ' | FOTO-DRON — Twój partner dronowy',
        cta_b2c: 'Napisz do mnie — razem stworzymy piękne zdjęcia!',
        cta_b2b: 'Porozmawiajmy o Twoim projekcie — bez zobowiązań!',
        style: 'Ciepły, przyjazny, bezpośredni ton',
    },
    luxury: {
        suffix_b2c: ' | Fotografia Artystyczna Właśniewski',
        suffix_b2b: ' | FOTO-DRON — Precyzja z powietrza',
        cta_b2c: 'Zarezerwuj ekskluzywną sesję — ograniczona liczba terminów.',
        cta_b2b: 'Skorzystaj z precyzyjnej analizy dronowej najwyższej klasy.',
        style: 'Elegancki, prestiżowy, ekskluzywny ton',
    },
    dynamic: {
        suffix_b2c: ' | Właśniewski — Fotograf z pasją',
        suffix_b2b: ' | FOTO-DRON — Technologia w akcji',
        cta_b2c: 'Nie czekaj — zarezerwuj termin już teraz!',
        cta_b2b: 'Działaj szybciej — zamów analizę dronem!',
        style: 'Energiczny, motywujący, dynamiczny ton',
    },
    emotional: {
        suffix_b2c: ' | Chwile, które zostaną na zawsze',
        suffix_b2b: ' | FOTO-DRON — Widzimy więcej',
        cta_b2c: 'Pozwól mi opowiedzieć Twoją historię w zdjęciach.',
        cta_b2b: 'Odkryj to, co niewidoczne gołym okiem.',
        style: 'Emocjonalny, narracyjny, poetycki ton',
    },
};

// ─── SEO Rule Engine ───
function generateMetaTitle(title: string, domain: 'b2c' | 'b2b' = 'b2c', tone: Tone = 'professional'): string {
    const config = TONE_CONFIG[tone];
    const suffix = domain === 'b2b' ? config.suffix_b2b : config.suffix_b2c;
    const maxBase = 60 - suffix.length;
    const base = title.length > maxBase ? title.slice(0, maxBase - 3) + '...' : title;
    return `${base}${suffix}`;
}

function generateMetaDescription(content: string, title: string, domain: 'b2c' | 'b2b' = 'b2c', tone: Tone = 'professional'): string {
    const config = TONE_CONFIG[tone];
    const plain = content
        .replace(/<[^>]*>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const cta = domain === 'b2b' ? config.cta_b2b : config.cta_b2c;
    const location = domain === 'b2b' ? 'Toruń i okolice' : 'Toruń';
    // Build rich description even when CMS content is empty
    let desc: string;
    if (plain.length > 30) {
        const prefix = plain.slice(0, 120).trim();
        desc = `${prefix}. ${cta}`;
    } else {
        // No CMS content — generate from title + location + CTA
        desc = `${title} — ${location}. ${cta}`;
        if (desc.length < 80) {
            const extra = domain === 'b2b'
                ? ' Profesjonalne usługi dronem, termowizja, ortofotomapy.'
                : ' Profesjonalna fotografia: śluby, sesje rodzinne, eventy.';
            desc += extra;
        }
    }
    return desc.slice(0, 155);
}

// ─── AI Text Generator (rule-based with tone awareness) ───
function aiGenerateText(
    title: string,
    content: string,
    field: 'meta_title' | 'meta_description',
    domain: 'b2c' | 'b2b',
    tone: Tone
): { text: string; charCount: number; toneLabel: string } {
    const config = TONE_CONFIG[tone];
    let text: string;

    if (field === 'meta_title') {
        text = generateMetaTitle(title, domain, tone);
    } else {
        text = generateMetaDescription(content, title, domain, tone);
    }

    return { text, charCount: text.length, toneLabel: config.style };
}

// ─── FAQ Data with tones ───
function getFaqData(domain: 'b2c' | 'b2b', tone: Tone) {
    const config = TONE_CONFIG[tone];

    const b2bFaqs = [
        { q: 'Ile kosztuje inspekcja dachu dronem?', a: tone === 'luxury' ? 'Cena inspekcji zależy od zakresu — standardowa analiza dachu to ok. 500-800 zł. Każde zlecenie traktujemy indywidualnie. Wycena jest bezpłatna i niezobowiązująca.' : tone === 'friendly' ? 'Standardowa inspekcja dachu to ok. 500-800 zł, a wycena jest zawsze bezpłatna! Napisz do nas — chętnie pomożemy dobrać najlepszą opcję.' : 'Cena zależy od powierzchni i zakresu inspekcji. Standardowa inspekcja dachu jednorodzinnego to ok. 500-800 zł. Wycena jest zawsze bezpłatna — zadzwoń lub napisz.' },
        { q: 'Czy potrzebujecie zezwolenia na loty w okolicy lotniska?', a: 'Tak, posiadamy licencję UAVO i uzyskujemy wymagane zezwolenia ULC dla każdej lokalizacji. Loty w strefach kontrolowanych wymagają dodatkowej notyfikacji.' },
        { q: 'Jak szybko otrzymam raport po inspekcji?', a: tone === 'dynamic' ? 'Raport PDF gotowy w 48h od lotu! Zawiera zdjęcia, mapę anomalii i konkretne rekomendacje — działaj szybko z naszymi danymi.' : 'Raport PDF z wynikami termowizji dostarczamy w ciągu 48 godzin od wykonania lotu. Raport zawiera zdjęcia, mapę anomalii i rekomendacje.' },
        { q: 'Jaki obszar obejmujecie usługami?', a: 'Działamy w Toruniu, Bydgoszczy, Grudziądzu, Chełmnie, Wąbrzeźnie i całym województwie kujawsko-pomorskim. Na zlecenie realizujemy usługi w całej Polsce.' },
        { q: 'Czy kamera termowizyjna wykryje uszkodzone panele PV?', a: 'Tak, Mavic 3 Thermal z kamerą radiometryczną 640×512px dokładnie wykrywa hotspoty, uszkodzone ogniwa i zacienione moduły fotowoltaiczne.' },
    ];

    const b2cFaqs = [
        { q: 'Ile kosztuje sesja fotograficzna w Toruniu?', a: tone === 'luxury' ? 'Sesje portretowe rozpoczynają się od 350 zł, rodzinne od 450 zł, a ekskluzywne reportaże ślubne od 1800 zł. Każda sesja to starannie zaplanowane doświadczenie.' : tone === 'emotional' ? 'Sesje od 350 zł za portret, od 450 zł za rodzinną, od 1800 zł za ślubną. Bo piękne wspomnienia nie mają ceny — ale mogą mieć przystępną cenę.' : 'Ceny sesji zaczynają się od 350 zł za sesję portretową. Sesje rodzinne od 450 zł, ślubne od 1800 zł. Szczegółowy cennik znajdziesz na stronie rezerwacji.' },
        { q: 'Jak długo czekam na zdjęcia po sesji?', a: tone === 'dynamic' ? 'Podgląd miniatur w 7 dni, pełna galeria w 2-3 tygodnie. Szybko i na czas — zawsze!' : 'Standardowy czas dostawy to 2-3 tygodnie. Galerię online z podglądem miniatur dostarczam w ciągu 7 dni od sesji.' },
        { q: 'Czy robicie sesje w Bydgoszczy lub Grudziądzu?', a: 'Tak, wykonuję sesje w całym regionie kujawsko-pomorskim: Toruń, Bydgoszcz, Grudziądz, Chełmno, Wąbrzeźno i okolice.' },
        { q: 'Jak zarezerwować termin sesji?', a: tone === 'friendly' ? 'Najprościej? Przez formularz na stronie Rezerwacja! Możesz też napisać na kontakt@wlasniewski.pl lub zadzwonić: +48 530 788 694. Odezwę się szybko! 😊' : 'Możesz zarezerwować sesję online przez formularz na stronie Rezerwacja lub napisać bezpośrednio: kontakt@wlasniewski.pl. Telefon: +48 530 788 694.' },
        { q: 'Co to jest sesja naturalistyczna?', a: tone === 'emotional' ? 'To sesja, gdzie nie ma póz — jest prawda. Fotografuję śmiech, czułość, zabawę tak, jak się naprawdę dzieją. Bo najpiękniejsze chwile to te autentyczne.' : 'Sesja naturalistyczna to sesja w plenerze bez ustawionych póz. Fotografuję autentyczne chwile i emocje — śmiech, zabawę, czułość. Idealna dla rodzin z dziećmi.' },
    ];

    return domain === 'b2b' ? b2bFaqs : b2cFaqs;
}

// ─── Service Schema Data ───
function getServiceSchemaData(domain: 'b2c' | 'b2b') {
    if (domain === 'b2b') {
        return {
            '@context': 'https://schema.org',
            '@graph': [
                { '@type': 'Service', name: 'Inspekcje Termowizyjne Dronem', provider: { '@type': 'LocalBusiness', name: 'FOTO-DRON Przemysław Właśniewski' }, serviceType: 'Inspekcja termowizyjna', areaServed: { '@type': 'State', name: 'Kujawsko-Pomorskie' }, description: 'Wykrywanie mostków cieplnych, awarii paneli PV, inspekcje dachów kamerą Mavic 3 Thermal 640×512px.', url: 'https://aeroanaliza.pl/dron' },
                { '@type': 'Service', name: 'Monitoring Inwestycji Budowlanych', provider: { '@type': 'LocalBusiness', name: 'FOTO-DRON Przemysław Właśniewski' }, serviceType: 'Dokumentacja budowy', areaServed: { '@type': 'State', name: 'Kujawsko-Pomorskie' }, description: 'Timeline budowy z lotu ptaka. Regularne zdjęcia z tej samej perspektywy i raporty PDF dla inwestorów.', url: 'https://aeroanaliza.pl' },
                { '@type': 'Service', name: 'Ortofotomapy i Rolnictwo Precyzyjne', provider: { '@type': 'LocalBusiness', name: 'FOTO-DRON Przemysław Właśniewski' }, serviceType: 'Fotogrametria', areaServed: { '@type': 'State', name: 'Kujawsko-Pomorskie' }, description: 'Szacowanie szkód łowieckich, analiza stanu upraw, mapy GeoTIFF dla GIS.', url: 'https://aeroanaliza.pl' },
            ],
        };
    }
    return {
        '@context': 'https://schema.org',
        '@graph': [
            { '@type': 'Service', name: 'Sesja Ślubna', provider: { '@type': 'LocalBusiness', name: 'Przemysław Właśniewski Fotografia' }, serviceType: 'Fotografia ślubna', areaServed: [{ '@type': 'City', name: 'Toruń' }, { '@type': 'City', name: 'Bydgoszcz' }], description: 'Naturalna dokumentacja ślubna — bez ustawianych, sztucznych póz. Reportaż ślubny i sesja plenerowa.', url: 'https://wlasniewski.pl/rezerwacja' },
            { '@type': 'Service', name: 'Sesja Rodzinna', provider: { '@type': 'LocalBusiness', name: 'Przemysław Właśniewski Fotografia' }, serviceType: 'Fotografia rodzinna', areaServed: [{ '@type': 'City', name: 'Toruń' }, { '@type': 'City', name: 'Bydgoszcz' }], description: 'Sesje rodzinne w plenerze. Naturalne ujęcia, prawdziwe emocje. Toruń, okolice, kujawsko-pomorskie.', url: 'https://wlasniewski.pl/rezerwacja' },
            { '@type': 'Service', name: 'Sesja Komunijna', provider: { '@type': 'LocalBusiness', name: 'Przemysław Właśniewski Fotografia' }, serviceType: 'Fotografia komunijna', areaServed: { '@type': 'City', name: 'Toruń' }, description: 'Sesje komunijne w plenerze i kościele. Pakiety ze zdjęciami cyfrowymi i albumem.', url: 'https://wlasniewski.pl/rezerwacja' },
        ],
    };
}

// ─── IndexNow URL lists ───
const INDEXNOW_URLS = {
    b2c: [
        'https://wlasniewski.pl/',
        'https://wlasniewski.pl/rezerwacja',
        'https://wlasniewski.pl/portfolio',
        'https://wlasniewski.pl/blog',
        'https://wlasniewski.pl/o-mnie',
        'https://wlasniewski.pl/jak-sie-ubrac',
        'https://wlasniewski.pl/foto-wyzwanie',
    ],
    b2b: [
        'https://aeroanaliza.pl/',
        'https://aeroanaliza.pl/dron',
    ],
};

// ─── GET: Status / History ───
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const [pages, seoStateRow] = await Promise.all([
                prisma.page.findMany({
                    select: { id: true, slug: true, page_type: true, title: true, meta_title: true, meta_description: true, is_published: true },
                }),
                prisma.setting.findUnique({ where: { setting_key: 'seo_autopilot_log' } }),
            ]);

            const b2cPages = pages.filter(p => !isB2bCmsPage(p));
            const b2bPages = pages.filter(isB2bCmsPage);

            const missingMetaB2C = b2cPages.filter(p => !p.meta_title || p.meta_title.length < 20 || !p.meta_description || p.meta_description.length < 50);
            const missingMetaB2B = b2bPages.filter(p => !p.meta_title || p.meta_title.length < 20 || !p.meta_description || p.meta_description.length < 50);

            let log: AutopilotLogEntry[] = [];
            try { log = JSON.parse(seoStateRow?.setting_value || '[]'); } catch { log = []; }

            return NextResponse.json({
                success: true,
                status: {
                    b2c: {
                        totalPages: b2cPages.length,
                        missingMeta: missingMetaB2C.length,
                        readyToFix: missingMetaB2C.map(p => ({ slug: p.slug, title: p.title })),
                    },
                    b2b: {
                        totalPages: b2bPages.length,
                        missingMeta: missingMetaB2B.length,
                        readyToFix: missingMetaB2B.map(p => ({ slug: p.slug, title: p.title })),
                    },
                },
                log: log.slice(-20), // last 20 actions
                generatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('[SEO Autopilot] GET error:', error);
            return NextResponse.json({ success: false, error: 'Failed to get autopilot status' }, { status: 500 });
        }
    });
}

// ─── Log helper ───
type AutopilotLogEntry = {
    action: string;
    domain: string;
    affectedCount: number;
    detail: string;
    executedAt: string;
};

async function appendLog(entry: AutopilotLogEntry) {
    const existing = await prisma.setting.findUnique({ where: { setting_key: 'seo_autopilot_log' } });
    let log: AutopilotLogEntry[] = [];
    try { log = JSON.parse(existing?.setting_value || '[]'); } catch { log = []; }
    log.unshift(entry);
    if (log.length > 50) log = log.slice(0, 50); // keep last 50

    await prisma.setting.upsert({
        where: { setting_key: 'seo_autopilot_log' },
        update: { setting_value: JSON.stringify(log) },
        create: { setting_key: 'seo_autopilot_log', setting_value: JSON.stringify(log) },
    });
}

// ─── POST: Multi-action Autopilot ───
export async function POST(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const body = (await request.json()) as PostBody;
            const action = body.action;
            const tone: Tone = body.tone || 'professional';
            const executedAt = new Date().toISOString();

            // ── PREVIEW: dry-run, show what will happen ──
            if (action === 'preview') {
                const previewAction = body.previewAction || '';
                const domain = body.domain || 'b2c';

                if (previewAction === 'auto-fix-meta') {
                    const pages = await prisma.page.findMany({
                        select: { id: true, slug: true, page_type: true, title: true, content: true, meta_title: true, meta_description: true },
                    });
                    const toFix = pages.filter(p => {
                        const isB2B = isB2bCmsPage(p);
                        if (domain === 'b2c' && isB2B) return false;
                        if (domain === 'b2b' && !isB2B) return false;
                        return !p.meta_title || p.meta_title.length < 20 || !p.meta_description || p.meta_description.length < 50;
                    });

                    const previews = toFix.map(page => {
                        const isB2B = isB2bCmsPage(page);
                        const domType: 'b2c' | 'b2b' = isB2B ? 'b2b' : 'b2c';
                        return {
                            slug: page.slug,
                            title: page.title,
                            current_meta_title: page.meta_title || '(brak)',
                            current_meta_description: page.meta_description || '(brak)',
                            new_meta_title: (!page.meta_title || page.meta_title.length < 20) ? generateMetaTitle(page.title, domType, tone) : page.meta_title,
                            new_meta_description: (!page.meta_description || page.meta_description.length < 50) ? generateMetaDescription(page.content || '', page.title, domType, tone) : page.meta_description,
                        };
                    });

                    return NextResponse.json({ success: true, preview: true, action: 'auto-fix-meta', domain, tone, affectedCount: previews.length, pages: previews });
                }

                if (previewAction === 'inject-faq-schema') {
                    const faqs = getFaqData(domain as 'b2c' | 'b2b', tone);
                    const targetSlugs = domain === 'b2b' ? ['b2b'] : ['', 'strona-glowna', 'o-mnie', 'rezerwacja'];
                    const pages = await prisma.page.findMany({
                        select: { slug: true, page_type: true, title: true, content: true },
                    });
                    const domainPages = pages.filter(p => domain === 'b2b' ? isB2bCmsPage(p) : !isB2bCmsPage(p));
                    const target = domainPages.find(p => targetSlugs.includes(p.slug)) || domainPages[0];
                    const alreadyInjected = target?.content?.includes('SEO_FAQ_SCHEMA') || false;

                    return NextResponse.json({
                        success: true, preview: true, action: 'inject-faq-schema', domain, tone,
                        targetPage: target?.slug || '(brak)',
                        alreadyInjected,
                        faqCount: faqs.length,
                        faqs: faqs.map(f => ({ question: f.q, answer: f.a })),
                    });
                }

                if (previewAction === 'inject-service-schema') {
                    const schema = getServiceSchemaData(domain as 'b2c' | 'b2b');
                    const targetSlug = domain === 'b2b' ? 'b2b' : 'o-mnie';
                    const page = await prisma.page.findFirst({ where: { slug: targetSlug } });
                    const alreadyInjected = page?.content?.includes('SEO_SERVICE_SCHEMA') || false;

                    return NextResponse.json({
                        success: true, preview: true, action: 'inject-service-schema', domain,
                        targetPage: targetSlug,
                        alreadyInjected,
                        serviceCount: (schema as any)['@graph']?.length || 1,
                        services: (schema as any)['@graph']?.map((s: any) => ({ name: s.name, type: s.serviceType, description: s.description })) || [],
                    });
                }

                if (previewAction.startsWith('indexnow')) {
                    const key = previewAction === 'indexnow-all' ? 'all' : previewAction === 'indexnow-b2b' ? 'b2b' : 'b2c';
                    const urls = key === 'all' ? [...INDEXNOW_URLS.b2c, ...INDEXNOW_URLS.b2b] : INDEXNOW_URLS[key as 'b2c' | 'b2b'];
                    return NextResponse.json({ success: true, preview: true, action: previewAction, urls, urlCount: urls.length });
                }

                return NextResponse.json({ success: false, error: `Unknown preview action: ${previewAction}` }, { status: 400 });
            }

            // ── AI-GENERATE: generate text variations with different tones ──
            if (action === 'ai-generate') {
                const targetSlug = body.targetSlug;
                const field = body.field || 'meta_title';
                const domain = body.domain || 'b2c';

                const allTones: Tone[] = ['professional', 'friendly', 'luxury', 'dynamic', 'emotional'];

                if (targetSlug) {
                    const page = await prisma.page.findFirst({ where: { slug: targetSlug } });
                    if (!page) return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });

                    const variants = allTones.map(t => {
                        const result = aiGenerateText(page.title, page.content || '', field, domain as 'b2c' | 'b2b', t);
                        return { tone: t, ...result };
                    });

                    return NextResponse.json({ success: true, action: 'ai-generate', targetSlug, field, variants });
                }

                // Generate for all pages with missing meta
                const pages = await prisma.page.findMany({
                    select: { slug: true, page_type: true, title: true, content: true, meta_title: true, meta_description: true },
                });
                const toFix = pages.filter(p => {
                    const isB2B = isB2bCmsPage(p);
                    if (domain === 'b2c' && isB2B) return false;
                    if (domain === 'b2b' && !isB2B) return false;
                    return !p.meta_title || p.meta_title.length < 20 || !p.meta_description || p.meta_description.length < 50;
                });

                const results = toFix.map(page => {
                    const domType: 'b2c' | 'b2b' = isB2bCmsPage(page) ? 'b2b' : 'b2c';
                    const titleVariants = allTones.map(t => ({
                        tone: t,
                        ...aiGenerateText(page.title, page.content || '', 'meta_title', domType, t),
                    }));
                    const descVariants = allTones.map(t => ({
                        tone: t,
                        ...aiGenerateText(page.title, page.content || '', 'meta_description', domType, t),
                    }));
                    return { slug: page.slug, title: page.title, titleVariants, descVariants };
                });

                return NextResponse.json({ success: true, action: 'ai-generate', domain, pages: results });
            }

            // ── Action: auto-fix-meta ──
            if (action === 'auto-fix-meta') {
                const domain = body.domain || 'all';
                const pages = await prisma.page.findMany({
                    select: { id: true, slug: true, page_type: true, title: true, content: true, meta_title: true, meta_description: true },
                });

                const toFix = pages.filter(p => {
                    const isB2B = isB2bCmsPage(p);
                    if (domain === 'b2c' && isB2B) return false;
                    if (domain === 'b2b' && !isB2B) return false;
                    return !p.meta_title || p.meta_title.length < 20 || !p.meta_description || p.meta_description.length < 50;
                });

                const updates = await Promise.all(
                    toFix.map(async (page) => {
                        const isB2B = isB2bCmsPage(page);
                        const domainType: 'b2c' | 'b2b' = isB2B ? 'b2b' : 'b2c';

                        const newTitle = (!page.meta_title || page.meta_title.length < 20)
                            ? generateMetaTitle(page.title, domainType, tone)
                            : page.meta_title;

                        const newDesc = (!page.meta_description || page.meta_description.length < 50)
                            ? generateMetaDescription(page.content || '', page.title, domainType, tone)
                            : page.meta_description;

                        await prisma.page.update({
                            where: { id: page.id },
                            data: { meta_title: newTitle, meta_description: newDesc },
                        });

                        return { slug: page.slug, title: newTitle };
                    })
                );

                await appendLog({
                    action: `auto-fix-meta [${tone}]`,
                    domain,
                    affectedCount: updates.length,
                    detail: `Naprawiono meta dla: ${updates.map(u => u.slug).join(', ') || 'brak'} (ton: ${tone})`,
                    executedAt,
                });

                return NextResponse.json({
                    success: true, action: 'auto-fix-meta', affectedPages: updates.length, pages: updates, tone,
                    message: `Uzupełniono meta title i meta description dla ${updates.length} stron (ton: ${TONE_CONFIG[tone].style}).`,
                });
            }

            // ── Action: inject-faq-schema ──
            if (action === 'inject-faq-schema') {
                const domain = body.domain || 'b2c';
                const pages = await prisma.page.findMany({
                    select: { id: true, slug: true, page_type: true, title: true, content: true },
                });

                const faqs = getFaqData(domain as 'b2c' | 'b2b', tone);

                const faqSchema = {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: faqs.map(({ q, a }) => ({
                        '@type': 'Question',
                        name: q,
                        acceptedAnswer: { '@type': 'Answer', text: a },
                    })),
                };

                const faqBlock = `\n\n<!-- SEO_FAQ_SCHEMA -->\n<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>\n<!-- /SEO_FAQ_SCHEMA -->`;

                const targetSlugs = domain === 'b2b' ? ['b2b'] : ['', 'strona-glowna', 'o-mnie', 'rezerwacja'];
                const domainPages = pages.filter(p => domain === 'b2b' ? isB2bCmsPage(p) : !isB2bCmsPage(p));
                const target = domainPages.find(p => targetSlugs.includes(p.slug)) || domainPages[0];

                let injected = 0;
                if (target) {
                    const newContent = target.content?.includes('SEO_FAQ_SCHEMA')
                        ? target.content
                        : (target.content || '') + faqBlock;

                    await prisma.page.update({
                        where: { id: target.id },
                        data: { content: newContent },
                    });
                    injected = 1;
                }

                await appendLog({
                    action: `inject-faq-schema [${tone}]`,
                    domain,
                    affectedCount: injected,
                    detail: `Wstrzyknięto FAQ Schema (${faqs.length} pytań) na stronę: ${target?.slug || 'brak'}`,
                    executedAt,
                });

                return NextResponse.json({
                    success: true, action: 'inject-faq-schema', affectedPages: injected,
                    faqCount: faqs.length, targetPage: target?.slug, tone,
                    message: `FAQ Schema (${faqs.length} pytań i odpowiedzi) wstrzyknięte na stronę ${target?.slug}. Ton: ${TONE_CONFIG[tone].style}.`,
                });
            }

            // ── Action: inject-service-schema ──
            if (action === 'inject-service-schema') {
                const domain = body.domain || 'b2c';
                const schema = getServiceSchemaData(domain as 'b2c' | 'b2b');
                const schemaBlock = `\n\n<!-- SEO_SERVICE_SCHEMA -->\n<script type="application/ld+json">${JSON.stringify(schema)}</script>\n<!-- /SEO_SERVICE_SCHEMA -->`;

                const targetSlug = domain === 'b2b' ? 'b2b' : 'o-mnie';
                const page = await prisma.page.findFirst({ where: { slug: targetSlug } });

                let injected = 0;
                if (page) {
                    const newContent = page.content?.includes('SEO_SERVICE_SCHEMA')
                        ? page.content
                        : (page.content || '') + schemaBlock;
                    await prisma.page.update({ where: { id: page.id }, data: { content: newContent } });
                    injected = 1;
                }

                await appendLog({
                    action: 'inject-service-schema',
                    domain,
                    affectedCount: injected,
                    detail: `Wstrzyknięto Service Schema (${(schema as any)['@graph']?.length || 1} usług) na stronę: ${targetSlug}`,
                    executedAt,
                });

                return NextResponse.json({
                    success: true, action: 'inject-service-schema', affectedPages: injected,
                    serviceCount: (schema as any)['@graph']?.length || 1,
                    targetPage: targetSlug,
                    message: `Service Schema dla ${domain.toUpperCase()} wstrzyknięta. Usługi widoczne dla Google jako dane strukturalne.`,
                });
            }

            // ── Action: indexnow-* ──
            if (action === 'indexnow-b2c') {
                const urls = INDEXNOW_URLS.b2c;
                const res = await submitIndexNow(urls);
                await appendLog({ action: 'indexnow-b2c', domain: 'b2c', affectedCount: urls.length, detail: urls.join(', '), executedAt });
                return NextResponse.json({ success: true, action: 'indexnow-b2c', submitted: urls.length, indexNowStatus: res, message: `${urls.length} B2C URL-i wysłano do IndexNow.` });
            }

            if (action === 'indexnow-b2b') {
                const urls = INDEXNOW_URLS.b2b;
                const res = await submitIndexNow(urls);
                await appendLog({ action: 'indexnow-b2b', domain: 'b2b', affectedCount: urls.length, detail: urls.join(', '), executedAt });
                return NextResponse.json({ success: true, action: 'indexnow-b2b', submitted: urls.length, indexNowStatus: res, message: `${urls.length} B2B URL-i wysłano do IndexNow.` });
            }

            if (action === 'indexnow-all') {
                const allUrls = [...INDEXNOW_URLS.b2c, ...INDEXNOW_URLS.b2b];
                const res = await submitIndexNow(allUrls);
                await appendLog({ action: 'indexnow-all', domain: 'all', affectedCount: allUrls.length, detail: allUrls.join(', '), executedAt });
                return NextResponse.json({ success: true, action: 'indexnow-all', submitted: allUrls.length, indexNowStatus: res, message: `${allUrls.length} URL-i (B2C + B2B) wysłano do IndexNow.` });
            }

            return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });

        } catch (error) {
            console.error('[SEO Autopilot] POST error:', error);
            return NextResponse.json({ success: false, error: 'Autopilot action failed' }, { status: 500 });
        }
    });
}

async function submitIndexNow(urls: string[]): Promise<string> {
    try {
        const res = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                host: 'wlasniewski.pl',
                key: 'seo-ops-indexnow-key',
                urlList: urls,
            }),
            signal: AbortSignal.timeout(10000),
        });
        return res.ok ? 'accepted' : `http_${res.status}`;
    } catch {
        return 'network_error';
    }
}
