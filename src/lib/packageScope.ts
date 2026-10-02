/** Package copy is stored as rich text by the existing admin editor. */
const TEXT_ENTITIES: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ndash: '–', mdash: '—', hellip: '…', times: '×',
};

function decodeTextEntity(entity: string, name: string): string {
    if (!name.startsWith('#')) return TEXT_ENTITIES[name.toLowerCase()] ?? entity;
    const codePoint = name.toLowerCase().startsWith('#x')
        ? Number.parseInt(name.slice(2), 16)
        : Number.parseInt(name.slice(1), 10);
    return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
        && !(codePoint >= 0xd800 && codePoint <= 0xdfff)
        ? String.fromCodePoint(codePoint)
        : entity;
}

/** Convert editor markup to readable text; callers render it through React. */
export function packageDescriptionLines(value: unknown): string[] {
    if (typeof value !== 'string') return [];
    return value
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<(script|style)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, '')
        .replace(/<\/?(?:p|div|li|ol|ul|h[1-6]|br|hr)\b[^>]*>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, decodeTextEntity)
        .split(/\r?\n/)
        .map(line => line.replace(/[\t\u00a0 ]+/g, ' ').trim())
        .filter(Boolean);
}

/** Accept legacy line-based copy and the JSON array saved by the package API. */
export function parsePackageFeatures(value: unknown): string[] {
    let parsed = value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            parsed = JSON.parse(trimmed);
        } catch {
            // Broken JSON must not be advertised as an offer to the customer.
            if (/^[\[{]/.test(trimmed)) return [];
            parsed = trimmed;
        }
    }
    if (Array.isArray(parsed)) return parsed.flatMap(packageDescriptionLines);
    return typeof parsed === 'string' ? packageDescriptionLines(parsed) : [];
}

/** Keep blank lines while typing; display parsing happens only in the customer UI. */
export function packageFeaturesEditorText(value: unknown): string {
    if (Array.isArray(value)) return value.filter(item => typeof item === 'string').join('\n');
    if (typeof value !== 'string') return '';
    try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed) ? packageFeaturesEditorText(parsed)
            : typeof parsed === 'string' ? parsed : '';
    } catch {
        return value;
    }
}

/**
 * Booking already uses description as the package's public scope. Legacy
 * features can contradict it, so they are a fallback, never extra promises.
 */
export function packageScopeLines(pkg: { description?: unknown; features?: unknown }): string[] {
    const description = packageDescriptionLines(pkg.description);
    return description.length > 0 ? description : parsePackageFeatures(pkg.features);
}

export function formatPackageDuration(hours: number): string {
    const amount = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(hours);
    if (hours === 1) return `${amount} godzina`;
    if (!Number.isInteger(hours)) return `${amount} godziny`;
    if (Number.isInteger(hours) && hours % 100 !== 12 && hours % 100 !== 13 && hours % 100 !== 14
        && hours % 10 >= 2 && hours % 10 <= 4) return `${amount} godziny`;
    return `${amount} godzin`;
}
