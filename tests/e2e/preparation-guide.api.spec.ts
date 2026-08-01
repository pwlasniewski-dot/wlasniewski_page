import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import {
    POSE_GUIDE_CARDS,
    WARDROBE_CHECKLISTS,
    WARDROBE_FALLBACK_FAQS,
    WARDROBE_FALLBACK_PALETTES,
    WARDROBE_FALLBACK_TIPS,
} from '../../src/data/preparationGuides';
import {
    canAccessGuideOffer,
    isPrivateStyleGuideCategory,
    publicStyleGuideCategoryFilter,
} from '../../src/lib/styleGuideAccess';
import {
    createClientPreparationGuideGetHandler,
    type ClientPreparationGuideDependencies,
    type PreparationGuideOffer,
    type PreparationGuideUser,
} from '../../src/lib/clientPreparationGuideHandler';
import type { PreparationGuidePalette, PreparationGuideTip } from '../../src/types/preparation-guide';
import {
    defaultPreparationGuideCmsData,
    parsePreparationGuideCmsData,
    removePreparationGuideCmsImage,
} from '../../src/lib/preparationGuideCms';
import { isAllowedPublicMediaUrl } from '../../src/lib/publicMediaUrl';

const activeUser: PreparationGuideUser = {
    id: 7,
    email: 'client@example.com',
    is_active: true,
    deleted_at: null,
};

const ownedOffer: PreparationGuideOffer = {
    id: 42,
    category: 'rodzinna',
    client_id: activeUser.id,
    client_email: activeUser.email,
    session_location: 'Toruń',
};

function dependencies(
    overrides: Partial<ClientPreparationGuideDependencies> = {}
): ClientPreparationGuideDependencies {
    return {
        verifyToken: async (token) => token === 'valid-token'
            ? { id: activeUser.id, email: activeUser.email }
            : null,
        findUser: async () => activeUser,
        findOffer: async (id) => id === ownedOffer.id ? ownedOffer : null,
        findPalettes: async () => [],
        findOutfits: async () => [],
        findWardrobeTips: async () => [],
        findPoseTips: async () => [],
        findWardrobeFaqs: async () => [],
        findPoseFaqs: async () => [],
        ...overrides,
    };
}

function request(
    query = '',
    headers: Record<string, string> = {}
): NextRequest {
    return new NextRequest(`http://localhost/api/style-guide/client${query}`, { headers });
}

