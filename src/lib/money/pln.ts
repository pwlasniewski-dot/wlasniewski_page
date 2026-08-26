/**
 * Parses a PLN amount without guessing across incompatible separator layouts.
 *
 * Accepted examples include plain numbers, Polish decimal commas and grouped
 * thousands (`1 350`, `1.350`, `1.350,00`). US-style grouped input is also
 * accepted when its layout is explicit (`1,350.00`). Invalid/ambiguous input
 * returns null so document delivery and acceptance can fail closed.
 */
export function parsePlnAmount(value: unknown): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
    }
    if (typeof value !== 'string') return null;

    const amount = value
        .trim()
        .replace(/(?:\s*(?:PLN|zł(?:ot(?:y|ych|e)?)?)\s*)$/iu, '')
        .trim()
        .replace(/[\u00a0\u202f]/g, ' ');
    if (!amount || !/^[0-9][0-9 .,]*$/.test(amount)) return null;

    let normalized: string;
    if (/^\d+$/.test(amount)) {
        normalized = amount;
    } else if (/^\d+(?:[,.]0{1,2})$/.test(amount)) {
        normalized = amount.replace(',', '.');
    } else if (/^\d{1,3}(?:(?: |\.)\d{3})+(?:,0{1,2})?$/.test(amount)) {
        normalized = amount.replace(/[ .]/g, '').replace(',', '.');
    } else if (/^\d{1,3}(?:,\d{3})+\.0{1,2}$/.test(amount)) {
        normalized = amount.replace(/,/g, '');
    } else {
        return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

export function formatPlnAmount(value: unknown): string {
    const parsed = parsePlnAmount(value);
    return parsed === null ? '—' : `${parsed.toLocaleString('pl-PL')} PLN`;
}

export function isPositivePlnAmount(value: unknown): boolean {
    const parsed = parsePlnAmount(value);
    return parsed !== null && parsed > 0;
}
