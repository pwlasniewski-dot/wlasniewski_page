import { WARDROBE_FALLBACK_TIPS } from '@/data/preparationGuides';
import type { PreparationGuideTip } from '@/types/preparation-guide';

type WardrobeImageKey = typeof WARDROBE_FALLBACK_TIPS[number]['id'];

const imageByKey = new Map(
    WARDROBE_FALLBACK_TIPS.map((tip) => [String(tip.id), {
        image: tip.image,
        imageAlt: tip.imageAlt,
    }])
);

const matchingRules: Array<{ key: WardrobeImageKey; terms: string[] }> = [
    { key: 'home', terms: ['domow', 'wnetrz', 'mieszkani', 'bose stop'] },
    { key: 'children', terms: ['dziec', 'dziecko', 'rodzenst', 'maluch'] },
    { key: 'women', terms: ['kobiet', 'sukien', 'spodnic'] },
    { key: 'men', terms: ['mezczy', 'mesk', 'koszul'] },
    { key: 'black-white', terms: ['czern', 'czarn', 'biel', 'bial', 'mocne kolor'] },
    { key: 'patterns', terms: ['wzor', 'desen', 'krat', 'pask'] },
    { key: 'layers', terms: ['warstw', 'kardigan', 'kamizel', 'marynark', 'szalik'] },
    { key: 'packing', terms: ['pakow', 'spak', 'torb', 'zabrac na sesj'] },
    { key: 'fitting', terms: ['przymierz', 'dopasowan', 'za cias', 'za luz', 'rozmiar'] },
    { key: 'season', terms: ['pora roku', 'wiosn', 'latem', 'jesien', 'zim'] },
    { key: 'outdoor', terms: ['plener', 'pogod', 'podloz', 'wilgoc', 'teren'] },
    { key: 'avoid', terms: ['unikaj', 'logo', 'logotyp', 'neon', 'odwracaj', 'rozprasz'] },
    { key: 'palette', terms: ['trzech kolor', '3 kolor', 'palet', 'koordyn', 'kolorow dla calej'] },
    { key: 'comfort', terms: ['komfort', 'wygod', 'swobod', 'ruch'] },
];

const cityWords = new Set([
    'miasto', 'miasta', 'miescie', 'miejska', 'miejski', 'miejskie', 'miejskich',
]);
const cityWordPrefixes = ['beton', 'cegl', 'szkl', 'architektur'];

function normalize(value: unknown): string {
    return typeof value === 'string'
        ? value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pl')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
        : '';
}

function hasUsableImage(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function matchesCityContext(haystack: string): boolean {
    const words = haystack.split(' ');
    return words.some((word) => (
        cityWords.has(word)
        || cityWordPrefixes.some((prefix) => word.startsWith(prefix))
    ));
}

function chooseImageKey(tip: PreparationGuideTip): WardrobeImageKey {
    const haystack = normalize([
        tip.slug,
        tip.title,
        tip.content,
        tip.category,
        tip.tip_type,
    ].filter(Boolean).join(' '));

    if (matchesCityContext(haystack)) return 'city';

    return matchingRules.find((rule) => rule.terms.some((term) => haystack.includes(term)))?.key
        ?? (normalize(tip.tip_type).includes('color') ? 'palette' : 'comfort');
}

export function addWardrobeTipImages(tips: PreparationGuideTip[]): PreparationGuideTip[] {
    return tips.map((tip) => {
        if (hasUsableImage(tip.image)) {
            return {
                ...tip,
                image: tip.image.trim(),
                imageAlt: hasUsableImage(tip.imageAlt) ? tip.imageAlt.trim() : tip.title,
            };
        }

        const fallback = imageByKey.get(String(chooseImageKey(tip)))
            ?? imageByKey.get('comfort');

        return {
            ...tip,
            image: fallback?.image,
            imageAlt: fallback?.imageAlt || tip.title,
        };
    });
}