test.describe('preparation guide fallback content', () => {
    test('creates and validates the full CMS document', () => {
        const cms = defaultPreparationGuideCmsData();

        expect(cms.wardrobeTips).toHaveLength(15);
        expect(cms.wardrobePalettes).toHaveLength(7);
        expect(cms.wardrobeChecklists).toHaveLength(3);
        expect(cms.wardrobeFaqs).toHaveLength(12);
        expect(cms.poseCards).toHaveLength(30);
        expect(parsePreparationGuideCmsData(JSON.stringify(cms))).toEqual(cms);
        expect(parsePreparationGuideCmsData({ ...cms, poseCards: [] })).toBeNull();
    });

    test('rejects partial catalogs and duplicate identifiers', () => {
        const partial = defaultPreparationGuideCmsData();
        partial.wardrobeTips.pop();
        expect(parsePreparationGuideCmsData(partial)).toBeNull();

        const duplicate = defaultPreparationGuideCmsData();
        duplicate.poseCards[1].id = duplicate.poseCards[0].id;
        expect(parsePreparationGuideCmsData(duplicate)).toBeNull();

        const duplicateFaq = defaultPreparationGuideCmsData();
        duplicateFaq.wardrobeFaqs[1].id = duplicateFaq.wardrobeFaqs[0].id;
        expect(parsePreparationGuideCmsData(duplicateFaq)).toBeNull();
    });

    test('accepts Media paths and configured S3 images but rejects foreign hosts', () => {
        expect(isAllowedPublicMediaUrl('/uploads/sesja.webp')).toBe(true);
        expect(isAllowedPublicMediaUrl('/api/media/file?id=12')).toBe(true);
        expect(isAllowedPublicMediaUrl('/images/client-guides/wardrobe/city.webp')).toBe(true);
        expect(isAllowedPublicMediaUrl('https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/sesja.webp')).toBe(true);
        expect(isAllowedPublicMediaUrl('https://evil.example/sesja.webp')).toBe(false);
        expect(isAllowedPublicMediaUrl('https://wlasniewski-photo-storage.s3.amazonaws.com/sesja.webp')).toBe(false);
        expect(isAllowedPublicMediaUrl('//evil.example/sesja.webp')).toBe(false);
        expect(isAllowedPublicMediaUrl('/admin/pages')).toBe(false);
    });

    test('removes images without changing the remaining CMS catalog', () => {
        const cms = defaultPreparationGuideCmsData();
        const withoutTipImage = removePreparationGuideCmsImage(cms, 'wardrobe', 0);
        const withoutPaletteImage = removePreparationGuideCmsImage(cms, 'palettes', 0);
        const withoutPoseImage = removePreparationGuideCmsImage(cms, 'poses', 0);

        expect(withoutTipImage.wardrobeTips[0].image).toBeUndefined();
        expect(withoutPaletteImage.wardrobePalettes[0].example_images).toEqual([]);
        expect(withoutPoseImage.poseCards[0].image).toBeUndefined();
        expect(parsePreparationGuideCmsData(withoutTipImage)).not.toBeNull();
        expect(parsePreparationGuideCmsData(withoutPaletteImage)).not.toBeNull();
        expect(parsePreparationGuideCmsData(withoutPoseImage)).not.toBeNull();
        expect(cms.wardrobeTips[0].image).toBeTruthy();
        expect(cms.wardrobePalettes[0].example_images).not.toEqual([]);
        expect(cms.poseCards[0].image).toBeTruthy();
    });

    test('serves CMS texts and images only through the authenticated client endpoint', async () => {
        const cms = defaultPreparationGuideCmsData();
        cms.wardrobeTips[0].title = 'Tekst zapisany w Pages';
        cms.wardrobeTips[0].image = 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/ubranie.webp';
        cms.poseCards[0].title = 'Poza zapisana w Pages';
        cms.poseCards[0].image = '/uploads/poza.webp';
        cms.wardrobeChecklists[0].title = 'Checklista zapisana w Pages';
        cms.wardrobeFaqs[0].question = 'FAQ zapisane w Pages?';

        const handler = createClientPreparationGuideGetHandler(dependencies({
            findCmsGuide: async () => JSON.stringify(cms),
        }));

        const unauthorized = await handler(request());
        const authorized = await handler(request('', { authorization: 'Bearer valid-token' }));
        const payload = await authorized.json();

        expect(unauthorized.status).toBe(401);
        expect(authorized.status).toBe(200);
        expect(payload.data.wardrobe.tips[0]).toEqual(expect.objectContaining({
            title: 'Tekst zapisany w Pages',
            image: 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/ubranie.webp',
        }));
        expect(payload.data.poses.cards[0]).toEqual(expect.objectContaining({
            title: 'Poza zapisana w Pages',
            image: '/uploads/poza.webp',
        }));
        expect(payload.data.wardrobe.checklists[0].title).toBe('Checklista zapisana w Pages');
        expect(payload.data.wardrobe.faqs[0].question).toBe('FAQ zapisane w Pages?');
    });

    test('keeps the Pages editor and persistence endpoint administrator-only', () => {
        const adminRoute = readFileSync(join(
            process.cwd(), 'src', 'app', 'api', 'pages', 'preparation-guide', 'route.ts'
        ), 'utf8');
        const editor = readFileSync(join(
            process.cwd(), 'src', 'components', 'admin', 'PreparationGuideEditor.tsx'
        ), 'utf8');
        const pagesList = readFileSync(join(
            process.cwd(), 'src', 'app', 'admin', 'pages', 'page.tsx'
        ), 'utf8');
        const clientGuide = readFileSync(join(
            process.cwd(), 'src', 'components', 'StyleGuide', 'PreparationGuide.tsx'
        ), 'utf8');

        expect(adminRoute).toContain('withAdminAuth');
        expect(adminRoute).toContain('prisma.page.upsert');
        expect(editor).toContain('MediaPicker');
        expect(editor).toContain('Usuń obraz');
        expect(editor).toContain("'checklists'");
        expect(editor).toContain("'faqs'");
        expect(pagesList).toContain('/admin/pages/przygotowanie-klienta');
        expect(clientGuide).toContain('isAllowedPublicMediaUrl(src)');
    });

    test('contains 30 unique and complete pose cards', () => {
        expect(POSE_GUIDE_CARDS).toHaveLength(30);
        expect(new Set(POSE_GUIDE_CARDS.map((card) => card.id)).size).toBe(30);

        for (const card of POSE_GUIDE_CARDS) {
            expect(card.title.length).toBeGreaterThan(2);
            expect(card.purpose.length).toBeGreaterThan(10);
            expect(card.steps.length).toBeGreaterThanOrEqual(3);
            expect(card.body.length).toBeGreaterThan(10);
            expect(card.variant.length).toBeGreaterThan(10);
            expect(card.mobility.length).toBeGreaterThan(10);
            expect(card.imageAlt.length).toBeGreaterThan(10);
            expect('mistake' in card).toBe(false);
        }
    });

    test('uses natural language in every pose card and removes technical sections', () => {
        const forbiddenLanguage = [
            /gdy pojawia się napięcie/i,
            /wersja dostępna/i,
            /transfer/i,
            /dostępnym zakresie/i,
            /komunikacj[aę] wspomag/i,
        ];

        for (const card of POSE_GUIDE_CARDS) {
            const clientCopy = [
                card.title,
                card.purpose,
                ...card.steps,
                card.body,
                card.variant,
                card.mobility,
            ].join(' ');

            for (const forbidden of forbiddenLanguage) {
                expect(clientCopy).not.toMatch(forbidden);
            }
        }

        const sittingPose = POSE_GUIDE_CARDS.find((card) => card.id === 'P02');
        expect(sittingPose?.steps.join(' ')).toContain('siedzisz wygodnie i pewnie');

        const componentSource = readFileSync(
            join(process.cwd(), 'src', 'components', 'StyleGuide', 'PreparationGuide.tsx'),
            'utf8'
        );
        expect(componentSource).not.toContain('Gdy pojawia się napięcie');
        expect(componentSource).not.toContain('Wersja dostępna');
        expect(componentSource).toContain('label="Inny pomysł"');
        expect(componentSource).toContain('label="Możesz też"');
    });

    test('provides an optimized illustration for every pose card', () => {
        const illustrated = POSE_GUIDE_CARDS.filter((card) => card.image);
        expect(illustrated).toHaveLength(POSE_GUIDE_CARDS.length);

        for (const card of illustrated) {
            const imagePath = join(process.cwd(), 'public', card.image!);
            expect(existsSync(imagePath)).toBe(true);
            expect(card.image).toMatch(/\.webp$/);
            expect(statSync(imagePath).size).toBeLessThan(100_000);
        }
    });

    test('provides scannable wardrobe checklists', () => {
        expect(WARDROBE_CHECKLISTS).toHaveLength(3);
        for (const checklist of WARDROBE_CHECKLISTS) {
            expect(checklist.items.length).toBeGreaterThanOrEqual(5);
        }
    });

    test('provides complete wardrobe fallback content', () => {
        expect(WARDROBE_FALLBACK_PALETTES).toHaveLength(7);
        expect(WARDROBE_FALLBACK_FAQS).toHaveLength(12);
        expect(WARDROBE_FALLBACK_TIPS).toHaveLength(15);

        const cityCard = WARDROBE_FALLBACK_TIPS.find((tip) => tip.id === 'city');
        expect(cityCard).toMatchObject({
            title: 'Sesja w mieście',
            image: '/images/client-guides/wardrobe/city.webp',
        });
        expect(cityCard?.content).toContain('betonu');
        expect(cityCard?.content).toContain('cegle');
        expect(cityCard?.content).toContain('szkła');
        expect(cityCard?.content).toContain('Zieleń miejsk');
        expect(cityCard?.content).toContain('neonach');
        expect(cityCard?.imageAlt?.length).toBeGreaterThan(20);

        const wardrobeCardsWithImages = WARDROBE_FALLBACK_TIPS.filter((item) => item.image);
        expect(wardrobeCardsWithImages).toHaveLength(WARDROBE_FALLBACK_TIPS.length);

        for (const item of wardrobeCardsWithImages) {
            const imagePath = join(process.cwd(), 'public', item.image!);
            expect(item.image).toMatch(/\.webp$/);
            expect(item.imageAlt?.length).toBeGreaterThan(20);
            expect(existsSync(imagePath)).toBe(true);
            expect(statSync(imagePath).size).toBeLessThan(150_000);
        }

        for (const palette of WARDROBE_FALLBACK_PALETTES) {
            expect(palette.colors).toHaveLength(4);
            expect(palette.example_images).toHaveLength(1);
            const image = palette.example_images[0];
            expect(image.src).toMatch(/^\/images\/client-guides\/wardrobe\/[a-z0-9-]+\.webp$/);
            expect(image.alt.length).toBeGreaterThan(20);
            expect(image.caption.length).toBeGreaterThan(20);
            expect(existsSync(join(process.cwd(), 'public', image.src))).toBe(true);
            for (const color of palette.colors) {
                expect(color.hex).toMatch(/^#[0-9A-F]{6}$/);
            }
        }
    });

    test('uses client_id as the canonical offer owner', () => {
        const user = { id: 7, email: 'client@example.com' };

        expect(canAccessGuideOffer(user, { client_id: 7, client_email: 'old@example.com' })).toBe(true);
        expect(canAccessGuideOffer(user, { client_id: 8, client_email: 'client@example.com' })).toBe(false);
        expect(canAccessGuideOffer(user, { client_id: null, client_email: ' CLIENT@example.com ' })).toBe(true);
        expect(canAccessGuideOffer(user, { client_id: null, client_email: null })).toBe(false);
    });

    test('keeps pose private while preserving legacy null categories', () => {
        expect(isPrivateStyleGuideCategory('pose')).toBe(true);
        expect(isPrivateStyleGuideCategory(' POSE ')).toBe(true);
        expect(isPrivateStyleGuideCategory(null)).toBe(false);
        expect(publicStyleGuideCategoryFilter()).toEqual({
            OR: [
                { category: null },
                { category: { not: 'pose' } },
            ],
        });
    });

    test('keeps private pose data out of the client bundle', () => {
        const componentSource = readFileSync(
            join(process.cwd(), 'src', 'components', 'StyleGuide', 'PreparationGuide.tsx'),
            'utf8'
        );
        const clientHandlerSource = readFileSync(
            join(process.cwd(), 'src', 'lib', 'clientPreparationGuideHandler.ts'),
            'utf8'
        );

        expect(componentSource).not.toContain('@/data/preparationGuides');
        expect(clientHandlerSource).toContain("from '@/data/preparationGuides'");
        expect(clientHandlerSource).toContain('canAccessGuideOffer');
        expect(clientHandlerSource).toContain('status: 401');
        expect(clientHandlerSource).toContain('status: 403');
        expect(clientHandlerSource).toContain('status: 404');
        expect(clientHandlerSource).toContain('status: 400');
    });

    test('links the account overview CTA to the preparation tab without navigation', () => {
        const accountSource = readFileSync(
            join(process.cwd(), 'src', 'app', 'konto', 'page.tsx'),
            'utf8'
        );
        const attentionSection = accountSource.indexOf('Wymaga Twojej uwagi');
        const preparationCta = accountSource.indexOf('aria-label="Otwórz poradnik Przygotowanie do sesji"');
        const preparationButton = accountSource.lastIndexOf('<button', preparationCta);
        const lowerTiles = accountSource.indexOf('Foto-Match block');

        expect(attentionSection).toBeGreaterThan(-1);
        expect(preparationCta).toBeGreaterThan(attentionSection);
        expect(preparationCta).toBeLessThan(lowerTiles);
        expect(preparationButton).toBeGreaterThan(attentionSection);
        expect(accountSource.slice(preparationButton, lowerTiles)).toContain("onClick={() => setActiveTab('preparation')}");
        expect(accountSource.slice(preparationButton, lowerTiles)).toContain('Jak się ubrać i jak pozować przed sesją');
        expect(accountSource.slice(preparationButton, lowerTiles)).not.toContain('href=');
    });

    test('keeps account navigation labels visible and touch-friendly on mobile', () => {
        const accountSource = readFileSync(
            join(process.cwd(), 'src', 'app', 'konto', 'page.tsx'),
            'utf8'
        );
        const tabButtonSource = readFileSync(
            join(process.cwd(), 'src', 'components', 'client', 'AccountTabButton.tsx'),
            'utf8'
        );

        for (const label of [
            'Przegląd',
            'Galerie',
            'Rezerwacje',
            'Oferty i Umowy',
            'Karty Podarunkowe',
            'Warsztaty',
            'Przygotowanie',
            'Ustawienia',
        ]) {
            expect(accountSource).toContain(`label="${label}"`);
        }

        expect(accountSource).toContain('grid-cols-1 min-[360px]:grid-cols-2');
        expect(tabButtonSource).toContain('data-account-tab');
        expect(tabButtonSource).toContain('min-h-16');
        expect(tabButtonSource).toContain('h-10 w-10');
        expect(tabButtonSource).toContain('{label}');
        expect(tabButtonSource).not.toContain('hidden sm:inline');
    });

    test('applies the public pose filter to every public read path', () => {
        const guardedPaths = [
            ['src', 'app', 'jak-sie-ubrac', 'page.tsx'],
            ['src', 'app', 'api', 'style-guide', 'outfits', 'route.ts'],
            ['src', 'app', 'api', 'style-guide', 'outfits', '[slug]', 'route.ts'],
            ['src', 'app', 'api', 'style-guide', 'palettes', '[slug]', 'route.ts'],
            ['src', 'app', 'api', 'style-guide', 'search', 'route.ts'],
            ['src', 'app', 'api', 'style-guide', 'tips', 'route.ts'],
            ['src', 'app', 'api', 'style-guide', 'faqs', 'route.ts'],
        ];

        for (const parts of guardedPaths) {
            const source = readFileSync(join(process.cwd(), ...parts), 'utf8');
            expect(source).toMatch(/publicStyleGuideCategoryFilter|isPrivateStyleGuideCategory/);
        }
    });
});

test.describe('client preparation guide route contract', () => {
    test('returns 401 without a session and never queries user data', async () => {
        let userLookupCalled = false;
        const handler = createClientPreparationGuideGetHandler(dependencies({
            findUser: async () => {
                userLookupCalled = true;
                return activeUser;
            },
        }));

        const response = await handler(request());

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ success: false, error: 'Unauthorized' });
        expect(userLookupCalled).toBe(false);
    });

    test('accepts Bearer and client_token cookie authentication', async () => {
        const seenTokens: string[] = [];
        const handler = createClientPreparationGuideGetHandler(dependencies({
            verifyToken: async (token) => {
                seenTokens.push(token);
                return { id: activeUser.id, email: activeUser.email };
            },
        }));

        expect((await handler(request('', { authorization: 'Bearer bearer-token' }))).status).toBe(200);
        expect((await handler(request('', { cookie: 'client_token=cookie-token' }))).status).toBe(200);
        expect(seenTokens).toEqual(['bearer-token', 'cookie-token']);
    });

    test('rejects invalid tokens and inactive, deleted or missing users', async () => {
        const invalidToken = createClientPreparationGuideGetHandler(dependencies());
        expect((await invalidToken(request('', { authorization: 'Bearer invalid' }))).status).toBe(401);

        for (const user of [
            null,
            { ...activeUser, is_active: false },
            { ...activeUser, deleted_at: new Date('2025-01-01') },
        ]) {
            const handler = createClientPreparationGuideGetHandler(dependencies({
                findUser: async () => user,
            }));
            const response = await handler(request('', { authorization: 'Bearer valid-token' }));
            expect(response.status).toBe(401);
        }
    });

    test('returns 400 for malformed offerId and 404 for a missing offer', async () => {
        const handler = createClientPreparationGuideGetHandler(dependencies());
        const headers = { authorization: 'Bearer valid-token' };

        expect((await handler(request('?offerId=abc', headers))).status).toBe(400);
        expect((await handler(request('?offerId=-1', headers))).status).toBe(400);
        expect((await handler(request('?offerId=999', headers))).status).toBe(404);
    });

    test('returns 403 when client_id belongs to someone else even if email matches', async () => {
        const handler = createClientPreparationGuideGetHandler(dependencies({
            findOffer: async () => ({
                ...ownedOffer,
                client_id: 999,
                client_email: activeUser.email,
            }),
        }));

        const response = await handler(request(
            '?offerId=42',
            { authorization: 'Bearer valid-token' }
        ));

        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ success: false, error: 'Forbidden' });
    });

    test('allows the normalized email fallback only when client_id is null', async () => {
        const handler = createClientPreparationGuideGetHandler(dependencies({
            findOffer: async () => ({
                ...ownedOffer,
                client_id: null,
                client_email: ' CLIENT@EXAMPLE.COM ',
            }),
        }));

        const response = await handler(request(
            '?offerId=42',
            { authorization: 'Bearer valid-token' }
        ));

        expect(response.status).toBe(200);
    });

    test('returns the stable DTO, legacy aliases and offer personalization', async () => {
        const handler = createClientPreparationGuideGetHandler(dependencies());
        const response = await handler(request(
            '?offerId=42',
            { authorization: 'Bearer valid-token' }
        ));
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.success).toBe(true);
        expect(Object.keys(payload.data).sort()).toEqual([
            'context',
            'poses',
            'recommended_outfits',
            'recommended_palettes',
            'tips',
            'wardrobe',
        ]);
        expect(payload.data.context).toEqual({
            offerId: 42,
            serviceType: 'rodzinna',
            location: 'Toruń',
            personalized: true,
        });
        expect(payload.data.poses.cards).toHaveLength(30);
        expect(payload.data.wardrobe.palettes).toHaveLength(7);
        expect(payload.data.wardrobe.checklists).toHaveLength(3);
        expect(payload.data.wardrobe.faqs).toHaveLength(12);
        expect(payload.data.recommended_palettes).toEqual(payload.data.wardrobe.palettes);
        expect(payload.data.recommended_outfits).toEqual(payload.data.wardrobe.outfits);
        expect(payload.data.tips).toEqual(payload.data.wardrobe.tips);
    });

    test('adds semantic fallback illustrations to CMS wardrobe tips without images', async () => {
        const handler = createClientPreparationGuideGetHandler(dependencies({
            findWardrobeTips: async () => [
                {
                    id: 1,
                    slug: 'zasada-trzech-kolorow',
                    title: 'Zasada Trzech Kolorów',
                    content: 'Wybierz trzy główne kolory dla całej rodziny.',
                    tip_type: 'color',
                    category: 'general',
                },
                {
                    id: 2,
                    slug: 'warstwy-dodaja-glebi',
                    title: 'Warstwy Dodają Głębi',
                    content: 'Kardigany, kamizelki i szaliki dają więcej możliwości.',
                    category: 'general',
                },
                {
                    id: 3,
                    slug: 'unikaj-logotypow',
                    title: 'Unikaj Wielkich Logotypów',
                    content: 'Duże logo odwraca uwagę od twarzy.',
                    category: 'general',
                },
                {
                    id: 4,
                    slug: 'dopasowanie-kluczowe',
                    title: 'Dopasowanie Jest Kluczowe',
                    content: 'Unikaj zbyt ciasnych i za luźnych ubrań.',
                    category: 'general',
                },
                {
                    id: 5,
                    slug: 'wybierz-wygode',
                    title: 'Zamiast sztywnej zasady wybierz wygodę',
                    content: 'Swobodny strój pomaga czuć się komfortowo.',
                    image: '   ',
                    category: 'general',
                },
                {
                    id: 6,
                    slug: 'wlasna-porada-z-obrazem',
                    title: 'Własna porada fotografa',
                    content: 'Ta porada ma własny obraz z CMS.',
                    image: '  /images/client-guides/wardrobe/season.webp  ',
                    imageAlt: '  Własny opis alternatywny obrazu z CMS.  ',
                    category: 'general',
                },
            ],
        }));

        const response = await handler(request('', { authorization: 'Bearer valid-token' }));
        const payload = await response.json();
        const tips = payload.data.wardrobe.tips;

        expect(response.status).toBe(200);
        expect(tips.map((tip: PreparationGuideTip) => tip.image)).toEqual([
            '/images/client-guides/wardrobe/palette.webp',
            '/images/client-guides/wardrobe/layers.webp',
            '/images/client-guides/wardrobe/avoid.webp',
            '/images/client-guides/wardrobe/fitting.webp',
            '/images/client-guides/wardrobe/comfort.webp',
            '/images/client-guides/wardrobe/season.webp',
        ]);
        expect(tips[4].image).not.toBe('/images/client-guides/wardrobe/city.webp');
        expect(tips[5]).toMatchObject({
            image: '/images/client-guides/wardrobe/season.webp',
            imageAlt: 'Własny opis alternatywny obrazu z CMS.',
        });
        for (const tip of tips as PreparationGuideTip[]) {
            expect(tip.image).toBeTruthy();
            expect(tip.imageAlt).toBeTruthy();
            expect(tip.image).not.toMatch(/^\s*$/);
        }
    });

    test('merges a partial CMS palette set with missing visual use cases and a dedicated city environment', async () => {
        const colors = [
            { name: 'Pierwszy', hex: '#334455' },
            { name: 'Drugi', hex: '#667788' },
            { name: 'Trzeci', hex: '#99AABB' },
            { name: 'Czwarty', hex: '#CCDDEE' },
        ];
        const cmsPalettes: PreparationGuidePalette[] = [
            { id: 101, slug: 'miekka-natura', name: 'Miękka Natura', description: 'Zgaszona zieleń i beże.', colors },
            {
                id: 102,
                slug: 'elegancka-miejska',
                name: 'Elegancka Miejska',
                description: 'Eleganckie zestawy na miejski spacer.',
                colors,
                example_images: ['https://unsafe.example/image.jpg'],
            },
            { id: 103, slug: 'letnia-lekkosc', name: 'Letnia Lekkość', description: 'Jasne letnie kolory.', colors },
            { id: 104, slug: 'zimowa-elegancja', name: 'Zimowa Elegancja', description: 'Chłodne zimowe kolory.', colors },
        ];
        const handler = createClientPreparationGuideGetHandler(dependencies({
            findPalettes: async () => cmsPalettes,
        }));

        const response = await handler(request('', { authorization: 'Bearer valid-token' }));
        const payload = await response.json();
        const palettes = payload.data.wardrobe.palettes as PreparationGuidePalette[];

        expect(response.status).toBe(200);
        expect(palettes).toHaveLength(8);
        expect(palettes.map((palette) => palette.name)).toEqual(expect.arrayContaining([
            'Miękka Natura',
            'Elegancka Miejska',
            'Letnia Lekkość',
            'Zimowa Elegancja',
            'Ciepła ziemia',
            'Przygaszony zachód',
            'Las i kamień',
            'Miasto: cegła, beton i szkło',
        ]));
        expect(palettes.map((palette) => palette.name)).not.toContain('Spokojna natura');
        expect(palettes.map((palette) => palette.name)).not.toContain('Nad wodą');
        expect(palettes.map((palette) => palette.name)).not.toContain('Chłodna elegancja');

        const genericCity = palettes.find((palette) => palette.name === 'Elegancka Miejska');
        const environmentCity = palettes.find((palette) => palette.name === 'Miasto: cegła, beton i szkło');
        expect(genericCity?.example_images).toEqual([
            expect.objectContaining({ src: '/images/client-guides/wardrobe/city.webp' }),
        ]);
        expect(environmentCity?.description).toContain('cegły');
        expect(environmentCity?.description).toContain('betonu');
        expect(environmentCity?.description).toContain('szkła');
        expect(environmentCity?.description).toContain('zieleni miejskiej');
        expect(environmentCity?.description).toContain('neonów');

        for (const palette of palettes) {
            const images = palette.example_images as Array<{ src: string; alt: string; caption: string }>;
            expect(images).toHaveLength(1);
            expect(images[0].src).toMatch(/^\/images\/client-guides\/wardrobe\/[a-z0-9-]+\.webp$/);
            expect(images[0].alt.length).toBeGreaterThan(10);
            expect(images[0].caption.length).toBeGreaterThan(10);
            expect(images[0].src).not.toContain('unsafe.example');
        }
    });

    test('does not classify the word "zamiast" as a city palette', async () => {
        const handler = createClientPreparationGuideGetHandler(dependencies({
            findPalettes: async () => [{
                id: 105,
                slug: 'wygodny-wybor',
                name: 'Wygodny wybór',
                description: 'Zamiast sztywnej zasady wybierz własny komfort.',
                colors: [
                    { name: 'Krem', hex: '#F3E8D5' },
                    { name: 'Piasek', hex: '#D8C7A6' },
                    { name: 'Szałwia', hex: '#A8B29A' },
                    { name: 'Oliwka', hex: '#74785A' },
                ],
            }],
        }));

        const response = await handler(request('', { authorization: 'Bearer valid-token' }));
        const payload = await response.json();
        const palettes = payload.data.wardrobe.palettes as PreparationGuidePalette[];
        const customPalette = palettes.find((palette) => palette.name === 'Wygodny wybór');

        expect(response.status).toBe(200);
        expect(customPalette?.example_images).toEqual([
            expect.objectContaining({ src: '/images/client-guides/wardrobe/palette.webp' }),
        ]);
        expect(customPalette?.example_images).not.toEqual([
            expect.objectContaining({ src: '/images/client-guides/wardrobe/city.webp' }),
        ]);
        expect(palettes.some((palette) => palette.id === 'city-light')).toBe(true);
    });

    test('keeps the canonical city environment when a CMS palette collides with its name and slug', async () => {
        const handler = createClientPreparationGuideGetHandler(dependencies({
            findPalettes: async () => [{
                id: 999,
                slug: 'miasto-cegla-beton-i-szklo',
                name: 'Miasto: cegła, beton i szkło',
                description: 'Krótki opis z CMS.',
                colors: [
                    { name: 'Krem', hex: '#F3E8D5' },
                    { name: 'Piasek', hex: '#D8C7A6' },
                    { name: 'Szałwia', hex: '#A8B29A' },
                    { name: 'Oliwka', hex: '#74785A' },
                ],
                example_images: [{ src: '/images/client-guides/wardrobe/women.webp' }],
            }],
        }));

        const response = await handler(request('', { authorization: 'Bearer valid-token' }));
        const payload = await response.json();
        const palettes = payload.data.wardrobe.palettes as PreparationGuidePalette[];
        const cityPalettes = palettes.filter((palette) => palette.id === 'city-light');

        expect(response.status).toBe(200);
        expect(cityPalettes).toHaveLength(1);
        expect(cityPalettes[0].description).toContain('cegły');
        expect(cityPalettes[0].description).toContain('betonu');
        expect(cityPalettes[0].description).toContain('szkła');
        expect(cityPalettes[0].description).toContain('stali');
        expect(cityPalettes[0].description).toContain('zieleni miejskiej');
        expect(cityPalettes[0].description).toContain('neonów');
        expect(cityPalettes[0].example_images).toEqual([
            expect.objectContaining({ src: '/images/client-guides/wardrobe/city.webp' }),
        ]);
        expect(palettes.some((palette) => palette.id === 999)).toBe(false);
    });

    test('rejects a foreign wardrobe image host and uses an existing fallback asset', async () => {
        const handler = createClientPreparationGuideGetHandler(dependencies({
            findPalettes: async () => [{
                id: 106,
                slug: 'wygodna-paleta',
                name: 'Wygodna paleta',
                description: 'Spokojny, komfortowy zestaw.',
                colors: [
                    { name: 'Krem', hex: '#F3E8D5' },
                    { name: 'Piasek', hex: '#D8C7A6' },
                    { name: 'Szałwia', hex: '#A8B29A' },
                    { name: 'Oliwka', hex: '#74785A' },
                ],
                example_images: [{ src: 'https://evil.example/missing.webp' }],
            }],
        }));

        const response = await handler(request('', { authorization: 'Bearer valid-token' }));
        const payload = await response.json();
        const palette = (payload.data.wardrobe.palettes as PreparationGuidePalette[])
            .find((entry) => entry.id === 106);

        expect(response.status).toBe(200);
        expect(palette?.example_images).toEqual([
            expect.objectContaining({ src: '/images/client-guides/wardrobe/palette.webp' }),
        ]);
        expect(palette?.example_images).not.toEqual([
            expect.objectContaining({ src: 'https://evil.example/missing.webp' }),
        ]);
    });

    test('converts unexpected dependency errors into a stable 500 response', async () => {
        const handler = createClientPreparationGuideGetHandler(dependencies({
            findPalettes: async () => {
                throw new Error('database unavailable');
            },
        }));

        const response = await handler(request('', { authorization: 'Bearer valid-token' }));

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            success: false,
            error: 'Nie udało się pobrać poradnika',
        });
    });
});
