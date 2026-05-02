/**
 * Foto Wyzwanie — edytowalne teksty marketingowe.
 *
 * Definicje pól z domyślnymi wartościami. Używane przez:
 *   - SSR: src/app/foto-wyzwanie/page.tsx (fallback gdy DB pusta)
 *   - Admin: src/app/admin/challenges/texts/page.tsx (formularz)
 *   - API: src/app/api/admin/challenges/texts/route.ts (GET/POST)
 *
 * Zapis/odczyt: prisma.challengeSetting (key/value),
 * klucze prefiksowane `text_` aby nie kolidowały z konfiguracją.
 */

export type TextFieldKind = 'short' | 'long';

export interface TextField {
    key: string;                // np. 'text_hero_h1_line1'
    label: string;              // wyświetlany w admin
    kind: TextFieldKind;        // input vs textarea
    default: string;
    hint?: string;              // opis pomocniczy (np. "{N} = wolne miejsca")
    section: string;            // grupowanie w UI: 'hero' | 'why' | ...
}

export const TEXT_SECTIONS: { id: string; title: string; icon: string }[] = [
    { id: 'hero', title: 'Hero (sekcja powitalna)', icon: '🎯' },
    { id: 'why', title: 'Dlaczego warto', icon: '💡' },
    { id: 'steps', title: 'Jak to działa (3 kroki)', icon: '📋' },
    { id: 'packages', title: 'Pakiety', icon: '📦' },
    { id: 'testimonial', title: 'Opinia klienta', icon: '⭐' },
    { id: 'author', title: 'O autorze (Twoje bio)', icon: '👤' },
    { id: 'cta', title: 'Końcowy CTA', icon: '🚀' },
];

