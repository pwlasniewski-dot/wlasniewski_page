export function documentUrl(value: unknown): string | undefined {
    if (typeof value !== 'string' || !value.trim() || /[\u0000-\u0020\\]/.test(value)) return undefined;
    if (value.startsWith('/') && !value.startsWith('//')) return value;
    try { return new URL(value).protocol === 'https:' ? value : undefined; } catch { return undefined; }
}

export function validateDocumentSections(value: unknown): string | null {
    let sections: unknown;
    try { sections = typeof value === 'string' ? JSON.parse(value) : value; } catch { return 'Nieprawidłowy zapis modułów.'; }
    if (!Array.isArray(sections) || sections.length > 100) return 'Nieprawidłowa lista modułów.';
    for (const section of sections) {
        if (!section || typeof section !== 'object') return 'Nieprawidłowy moduł.';
        if (section.type !== 'document_download') continue;
        const data = section.data || section;
        for (const field of ['title', 'subtitle', 'description', 'tag', 'content', 'label', 'imageAlt', 'buttonText']) {
            if (data[field] !== undefined && (typeof data[field] !== 'string' || data[field].length > 10000)) return 'Nieprawidłowa treść modułu dokumentu.';
        }
        for (const field of ['image', 'buttonLink']) {
            if (data[field] && !documentUrl(data[field])) return 'Adres pliku lub podglądu musi prowadzić do tej strony albo używać HTTPS.';
        }
    }
    return null;
}
