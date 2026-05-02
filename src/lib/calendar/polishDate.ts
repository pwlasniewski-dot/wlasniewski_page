/**
 * Parser polskich dat z Offer.template_data.eventDate.
 * Obsługuje:
 *   "30 maja 2026 r."        → 2026-05-30
 *   "30 maja 2026"           → 2026-05-30
 *   "6.08.2026" / "06.08.2026" → 2026-08-06
 *   "2026-08-06"             → 2026-08-06
 *   "6 sierpnia 2026"        → 2026-08-06
 *   "30/05/2026"             → 2026-05-30
 *
 * Zwraca null jeśli nie udało się sparsować.
 */

const MONTHS_PL: Record<string, number> = {
    'styczeń': 0, 'stycznia': 0, 'sty': 0,
    'luty': 1, 'lutego': 1, 'lut': 1,
    'marzec': 2, 'marca': 2, 'mar': 2,
    'kwiecień': 3, 'kwietnia': 3, 'kwi': 3,
    'maj': 4, 'maja': 4,
    'czerwiec': 5, 'czerwca': 5, 'cze': 5,
    'lipiec': 6, 'lipca': 6, 'lip': 6,
    'sierpień': 7, 'sierpnia': 7, 'sie': 7,
    'wrzesień': 8, 'września': 8, 'wrz': 8,
    'październik': 9, 'października': 9, 'paź': 9,
    'listopad': 10, 'listopada': 10, 'lis': 10,
    'grudzień': 11, 'grudnia': 11, 'gru': 11,
};

export function parsePolishDate(input: string | null | undefined): Date | null {
    if (!input || typeof input !== 'string') return null;
    const s = input.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\br\.?$/i, '').trim();
    if (!s) return null;

    // ISO: 2026-05-30
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (m) {
        return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    }

    // 30.05.2026 lub 30/05/2026 lub 6.08.2026
    m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/.exec(s);
    if (m) {
        return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    }

    // 30 maja 2026 / 6 sierpnia 2026
    m = /^(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})/.exec(s);
    if (m) {
        const month = MONTHS_PL[m[2]];
        if (month !== undefined) return new Date(Date.UTC(+m[3], month, +m[1]));
    }

    return null;
}

/**
 * Ekstrahuje godzinę z wolnego stringa: "17:00", "17.00", "17", "godz. 17:00".
 * Zwraca "HH:MM" lub null.
 */
export function parsePolishTime(input: string | null | undefined): string | null {
    if (!input || typeof input !== 'string') return null;
    const m = /(\d{1,2})[:.](\d{2})/.exec(input) || /godz\.?\s*(\d{1,2})(?:[:.](\d{2}))?/i.exec(input);
    if (!m) {
        // sam "17" gdy występuje jako liczba godzin — tylko jeśli wygląda jak czas (1-23)
        const single = /\b(\d{1,2})\b/.exec(input);
        if (single) {
            const h = +single[1];
            if (h >= 0 && h <= 23) return `${String(h).padStart(2, '0')}:00`;
        }
        return null;
    }
    const h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