export const TEXT_FIELDS: TextField[] = [
    // ── HERO ───────────────────────────────────────────────────────────────
    { key: 'text_hero_badge', label: 'Plakietka nad nagłówkiem', kind: 'short', section: 'hero',
      hint: 'Użyj {N} aby wstawić liczbę wolnych miejsc',
      default: 'Limitowana edycja — tylko {N} miejsc w tym miesiącu' },
    { key: 'text_hero_h1_line1', label: 'Nagłówek H1 — linia 1', kind: 'short', section: 'hero',
      default: 'Podaruj komuś' },
    { key: 'text_hero_h1_line2', label: 'Nagłówek H1 — linia 2 (gradient)', kind: 'short', section: 'hero',
      default: 'wspomnienie' },
    { key: 'text_hero_h1_line3', label: 'Nagłówek H1 — linia 3 (handwriting)', kind: 'short', section: 'hero',
      default: 'na zawsze' },
    { key: 'text_hero_subtitle', label: 'Podtytuł hero (HTML dozwolony: <strong>)', kind: 'long', section: 'hero',
      default: 'Foto Wyzwanie to <strong>prezent, którego nie da się odpakować z Allegro</strong>. Zaproś bliską osobę na wspólną sesję fotograficzną w Toruniu lub Bydgoszczy — w cenie nawet do <span class="text-amber-700 font-bold">21% niższej</span> niż standardowa.' },

    // ── WHY ────────────────────────────────────────────────────────────────
    { key: 'text_why_kicker', label: 'Mały tekst nad H2 (handwriting)', kind: 'short', section: 'why',
      default: 'a po co to wszystko?' },
    { key: 'text_why_h2', label: 'Nagłówek H2', kind: 'long', section: 'why',
      default: 'Bo zdjęcia żyją dłużej niż ostatni model telefonu' },
    { key: 'text_benefit_1_title', label: 'Korzyść 1 — tytuł', kind: 'short', section: 'why',
      default: 'Prezent z historią' },
    { key: 'text_benefit_1_desc', label: 'Korzyść 1 — opis', kind: 'long', section: 'why',
      default: 'Zamiast kolejnego kubka — wspólne 2 godziny śmiechu, których nikt Wam nie odbierze.' },
    { key: 'text_benefit_2_title', label: 'Korzyść 2 — tytuł', kind: 'short', section: 'why',
      default: 'Rabat aż do 21%' },
    { key: 'text_benefit_2_desc', label: 'Korzyść 2 — opis', kind: 'long', section: 'why',
      default: 'Wspólna sesja jest tańsza niż dwie osobne. Zyskujecie i zdjęcia, i pieniądze.' },
    { key: 'text_benefit_3_title', label: 'Korzyść 3 — tytuł', kind: 'short', section: 'why',
      default: 'Ja robię resztę' },
    { key: 'text_benefit_3_desc', label: 'Korzyść 3 — opis', kind: 'long', section: 'why',
      default: 'Lokalizacja, światło, pozy, kawa. Wy tylko przyjeżdżacie i bawicie się dobrze.' },

    // ── STEPS ──────────────────────────────────────────────────────────────
    { key: 'text_steps_kicker', label: 'Mały tekst nad H2', kind: 'short', section: 'steps',
      default: 'prosto jak drut' },
    { key: 'text_steps_h2', label: 'Nagłówek H2', kind: 'short', section: 'steps',
      default: 'Trzy kroki do wspomnień' },
    { key: 'text_step_1_title', label: 'Krok 1 — tytuł', kind: 'short', section: 'steps',
      default: 'Wybierz pakiet i osobę' },
    { key: 'text_step_1_desc', label: 'Krok 1 — opis', kind: 'long', section: 'steps',
      default: 'Klikasz, wybierasz pakiet, wpisujesz imię osoby, którą chcesz zaprosić, i opłacasz online.' },
    { key: 'text_step_2_title', label: 'Krok 2 — tytuł', kind: 'short', section: 'steps',
      default: 'Ona dostaje zaproszenie' },
    { key: 'text_step_2_desc', label: 'Krok 2 — opis', kind: 'long', section: 'steps',
      default: 'Wysyłam jej e-mail z prywatnym linkiem. Ma 24 h, żeby wybrać termin i lokalizację. Bez logowania, bez haseł.' },
    { key: 'text_step_3_title', label: 'Krok 3 — tytuł', kind: 'short', section: 'steps',
      default: 'Spotykamy się na sesji' },
    { key: 'text_step_3_desc', label: 'Krok 3 — opis', kind: 'long', section: 'steps',
      default: 'Toruń, Bydgoszcz lub Wasze ulubione miejsce. 60–90 minut zabawy, dziesiątki ujęć w galerii online.' },

    // ── PACKAGES ───────────────────────────────────────────────────────────
    { key: 'text_packages_kicker', label: 'Mały tekst nad H2', kind: 'short', section: 'packages',
      default: 'wybierz coś dla siebie' },
    { key: 'text_packages_h2', label: 'Nagłówek H2', kind: 'short', section: 'packages',
      default: 'Pakiety na każdą okazję' },

    // ── TESTIMONIAL ────────────────────────────────────────────────────────
    { key: 'text_testimonial_quote', label: 'Cytat klienta', kind: 'long', section: 'testimonial',
      default: '„Zaprosiłam mamę na sesję jako prezent na 60. urodziny. Płakałyśmy obie — najpierw na sesji, potem oglądając zdjęcia. Najlepiej wydane pieniądze ostatnich lat."' },
    { key: 'text_testimonial_author', label: 'Podpis (imię, miasto)', kind: 'short', section: 'testimonial',
      default: '— Magda, Toruń' },

    // ── AUTHOR ─────────────────────────────────────────────────────────────
    { key: 'text_author_kicker', label: 'Mały tekst nad H2', kind: 'short', section: 'author',
      default: 'kto Was sfotografuje?' },
    { key: 'text_author_h2', label: 'Nagłówek H2', kind: 'short', section: 'author',
      default: 'Profesjonalny fotograf z 10-letnim doświadczeniem' },
    { key: 'text_author_p1', label: 'Akapit 1 (HTML <strong> dozwolone)', kind: 'long', section: 'author',
      default: 'Robię zdjęcia od 2014 roku. W tym czasie sfotografowałem ponad <strong>300 sesji rodzinnych, par i indywidualnych</strong>, kilkadziesiąt ślubów i niezliczoną ilość komunii. Specjalizuję się w naturalnych, niewymuszonych kadrach — bez sztywnego pozowania, bez „ptaszka", bez sztucznych uśmiechów.' },
    { key: 'text_author_p2', label: 'Akapit 2', kind: 'long', section: 'author',
      default: 'Pracuję na sprzęcie pełnoklatkowym Sony A7, używam stałych obiektywów i światła naturalnego. Każdą sesję obrabiam osobiście — galerię online udostępniam w ciągu 14 dni.' },
    { key: 'text_author_p3', label: 'Akapit 3 (HTML dozwolone)', kind: 'long', section: 'author',
      default: 'Foto Wyzwanie to mój autorski projekt — chciałem dać ludziom narzędzie do robienia <strong>prezentów, które naprawdę zostają</strong>. Nie kolejny voucher do spa, nie kolejny kubek z napisem. Wspólny czas, wspomnienie, zdjęcie na ścianie za 20 lat.' },

    // ── FINAL CTA ──────────────────────────────────────────────────────────
    { key: 'text_cta_kicker', label: 'Mały tekst nad H2', kind: 'short', section: 'cta',
      default: 'no to co — robimy?' },
    { key: 'text_cta_h2', label: 'Nagłówek H2', kind: 'long', section: 'cta',
      default: 'Daj komuś prezent, który przeżyje Was oboje' },
    { key: 'text_cta_subtitle', label: 'Podtytuł (użyj {N} dla liczby miejsc)', kind: 'long', section: 'cta',
      default: 'Zostało <strong class="text-amber-300">{N} miejsc</strong> w tym miesiącu. Następne dopiero w przyszłym.' },
    { key: 'text_cta_button', label: 'Tekst przycisku', kind: 'short', section: 'cta',
      default: 'Tak, stwarzam wyzwanie' },
];

/** Mapa key → default — szybki lookup dla SSR fallback */
export const TEXT_DEFAULTS: Record<string, string> = TEXT_FIELDS.reduce((acc, f) => {
    acc[f.key] = f.default;
    return acc;
}, {} as Record<string, string>);

/** Pobierz wartość z mapy settings z fallbackiem do default. */
export function getText(settings: Record<string, string>, key: string): string {
    const v = settings[key];
    if (v === undefined || v === null || v === '') return TEXT_DEFAULTS[key] ?? '';
    return v;
}

/** Podstaw {N} → liczba (dla badge i CTA subtitle) */
export function interpolate(text: string, vars: Record<string, string | number>): string {
    return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
