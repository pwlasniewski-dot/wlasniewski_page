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
    test('contains 30 unique and complete pose cards', () => {
        expect(POSE_GUIDE_CARDS).toHaveLength(30);
        expect(new Set(POSE_GUIDE_CARDS.map((card) => card.id)).size).toBe(30);

        for (const card of POSE_GUIDE_CARDS) {
            expect(card.title.length).toBeGreaterThan(2);
            expect(card.purpose.length).toBeGreaterThan(10);
            expect(card.steps.length).toBeGreaterThanOrEqual(3);
            expect(card.body.length).toBeGreaterThan(10);
            expect(card.variant.length).toBeGreaterThan(10);
            expect(card.mistake.length).toBeGreaterThan(10);
            expect(card.mobility.length).toBeGreaterThan(10);
            expect(card.imageAlt.length).toBeGreaterThan(10);
        }
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
        expect(WARDROBE_FALLBACK_PALETTES).toHaveLength(6);
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
        expect(payload.data.wardrobe.palettes).toHaveLength(6);
        expect(payload.data.wardrobe.checklists).toHaveLength(3);
        expect(payload.data.wardrobe.faqs).toHaveLength(12);
        expect(payload.data.recommended_palettes).toEqual(payload.data.wardrobe.palettes);
        expect(payload.data.recommended_outfits).toEqual(payload.data.wardrobe.outfits);
        expect(payload.data.tips).toEqual(payload.data.wardrobe.tips);
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
