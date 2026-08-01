import { WARDROBE_FALLBACK_PALETTES, WARDROBE_FALLBACK_TIPS } from '@/data/preparationGuides';
import type { PreparationGuidePalette } from '@/types/preparation-guide';
import { isAllowedPublicMediaUrl } from '@/lib/publicMediaUrl';

export type WardrobePaletteImage = {
    src: string;
    alt: string;
    caption: string;
};

const fallbackIds = new Set(WARDROBE_FALLBACK_PALETTES.map((palette) => String(palette.id)));
const knownWardrobeImages = new Set<string>([
    ...WARDROBE_FALLBACK_TIPS.flatMap((tip) => (
        typeof tip.image === 'string' ? [tip.image] : []
    )),
    ...WARDROBE_FALLBACK_PALETTES.flatMap((palette) => (
        Array.isArray(palette.example_images)
            ? palette.example_images.flatMap((entry) => {
                if (typeof entry === 'string') return [entry];
                if (!entry || typeof entry !== 'object') return [];
                const image = entry as Record<string, unknown>;
                const src = image.src ?? image.url;
                return typeof src === 'string' ? [src] : [];
            })
            : []
    )),
]);

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

function paletteText(palette: PreparationGuidePalette): string {
    return normalize([
        palette.id,
        palette.slug,
        palette.name,
        palette.description,
        palette.season,
        palette.location_type,
        palette.mood,
    ].filter(Boolean).join(' '));
}

function describesCityEnvironment(text: string): boolean {
    const cityWords = new Set([
        'miasto',
        'miasta',
        'miescie',
        'miejska',
        'miejski',
        'miejskie',
        'miejskich',
    ]);
    const environmentPrefixes = ['beton', 'cegl', 'szkl', 'stal', 'architektur', 'neon'];

    return text.split(' ').some((word) => (
        cityWords.has(word)
        || environmentPrefixes.some((prefix) => word.startsWith(prefix))
    ));
}

function semanticKey(palette: PreparationGuidePalette): string {
    const id = String(palette.id);
    if (fallbackIds.has(id)) return id;

    const text = paletteText(palette);
    if (text.includes('miekka natura') || text.includes('spokojna natura') || text.includes('sage')) return 'calm-nature';
    if (text.includes('letnia lekkosc') || text.includes('nad woda')) return 'by-water';
    if (text.includes('zimowa elegancja') || text.includes('chlodna elegancja')) return 'cool-elegance';
    if (text.includes('ciepla ziemia')) return 'warm-earth';
    if (text.includes('przygaszony zachod')) return 'muted-sunset';
    if (text.includes('las i kamien')) return 'forest-stone';
    if (text.includes('miasto cegla beton i szklo')) return 'city-light';

    // A generic CMS city/elegance palette remains its own use case. It must not
    // suppress the separate environment-specific brick/concrete/glass palette.
    return `cms:${normalize(palette.slug || palette.name || id)}`;
}

export function isSafeWardrobeImage(value: unknown): value is string {
    return typeof value === 'string'
        && (knownWardrobeImages.has(value.trim()) || isAllowedPublicMediaUrl(value));
}

function parseImages(palette: PreparationGuidePalette): WardrobePaletteImage[] {
    if (!Array.isArray(palette.example_images)) return [];

    return palette.example_images.flatMap((entry) => {
        if (isSafeWardrobeImage(entry)) {
            return [{
                src: entry.trim(),
                alt: `${palette.name} — przykład stylizacji`,
                caption: palette.description || 'Przykład połączenia kolorów w kompletnej stylizacji.',
            }];
        }
        if (!entry || typeof entry !== 'object') return [];

        const image = entry as Record<string, unknown>;
        const src = image.src ?? image.url;
        if (!isSafeWardrobeImage(src)) return [];

        return [{
            src: src.trim(),
            alt: typeof image.alt === 'string' && image.alt.trim()
                ? image.alt.trim()
                : `${palette.name} — przykład stylizacji`,
            caption: typeof image.caption === 'string' && image.caption.trim()
                ? image.caption.trim()
                : palette.description || 'Przykład połączenia kolorów w kompletnej stylizacji.',
        }];
    });
}

function fallbackFor(palette: PreparationGuidePalette): PreparationGuidePalette | undefined {
    const key = semanticKey(palette);
    const direct = WARDROBE_FALLBACK_PALETTES.find((candidate) => String(candidate.id) === key);
    if (direct) return direct;

    const text = paletteText(palette);
    if (describesCityEnvironment(text)) {
        return WARDROBE_FALLBACK_PALETTES.find((candidate) => candidate.id === 'city-light');
    }
    return WARDROBE_FALLBACK_PALETTES.find((candidate) => candidate.id === 'calm-nature');
}

function withImage(palette: PreparationGuidePalette): PreparationGuidePalette {
    const explicitImages = parseImages(palette);
    const fallbackImages = parseImages(fallbackFor(palette) || palette);
    return {
        ...palette,
        example_images: explicitImages.length ? explicitImages : fallbackImages,
    };
}

export function mergeWardrobePalettes(palettes: PreparationGuidePalette[]): PreparationGuidePalette[] {
    const merged: PreparationGuidePalette[] = [];
    const keys = new Set<string>();

    for (const palette of palettes) {
        const key = semanticKey(palette);
        // The canonical city environment is curated content and must always win
        // over a CMS entry with a colliding name or slug.
        if (key === 'city-light') continue;
        if (keys.has(key)) continue;
        keys.add(key);
        merged.push(withImage(palette));
    }

    for (const fallback of WARDROBE_FALLBACK_PALETTES) {
        const key = semanticKey(fallback);
        if (keys.has(key)) continue;
        keys.add(key);
        merged.push(withImage(fallback));
    }

    return merged;
}

export function paletteImages(palette: PreparationGuidePalette): WardrobePaletteImage[] {
    return parseImages(palette);
}
