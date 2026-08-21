import type { PageSection } from '@/components/admin/PageBuilder';
import { hasAeroContentVersion } from '@/lib/aeroanaliza/content';

const ALLOWED_AERO_SECTION_TYPES = new Set([
    'b2b_hero', 'features', 'image_text', 'b2b_process', 'b2b_cases',
    'b2b_contact', 'thermal_hero', 'thermal_slider',
]);

const unsafeMarkup = /(?:<\s*(?:script|iframe|object|embed|link|meta|base|form|svg|math)\b|\bon[a-z]+\s*=|(?:javascript|vbscript)\s*:|data\s*:\s*text\/html)/i;
const allowedHtmlTags = new Set(['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'span', 'h2', 'h3', 'blockquote']);

function containsUnsafeHtml(value: string) {
    if (unsafeMarkup.test(value)) return true;
    if (!value.includes('<')) return false;
    if (/<!--|<!doctype|<\?xml/i.test(value)) return true;

    const tags = value.matchAll(/<\/?([a-z0-9]+)\b([^>]*)>/gi);
    let count = 0;
    for (const match of tags) {
        count += 1;
        const tag = match[1].toLowerCase();
        if (!allowedHtmlTags.has(tag)) return true;
        const closing = match[0].startsWith('</');
        const attributes = match[2].trim().replace(/\/$/, '').trim();
        if (closing && attributes) return true;
        if (!closing && attributes) {
            const safeSpanClass = tag === 'span' && /^class\s*=\s*(["'])[a-z0-9_:\-\s\[\]().,/%]+\1$/i.test(attributes);
            if (!safeSpanClass) return true;
        }
    }
    return count === 0 || /<\s*[!/a-z?]/i.test(value.replace(/<\/?[a-z0-9]+\b[^>]*>/gi, ''));
}

function isSafeInternalAction(value: string) {
    return value.startsWith('#') || (/^\/(?!\/)/.test(value) && !value.includes('\\'));
}

function isSafeObjectPosition(value: string) {
    const parts = value.trim().split(/\s+/);
    if (parts.length < 1 || parts.length > 2) return false;
    return parts.every(part => ['left', 'center', 'right', 'top', 'bottom'].includes(part)
        || (/^\d{1,3}(?:\.\d+)?%$/.test(part) && Number.parseFloat(part) <= 100));
}

function inspectValue(value: unknown, path: string, errors: string[]) {
    if (typeof value === 'string') {
        if (containsUnsafeHtml(value)) errors.push(`${path}: niedozwolony kod, tag HTML, atrybut lub protokół`);
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((item, index) => inspectValue(item, `${path}[${index}]`, errors));
        return;
    }
    if (!value || typeof value !== 'object') return;

    for (const [key, nested] of Object.entries(value)) {
        if (['buttonLink', 'href'].includes(key) && typeof nested === 'string' && !isSafeInternalAction(nested)) {
            errors.push(`${path}.${key}: CTA musi prowadzić do bezpiecznej ścieżki Aero lub kotwicy`);
        }
        if (['objectPosition', 'objectPositionMobile'].includes(key) && typeof nested === 'string' && !isSafeObjectPosition(nested)) {
            errors.push(`${path}.${key}: niepoprawna lub niebezpieczna pozycja kadru`);
        }
        inspectValue(nested, `${path}.${key}`, errors);
    }
}

export function validateAeroPageSections(rawSections: unknown): { valid: true; sections: PageSection[] } | { valid: false; error: string } {
    let sections: unknown = rawSections;
    if (typeof rawSections === 'string') {
        try {
            sections = JSON.parse(rawSections);
        } catch {
            return { valid: false, error: 'Sekcje Aero Analiza nie są poprawnym JSON-em.' };
        }
    }
    if (!Array.isArray(sections)) return { valid: false, error: 'Sekcje Aero Analiza muszą być tablicą.' };
    if (sections.length < 2 || sections.length > 24) return { valid: false, error: 'Strona Aero Analiza musi mieć od 2 do 24 sekcji.' };

    const typed = sections as PageSection[];
    const errors: string[] = [];
    const ids = new Set<string>();

    typed.forEach((section, index) => {
        const path = `Sekcja ${index + 1}`;
        if (!section || typeof section !== 'object') {
            errors.push(`${path}: niepoprawny format`);
            return;
        }
        if (!section.id || ids.has(section.id)) errors.push(`${path}: brak lub powtórzone ID`);
        if (section.id) ids.add(section.id);
        if (!ALLOWED_AERO_SECTION_TYPES.has(section.type)) errors.push(`${path}: moduł „${section.type}” nie jest dozwolony w Aero Analiza`);
        if (Object.prototype.hasOwnProperty.call(section, 'data')) errors.push(`${path}: zagnieżdżone pole data nie jest obsługiwane przez PageBuilder`);

        if (section.type === 'thermal_slider' && !['registered', 'side_by_side_only', 'pending'].includes(section.alignmentStatus || '')) {
            errors.push(`${path}: wybierz status zgodności pary termicznej`);
        }
        if (section.type === 'thermal_slider') {
            for (const [pairIndex, pair] of (section.thermalSections || []).entries()) {
                if (!['registered', 'side_by_side_only', 'pending'].includes(pair.alignmentStatus || '')) {
                    errors.push(`${path}, para ${pairIndex + 1}: wybierz status zgodności obrazów`);
                }
            }
        }
        if (section.type === 'thermal_hero') {
            for (const [slideIndex, slide] of (section.thermal_hero_slides || []).entries()) {
                if (!['registered', 'side_by_side_only', 'pending'].includes(slide.alignmentStatus || '')) {
                    errors.push(`${path}, para ${slideIndex + 1}: wybierz status zgodności obrazów`);
                }
            }
        }
        inspectValue(section, path, errors);
    });

    if (typed.filter(section => section.type === 'b2b_hero').length !== 1) errors.push('Strona musi zawierać dokładnie jeden moduł Hero (jeden H1).');
    if (typed.filter(section => section.type === 'b2b_contact').length !== 1) errors.push('Strona musi zawierać dokładnie jeden formularz wyceny.');
    if (!hasAeroContentVersion(typed)) errors.push('Brakuje znacznika wersji bezpiecznej treści Aero v2. Uruchom kontrolowaną konwersję w ustawieniach Aero Analiza.');

    return errors.length ? { valid: false, error: errors.slice(0, 6).join(' ') } : { valid: true, sections: typed };
}
