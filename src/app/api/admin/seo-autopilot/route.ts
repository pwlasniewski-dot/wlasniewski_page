import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

// ─── Types ───
type AutopilotAction =
    | 'auto-fix-meta'
    | 'inject-faq-schema'
    | 'inject-service-schema'
    | 'indexnow-b2c'
    | 'indexnow-b2b'
    | 'indexnow-all'
    | 'status';

type PostBody = {
    action: AutopilotAction;
    domain?: 'b2c' | 'b2b' | 'all';
};

// ─── SEO Rule Engine ───
// Generates optimised meta_title from page title (50-60 chars)
function generateMetaTitle(title: string, domain: 'b2c' | 'b2b' = 'b2c'): string {
    const suffix = domain === 'b2b'
        ? ' | FOTO-DRON aeroanaliza.pl'
        : ' | Właśniewski Fotograf';
    const maxBase = 60 - suffix.length;
    const base = title.length > maxBase ? title.slice(0, maxBase - 3) + '...' : title;
    return `${base}${suffix}`;
}

// Generates optimised meta_description from content (140-155 chars)
function generateMetaDescription(content: string, title: string, domain: 'b2c' | 'b2b' = 'b2c'): string {
    const plain = content
        .replace(/<[^>]*>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const prefix = plain.slice(0, 120).trim();
    const cta = domain === 'b2b'
        ? 'Zamów bezpłatną wycenę.'
        : 'Sprawdź ofertę i zarezerwuj sesję.';

    const full = prefix ? `${prefix}. ${cta}` : `${title}. ${cta}`;
    return full.slice(0, 155);
}

// ─── GET: Status / History ───
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const [pages, seoStateRow] = await Promise.all([
                prisma.page.findMany({
                    select: { id: true, slug: true, title: true, meta_title: true, meta_description: true, is_published: true },
                }),
                prisma.setting.findUnique({ where: { setting_key: 'seo_autopilot_log' } }),
            ]);

            const b2cPages = pages.filter(p => !p.slug.startsWith('b2b'));
            const b2bPages = pages.filter(p => p.slug.startsWith('b2b'));

            const missingMetaB2C = b2cPages.filter(p => !p.meta_title || p.meta_title.length < 20 || !p.meta_description || p.meta_description.length < 90);
            const missingMetaB2B = b2bPages.filter(p => !p.meta_title || p.meta_title.length < 20 || !p.meta_description || p.meta_description.length < 90);

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
            const executedAt = new Date().toISOString();

            // ── Action: auto-fix-meta ──
            // Auto-generates missing meta_title and meta_description for ALL pages
            if (action === 'auto-fix-meta') {
                const domain = body.domain || 'all';
                const pages = await prisma.page.findMany({
                    select: { id: true, slug: true, title: true, content: true, meta_title: true, meta_description: true },
                });

                const toFix = pages.filter(p => {
                    const isB2B = p.slug.startsWith('b2b');
                    if (domain === 'b2c' && isB2B) return false;
                    if (domain === 'b2b' && !isB2B) return false;
                    return !p.meta_title || p.meta_title.length < 20 || !p.meta_description || p.meta_description.length < 90;
                });

                const updates = await Promise.all(
                    toFix.map(async (page) => {
                        const isB2B = page.slug.startsWith('b2b');
                        const domainType: 'b2c' | 'b2b' = isB2B ? 'b2b' : 'b2c';

                        const newTitle = (!page.meta_title || page.meta_title.length < 20)
                            ? generateMetaTitle(page.title, domainType)
                            : page.meta_title;

                        const newDesc = (!page.meta_description || page.meta_description.length < 90)
                            ? generateMetaDescription(page.content || '', page.title, domainType)
                            : page.meta_description;

                        await prisma.page.update({
                            where: { id: page.id },
                            data: { meta_title: newTitle, meta_description: newDesc },
                        });

                        return { slug: page.slug, title: newTitle };
                    })
                );

                await appendLog({
                    action: 'auto-fix-meta',
                    domain,
                    affectedCount: updates.length,
                    detail: `Naprawiono meta dla: ${updates.map(u => u.slug).join(', ') || 'brak'}`,
                    executedAt,
                });

                return NextResponse.json({
                    success: true,
                    action: 'auto-fix-meta',
                    affectedPages: updates.length,
                    pages: updates,
                    message: `Uzupełniono meta title i meta description dla ${updates.length} stron.`,
                });
            }

            // ── Action: inject-faq-schema ──
            // Injects FAQ Schema.org JSON block into pages that have recognizable FAQ content
            if (action === 'inject-faq-schema') {
                const domain = body.domain || 'b2c';
                // Get service pages
                const pages = await prisma.page.findMany({
                    select: { id: true, slug: true, title: true, content: true },
                    where: domain === 'b2b'
                        ? { slug: { startsWith: 'b2b' } }
                        : { NOT: { slug: { startsWith: 'b2b' } } },
                });

                // B2B FAQ content
                const b2bFaqs = [
                    { q: 'Ile kosztuje inspekcja dachu dronem?', a: 'Cena zależy od powierzchni i zakresu inspekcji. Standardowa inspekcja dachu jednorodzinnego to ok. 500-800 zł. Wycena jest zawsze bezpłatna — zadzwoń lub napisz.' },
                    { q: 'Czy potrzebujecie zezwolenia na loty w okolicy lotniska?', a: 'Tak, posiadamy licencję UAVO i uzyskujemy wymagane zezwolenia ULC dla każdej lokalizacji. Loty w strefach kontrolowanych wymagają dodatkowej notyfikacji.' },
                    { q: 'Jak szybko otrzymam raport po inspekcji?', a: 'Raport PDF z wynikami termowizji dostarczamy w ciągu 48 godzin od wykonania lotu. Raport zawiera zdjęcia, mapę anomalii i rekomendacje.' },
                    { q: 'Jaki obszar obejmujecie usługami?', a: 'Działamy w Toruniu, Bydgoszczy, Grudziądzu, Chełmnie, Wąbrzeźnie i całym województwie kujawsko-pomorskim. Na zlecenie realizujemy usługi w całej Polsce.' },
                    { q: 'Czy kamera termowizyjna wykryje uszkodzone panele PV?', a: 'Tak, Mavic 3 Thermal z kamerą radiometryczną 640×512px dokładnie wykrywa hotspoty, uszkodzone ogniwa i zacienione moduły fotowoltaiczne.' },
                ];

                // B2C FAQ content
                const b2cFaqs = [
                    { q: 'Ile kosztuje sesja fotograficzna w Toruniu?', a: 'Ceny sesji zaczynają się od 350 zł za sesję portretową. Sesje rodzinne od 450 zł, ślubne od 1800 zł. Szczegółowy cennik znajdziesz na stronie rezerwacji.' },
                    { q: 'Jak długo czekam na zdjęcia po sesji?', a: 'Standardowy czas dostawy to 2-3 tygodnie. Galerię online z podglądem miniatur dostarczam w ciągu 7 dni od sesji.' },
                    { q: 'Czy robicie sesje w Bydgoszczy lub Grudziądzu?', a: 'Tak, wykonuję sesje w całym regionie kujawsko-pomorskim: Toruń, Bydgoszcz, Grudziądz, Chełmno, Wąbrzeźno i okolice.' },
                    { q: 'Jak zarezerwować termin sesji?', a: 'Możesz zarezerwować sesję online przez formularz na stronie Rezerwacja lub napisać bezpośrednio: kontakt@wlasniewski.pl. Telefon: +48 530 788 694.' },
                    { q: 'Co to jest sesja naturalistyczna?', a: 'Sesja naturalistyczna to sesja w plenerze bez ustawionych póz. Fotografuję autentyczne chwile i emocje — śmiech, zabawę, czułość. Idealna dla rodzin z dziećmi.' },
                ];

                const faqs = domain === 'b2b' ? b2bFaqs : b2cFaqs;

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

                // Target the main B2B/B2C landing page
                const targetSlugs = domain === 'b2b' ? ['b2b'] : ['', 'strona-glowna', 'o-mnie', 'rezerwacja'];
                const target = pages.find(p => targetSlugs.includes(p.slug)) || pages[0];

                let injected = 0;
                if (target) {
                    const newContent = target.content?.includes('SEO_FAQ_SCHEMA')
                        ? target.content // already injected, don't duplicate
                        : (target.content || '') + faqBlock;

                    await prisma.page.update({
                        where: { id: target.id },
                        data: { content: newContent },
                    });
                    injected = 1;
                }

                await appendLog({
                    action: 'inject-faq-schema',
                    domain,
                    affectedCount: injected,
                    detail: `Wstrzyknięto FAQ Schema (${faqs.length} pytań) na stronę: ${target?.slug || 'brak'}`,
                    executedAt,
                });

                return NextResponse.json({
                    success: true,
                    action: 'inject-faq-schema',
                    affectedPages: injected,
                    faqCount: faqs.length,
                    targetPage: target?.slug,
                    message: `FAQ Schema (${faqs.length} pytań i odpowiedzi) wstrzyknięte na stronę ${target?.slug}. Google może wyświetlić je jako rich snippet.`,
                });
            }

            // ── Action: inject-service-schema ──
            // Injects Service Schema for drone/photography services
            if (action === 'inject-service-schema') {
                const domain = body.domain || 'b2c';

                const b2bServiceSchema = {
                    '@context': 'https://schema.org',
                    '@graph': [
                        {
                            '@type': 'Service',
                            name: 'Inspekcje Termowizyjne Dronem',
                            provider: { '@type': 'LocalBusiness', name: 'FOTO-DRON Przemysław Właśniewski' },
                            serviceType: 'Inspekcja termowizyjna',
                            areaServed: { '@type': 'State', name: 'Kujawsko-Pomorskie' },
                            description: 'Wykrywanie mostków cieplnych, awarii paneli PV, inspekcje dachów kamerą Mavic 3 Thermal 640×512px.',
                            url: 'https://aeroanaliza.pl/dron',
                        },
                        {
                            '@type': 'Service',
                            name: 'Monitoring Inwestycji Budowlanych',
                            provider: { '@type': 'LocalBusiness', name: 'FOTO-DRON Przemysław Właśniewski' },
                            serviceType: 'Dokumentacja budowy',
                            areaServed: { '@type': 'State', name: 'Kujawsko-Pomorskie' },
                            description: 'Timeline budowy z lotu ptaka. Regularne zdjęcia z tej samej perspektywy i raporty PDF dla inwestorów.',
                            url: 'https://aeroanaliza.pl',
                        },
                        {
                            '@type': 'Service',
                            name: 'Ortofotomapy i Rolnictwo Precyzyjne',
                            provider: { '@type': 'LocalBusiness', name: 'FOTO-DRON Przemysław Właśniewski' },
                            serviceType: 'Fotogrametria',
                            areaServed: { '@type': 'State', name: 'Kujawsko-Pomorskie' },
                            description: 'Szacowanie szkód łowieckich, analiza stanu upraw, mapy GeoTIFF dla GIS.',
                            url: 'https://aeroanaliza.pl',
                        },
                    ],
                };

                const b2cServiceSchema = {
                    '@context': 'https://schema.org',
                    '@graph': [
                        {
                            '@type': 'Service',
                            name: 'Sesja Ślubna',
                            provider: { '@type': 'LocalBusiness', name: 'Przemysław Właśniewski Fotografia' },
                            serviceType: 'Fotografia ślubna',
                            areaServed: [{ '@type': 'City', name: 'Toruń' }, { '@type': 'City', name: 'Bydgoszcz' }],
                            description: 'Naturalna dokumentacja ślubna — bez ustawianych, sztucznych póz. Reportaż ślubny i sesja plenerowa.',
                            url: 'https://wlasniewski.pl/rezerwacja',
                        },
                        {
                            '@type': 'Service',
                            name: 'Sesja Rodzinna',
                            provider: { '@type': 'LocalBusiness', name: 'Przemysław Właśniewski Fotografia' },
                            serviceType: 'Fotografia rodzinna',
                            areaServed: [{ '@type': 'City', name: 'Toruń' }, { '@type': 'City', name: 'Bydgoszcz' }],
                            description: 'Sesje rodzinne w plenerze. Naturalne ujęcia, prawdziwe emocje. Toruń, okolice, kujawsko-pomorskie.',
                            url: 'https://wlasniewski.pl/rezerwacja',
                        },
                        {
                            '@type': 'Service',
                            name: 'Sesja Komunijna',
                            provider: { '@type': 'LocalBusiness', name: 'Przemysław Właśniewski Fotografia' },
                            serviceType: 'Fotografia komunijna',
                            areaServed: { '@type': 'City', name: 'Toruń' },
                            description: 'Sesje komunijne w plenerze i kościele. Pakiety ze zdjęciami cyfrowymi i albumem.',
                            url: 'https://wlasniewski.pl/rezerwacja',
                        },
                    ],
                };

                const schema = domain === 'b2b' ? b2bServiceSchema : b2cServiceSchema;
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
                    detail: `Wstrzyknięto Service Schema (${schema['@graph']?.length || 1} usług) na stronę: ${targetSlug}`,
                    executedAt,
                });

                return NextResponse.json({
                    success: true,
                    action: 'inject-service-schema',
                    affectedPages: injected,
                    serviceCount: (schema as { '@graph'?: unknown[] })['@graph']?.length || 1,
                    targetPage: targetSlug,
                    message: `Service Schema dla ${domain.toUpperCase()} wstrzyknięta. Usługi widoczne dla Google jako dane strukturalne.`,
                });
            }

            // ── Action: indexnow-b2c ──
            if (action === 'indexnow-b2c') {
                const urls = [
                    'https://wlasniewski.pl/',
                    'https://wlasniewski.pl/rezerwacja',
                    'https://wlasniewski.pl/portfolio',
                    'https://wlasniewski.pl/blog',
                    'https://wlasniewski.pl/o-mnie',
                    'https://wlasniewski.pl/jak-sie-ubrac',
                    'https://wlasniewski.pl/foto-wyzwanie',
                ];
                const res = await submitIndexNow(urls);
                await appendLog({ action: 'indexnow-b2c', domain: 'b2c', affectedCount: urls.length, detail: urls.join(', '), executedAt });
                return NextResponse.json({ success: true, action: 'indexnow-b2c', submitted: urls.length, indexNowStatus: res, message: `${urls.length} B2C URL-i wysłano do IndexNow. Bing/Yandex zaindeksuje w ciągu minut.` });
            }

            // ── Action: indexnow-b2b ──
            if (action === 'indexnow-b2b') {
                const urls = [
                    'https://aeroanaliza.pl/',
                    'https://aeroanaliza.pl/dron',
                ];
                const res = await submitIndexNow(urls);
                await appendLog({ action: 'indexnow-b2b', domain: 'b2b', affectedCount: urls.length, detail: urls.join(', '), executedAt });
                return NextResponse.json({ success: true, action: 'indexnow-b2b', submitted: urls.length, indexNowStatus: res, message: `${urls.length} B2B URL-i (aeroanaliza.pl) wysłano do IndexNow.` });
            }

            // ── Action: indexnow-all ──
            if (action === 'indexnow-all') {
                const allUrls = [
                    'https://wlasniewski.pl/', 'https://wlasniewski.pl/rezerwacja',
                    'https://wlasniewski.pl/portfolio', 'https://wlasniewski.pl/blog',
                    'https://wlasniewski.pl/o-mnie', 'https://wlasniewski.pl/jak-sie-ubrac',
                    'https://aeroanaliza.pl/', 'https://aeroanaliza.pl/dron',
                ];
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
