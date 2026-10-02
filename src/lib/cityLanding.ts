import type { PageSection } from '@/components/admin/PageBuilder';
import CITY_DEFAULTS from '@/data/cityLandingDefaults.json';
import { packageDescriptionLines } from '@/lib/packageScope';

export const CITY_PACKAGE_SERVICES = ['Sesja', 'Ślub', 'Przyjęcie', 'Urodziny'] as const;
export type CityPageRecord = {
    slug: string; title?: string; content?: string | null; sections?: string | null;
    hero_image?: string | null; hero_subtitle?: string | null;
    meta_title?: string | null; meta_description?: string | null; meta_keywords?: string | null;
};

export function cityDefinition(slug: string) {
    const key = slug.replace(/^fotograf-/, '');
    return Object.prototype.hasOwnProperty.call(CITY_DEFAULTS, key)
        ? CITY_DEFAULTS[key as keyof typeof CITY_DEFAULTS] : null;
}

export const CITY_NAMES = Object.values(CITY_DEFAULTS).map(city => city.city);
export const CITY_SLUGS = Object.values(CITY_DEFAULTS).map(city => city.slug);

export function sectionData(section: PageSection): PageSection {
    const { data, ...rest } = section;
    return { ...rest, ...(data && typeof data === 'object' ? data : {}), id: rest.id, type: rest.type,
        ...(rest.enabled !== undefined ? { enabled: rest.enabled } : {}) };
}

export function visibleCitySections(sections: PageSection[]) {
    return sections.map(sectionData).filter(section => section.enabled !== false);
}

export function cityText(value: unknown): string {
    return packageDescriptionLines(value).join(' ');
}

/** Local CMS links cannot escape to a different origin through URL normalization. */
export function cityLocalLink(value: unknown, fallback = '/rezerwacja'): string {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')
        || /[\\\s\u0000-\u001f]/.test(value)) return fallback;
    try {
        const url = new URL(value, 'https://wlasniewski.pl');
        return url.origin === 'https://wlasniewski.pl' ? `${url.pathname}${url.search}${url.hash}` : fallback;
    } catch { return fallback; }
}

export function cityContextLink(value: unknown, city: string, source: string, service?: string, packageId?: number) {
    const url = new URL(cityLocalLink(value), 'https://wlasniewski.pl');
    url.searchParams.set('city', city);
    if (!url.searchParams.has('source')) url.searchParams.set('source', source);
    if (service) url.searchParams.set('service', service);
    if (packageId) url.searchParams.set('package_id', String(packageId));
    return `${url.pathname}${url.search}${url.hash}`;
}

/** Starter content appears in the existing editor; no database writes on reads. */
export function cityStarterSections(slug: string, page?: CityPageRecord | null): PageSection[] {
    const city = cityDefinition(slug);
    if (!city) return [];
    const sections = structuredClone(city.sections) as PageSection[];
    const hero = sections.find(section => section.type === 'hero');
    if (hero && page?.hero_image) hero.image = page.hero_image;
    if (hero && page?.hero_subtitle) hero.subtitle = page.hero_subtitle;
    return sections;
}

/** Explicit UI action only. Existing modules and their media are never replaced. */
export function appendCityStarter(sections: PageSection[], slug: string, page?: CityPageRecord | null) {
    const types = new Set(sections.map(section => section.type));
    return [...sections, ...cityStarterSections(slug, page).filter(section => {
        if (section.type === 'hero' && sections.some(old => ['hero', 'hero_parallax', 'hero_slider', 'story_hero'].includes(old.type))) return false;
        return !types.has(section.type);
    }).map(section => ({ ...section, id: `${section.id}-${Math.random().toString(36).slice(2, 9)}` }))];
}

/** An intentional [] remains empty; malformed storage never resurrects old promises. */
export function parseCitySections(value: unknown, slug: string, page?: CityPageRecord | null): PageSection[] {
    if (value === null || value === undefined || value === '') return cityStarterSections(slug, page);
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(parsed)) return cityStarterSections(slug, page);
        return parsed.filter(section => section && typeof section === 'object'
            && typeof section.id === 'string' && typeof section.type === 'string').map(sectionData);
    } catch { return cityStarterSections(slug, page); }
}

export function cityFaqItems(sections: PageSection[]) {
    return visibleCitySections(sections).filter(section => section.type === 'faq')
        .flatMap(section => Array.isArray(section.faqItems) ? section.faqItems : [])
        .filter(item => item && item.enabled !== false)
        .map(item => ({ question: cityText(item.question), answer: cityText(item.answer) }))
        .filter(item => item.question && item.answer);
}

export function citySeoSettings(sections: PageSection[], slug: string) {
    const settings = visibleCitySections(sections).find(section => section.type === 'city_seo');
    const canonicalPath = cityLocalLink(settings?.canonicalPath, `/${slug}`);
    return { ...settings, canonical: `https://wlasniewski.pl${canonicalPath.split(/[?#]/)[0]}` };
}

/** Validate only this page family. Existing section data is preserved verbatim. */
export function validateCitySections(value: unknown): { valid: true } | { valid: false; error: string } {
    let sections: unknown;
    try { sections = typeof value === 'string' ? JSON.parse(value) : value; }
    catch { return { valid: false, error: 'Sekcje strony miejskiej mają nieprawidłowy JSON.' }; }
    if (!Array.isArray(sections)) return { valid: false, error: 'Sekcje strony miejskiej muszą być listą.' };
    const ids = new Set<string>();
    for (const raw of sections) {
        if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id
            || typeof raw.type !== 'string' || ids.has(raw.id)) {
            return { valid: false, error: 'Każdy moduł musi mieć typ i unikalny identyfikator.' };
        }
        ids.add(raw.id);
        const section = sectionData(raw);
        if (['faq', 'public_packages', 'city_seo', 'hero'].includes(section.type)) {
            const fields = ['title', 'subtitle', 'description', 'buttonText', 'buttonLink', 'emptyMessage',
                'canonicalPath', 'socialTitle', 'socialDescription', 'socialImage', 'socialImageAlt'];
            if (fields.some(key => section[key as keyof PageSection] != null && typeof section[key as keyof PageSection] !== 'string')) {
                return { valid: false, error: 'Teksty i adresy modułu muszą być zapisane jako tekst.' };
            }
        }
        if (section.enabled !== undefined && typeof section.enabled !== 'boolean') {
            return { valid: false, error: 'Widoczność modułu musi być wartością tak/nie.' };
        }
        if (section.type === 'faq' && (!Array.isArray(section.faqItems) || section.faqItems.some(item =>
            !item || typeof item.question !== 'string' || typeof item.answer !== 'string'
            || (item.enabled !== undefined && typeof item.enabled !== 'boolean')))) {
            return { valid: false, error: 'FAQ wymaga pytań i odpowiedzi zapisanych jako tekst.' };
        }
        if (section.type === 'public_packages' && (!Array.isArray(section.serviceNames)
            || section.serviceNames.some(name => !CITY_PACKAGE_SERVICES.includes(name as typeof CITY_PACKAGE_SERVICES[number])))) {
            return { valid: false, error: 'Wybierz obsługiwane usługi dla modułu pakietów.' };
        }
        for (const key of section.type === 'city_seo' ? ['canonicalPath'] : section.type === 'public_packages' ? ['buttonLink'] : []) {
            const value = section[key as keyof PageSection];
            if (value && cityLocalLink(value, '') === '') return { valid: false, error: 'Adres modułu musi prowadzić do strony w tym serwisie.' };
        }
    }
    return { valid: true };
}
