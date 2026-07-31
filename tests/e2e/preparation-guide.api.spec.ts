import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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

    test('uses only the three approved illustrations and they exist', () => {
        const illustrated = POSE_GUIDE_CARDS.filter((card) => card.image);
        expect(illustrated.map((card) => card.id)).toEqual(['P01', 'P13', 'P20']);

        for (const card of illustrated) {
            expect(existsSync(join(process.cwd(), 'public', card.image!))).toBe(true);
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
        expect(WARDROBE_FALLBACK_TIPS.length).toBeGreaterThanOrEqual(12);

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
        const clientApiSource = readFileSync(
            join(process.cwd(), 'src', 'app', 'api', 'style-guide', 'client', 'route.ts'),
            'utf8'
        );

        expect(componentSource).not.toContain('@/data/preparationGuides');
        expect(clientApiSource).toContain("from '@/data/preparationGuides'");
        expect(clientApiSource).toContain('canAccessGuideOffer');
        expect(clientApiSource).toContain('status: 401');
        expect(clientApiSource).toContain('status: 403');
        expect(clientApiSource).toContain('status: 404');
        expect(clientApiSource).toContain('status: 400');
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
