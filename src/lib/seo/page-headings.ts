type Section = { type: string; data?: unknown; title?: unknown; content?: unknown; isPrimaryHeading?: unknown };

function hasText(value: unknown): value is string {
    return typeof value === 'string' && value
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;|&#160;|&#x[aA]0;/g, ' ')
        .trim().length > 0;
}

/** Count headings actually emitted by PageRenderer in the server HTML.
 * A flag on an unsupported or client-only section must not suppress the fallback.
 * Existing CMS rich-text H1s remain the document heading without duplicating them.
 */
export function hasServerRenderedPrimaryHeading(sections: Section[]): boolean {
    return sections.some(section => {
        const data = section.data && typeof section.data === 'object'
            ? section.data as Record<string, unknown>
            : section;
        if (section.type === 'hero') return data.isPrimaryHeading === true && hasText(data.title);
        if (section.type === 'b2b_hero') return hasText(data.title);
        if (section.type !== 'rich_text' || typeof data.content !== 'string') return false;
        return Array.from(data.content.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi))
            .some(match => hasText(match[1]));
    });
}
