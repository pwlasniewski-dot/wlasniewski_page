/**
 * Katalog szablonów umów dla różnych kategorii usług.
 *
 * Placeholdery (zastępowane przez API /api/admin/contracts po zapisie i przez
 * ContractBuilder przy podglądzie/edycji):
 *   {{contractNumber}}, {{currentDate}}
 *   {{clientName}}, {{clientEmail}}, {{clientPhone}}, {{clientAddress}}
 *   {{eventDate}}, {{eventTime}}, {{eventLocation}}, {{eventCount}}, {{eventTeam}}
 *   {{offerTitle}}, {{packageDetails}}, {{totalPrice}}
 *   {{workshopPlan}}  (tylko warsztaty)
 *   {{deliveryDays}}  (np. ile dni na oddanie)
 */

export type ContractTemplateKey =
    | 'standard'
    | 'komunia'
    | 'urodziny'
    | 'slub'
    | 'sesja'
    | 'warsztaty'
    | 'chor'
    | 'b2b';

export interface ContractTemplateMeta {
    key: ContractTemplateKey;
    label: string;
    description: string;
    /** Kategorie ofert (Offer.category), z których auto-podstawimy ten szablon. */
    matchOfferCategories: string[];
}

const COMMON_FOOTER = `

## POSTANOWIENIA KOŃCOWE
1. Wszelkie zmiany niniejszej Umowy wymagają formy pisemnej pod rygorem nieważności.
2. W sprawach nieuregulowanych zastosowanie mają przepisy Kodeksu Cywilnego.
3. Spory wynikłe z realizacji niniejszej Umowy strony będą rozstrzygać polubownie, a w razie braku porozumienia – sąd właściwy dla siedziby Wykonawcy.
4. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.

## PRAWA AUTORSKIE I RODO
1. Wykonawca zachowuje autorskie prawa osobiste do wykonanych zdjęć.
2. Zleceniodawca otrzymuje licencję niewyłączną do wykorzystywania zdjęć w celach prywatnych.
3. Wykonawca może wykorzystać wybrane zdjęcia w portfolio, na stronie www.wlasniewski.pl oraz w mediach społecznościowych, chyba że Strony postanowią inaczej w pisemnej adnotacji do Umowy.
4. Administratorem danych osobowych Zleceniodawcy jest Wykonawca. Dane przetwarzane są wyłącznie w celu realizacji niniejszej Umowy zgodnie z RODO.

---

**Wykonawca:** ............................................
**Zleceniodawca:** ............................................
`;

const HEADER = (title: string) => `# ${title}
**Numer umowy:** {{contractNumber}}
**Data zawarcia:** {{currentDate}}

## STRONY UMOWY
**Wykonawca:** FOTO-DRON Przemysław Właśniewski, ul. Szeroka 1, 87-100 Toruń, NIP: 8781430365
**Zleceniodawca:** {{clientName}}
E-mail: {{clientEmail}} · Tel.: {{clientPhone}}
`;

const TEMPLATES: Record<ContractTemplateKey, string> = {
    standard:
        HEADER('UMOWA O ŚWIADCZENIE USŁUG FOTOGRAFICZNYCH') +
        `
## §1 PRZEDMIOT UMOWY
Przedmiotem umowy jest wykonanie usługi fotograficznej zgodnie z ofertą **"{{offerTitle}}"** w dniu **{{eventDate}}** o godzinie **{{eventTime}}** w lokalizacji **{{eventLocation}}**.

{{packageDetails}}

## §2 WYNAGRODZENIE
Strony ustalają wynagrodzenie w kwocie **{{totalPrice}} PLN** brutto. Płatność:
- **Zaliczka: {{depositAmount}} PLN** — płatna do **{{depositDueDate}}** przelewem na rachunek Wykonawcy. Brak wpłaty zaliczki w terminie powoduje unieważnienie rezerwacji terminu sesji.
- Pozostała kwota: w dniu wydania materiałów.

## §3 TERMIN WYDANIA MATERIAŁÓW
Wykonawca zobowiązuje się wydać gotowe materiały w terminie do {{deliveryDays}} dni roboczych od dnia sesji, w formie galerii online z możliwością pobrania plików w pełnej rozdzielczości.
` + COMMON_FOOTER,

    komunia:
        HEADER('UMOWA NA WYKONANIE USŁUGI FOTOGRAFICZNEJ — PIERWSZA KOMUNIA ŚWIĘTA') +
        `
## §1 PRZEDMIOT UMOWY
Przedmiotem umowy jest wykonanie profesjonalnego reportażu fotograficznego z uroczystości **Pierwszej Komunii Świętej** zgodnie z ofertą **"{{offerTitle}}"**.

**Szczegóły uroczystości:**
- Parafia / miejsce: **{{eventLocation}}**
- Data: **{{eventDate}}**
- Godzina Mszy Świętej: **{{eventTime}}**
- Liczba dzieci objętych umową: **{{eventCount}}**

{{packageDetails}}

## §2 ZAKRES USŁUGI
1. Reportaż z Mszy Świętej — dokumentacja najważniejszych momentów liturgii i klimatu uroczystości.
2. Sesja po Mszy — zdjęcie grupowe oraz indywidualne portrety dziecka z rodziną.
3. Galeria online z dostępem do zdjęć w pełnej rozdzielczości (hasło na zdjęcia, pobieranie).
4. Czas pracy fotografa: od 60 minut przed Mszą do zakończenia sesji po Mszy.

## §3 WYNAGRODZENIE I PŁATNOŚĆ
Strony ustalają wynagrodzenie w kwocie **{{totalPrice}} PLN** brutto.
- **Zaliczka: {{depositAmount}} PLN** — płatna do **{{depositDueDate}}** przelewem na rachunek Wykonawcy. Brak wpłaty zaliczki w terminie powoduje unieważnienie rezerwacji terminu uroczystości.
- Pozostała kwota: w dniu wydania galerii.

## §4 TERMIN WYDANIA MATERIAŁÓW
Galeria online zostanie udostępniona w terminie do 30 dni roboczych od dnia uroczystości.

## §5 UPRAWNIENIA KURIALNE
Wykonawca posiada zgodę proboszcza/kurii na wykonywanie zdjęć w trakcie liturgii oraz pracuje zgodnie z zasadami ustalonymi z parafią.
` + COMMON_FOOTER,

    urodziny:
        HEADER('UMOWA NA WYKONANIE USŁUGI FOTOGRAFICZNEJ — PRZYJĘCIE URODZINOWE') +
        `
## §1 PRZEDMIOT UMOWY
Przedmiotem umowy jest wykonanie reportażu fotograficznego z **przyjęcia urodzinowego** zgodnie z ofertą **"{{offerTitle}}"**.

**Szczegóły wydarzenia:**
- Miejsce: **{{eventLocation}}**
- Data: **{{eventDate}}**
- Godzina rozpoczęcia: **{{eventTime}}**
- Liczba gości / charakter przyjęcia: **{{eventCount}}**

{{packageDetails}}

## §2 ZAKRES USŁUGI
1. Reportaż z przyjęcia: powitanie gości, tort, animacje, wspólne zabawy.
2. Sesja portretowa Jubilata z rodziną i przyjaciółmi.
3. Galeria online z możliwością pobrania zdjęć w pełnej rozdzielczości.

## §3 WYNAGRODZENIE
Strony ustalają wynagrodzenie w kwocie **{{totalPrice}} PLN** brutto.
- **Zaliczka: {{depositAmount}} PLN** — płatna do **{{depositDueDate}}** przelewem na rachunek Wykonawcy. Brak wpłaty zaliczki w terminie powoduje unieważnienie rezerwacji terminu wydarzenia.
- Pozostała kwota: w dniu wydarzenia lub bezpośrednio po wydaniu materiałów.

## §4 TERMIN WYDANIA MATERIAŁÓW
Galeria online udostępniona w terminie do 21 dni roboczych od dnia wydarzenia.
` + COMMON_FOOTER,

    slub:
        HEADER('UMOWA NA WYKONANIE FOTOGRAFII ŚLUBNEJ') +
        `
## §1 PRZEDMIOT UMOWY
Przedmiotem umowy jest wykonanie pełnego reportażu fotograficznego z uroczystości ślubnej zgodnie z ofertą **"{{offerTitle}}"**.

**Szczegóły uroczystości:**
- Miejsce ceremonii: **{{eventLocation}}**
- Data ślubu: **{{eventDate}}**
- Godzina ceremonii: **{{eventTime}}**
- Skład ekipy: **{{eventTeam}}**

{{packageDetails}}

## §2 ZAKRES USŁUGI
1. Przygotowania Pary Młodej (do 60 minut przed wyjściem do kościoła).
2. Ceremonia ślubu / błogosławieństwa w kościele lub urzędzie.
3. Sesja plenerowa Pary Młodej (do 90 minut, w uzgodnionym miejscu).
4. Reportaż z przyjęcia weselnego do uzgodnionej godziny.
5. Edycja minimum **{{eventCount}}** zdjęć w pełnej obróbce, galeria online z pobieraniem.

## §3 WYNAGRODZENIE
Strony ustalają wynagrodzenie w kwocie **{{totalPrice}} PLN** brutto.
- **Zaliczka rezerwująca termin: {{depositAmount}} PLN** — płatna do **{{depositDueDate}}** przelewem na rachunek Wykonawcy (bezzwrotna). Brak wpłaty w terminie skutkuje zwolnieniem rezerwacji.
- 50% pozostałej kwoty: do 30 dni przed datą ślubu.
- Pozostała część: w dniu ślubu lub do 7 dni po wydaniu galerii.

## §4 TERMIN WYDANIA MATERIAŁÓW
Galeria online: do 60 dni roboczych od dnia ślubu. Album drukowany (jeśli w pakiecie): do 90 dni od zatwierdzenia projektu.

## §5 SIŁA WYŻSZA I REZYGNACJA
W przypadku rezygnacji ze strony Zleceniodawcy zadatek nie podlega zwrotowi. Wykonawca zobowiązuje się do dołożenia wszelkich starań w sytuacjach losowych (zapasowy fotograf z zespołu).
` + COMMON_FOOTER,

    sesja:
        HEADER('UMOWA NA WYKONANIE SESJI FOTOGRAFICZNEJ') +
        `
## §1 PRZEDMIOT UMOWY
Przedmiotem umowy jest wykonanie sesji fotograficznej zgodnie z ofertą **"{{offerTitle}}"**.

**Szczegóły sesji:**
- Miejsce: **{{eventLocation}}**
- Data: **{{eventDate}}**
- Godzina rozpoczęcia: **{{eventTime}}**
- Liczba osób / charakter sesji: **{{eventCount}}**

{{packageDetails}}

## §2 ZAKRES USŁUGI
1. Przeprowadzenie sesji w uzgodnionym miejscu i czasie.
2. Selekcja i obróbka uzgodnionej liczby zdjęć.
3. Galeria online z pobieraniem plików w pełnej rozdzielczości.

## §3 WYNAGRODZENIE
Wynagrodzenie wynosi **{{totalPrice}} PLN** brutto. Płatne w dniu sesji lub w dniu wydania galerii.

## §4 TERMIN WYDANIA MATERIAŁÓW
Galeria online: do 21 dni roboczych od dnia sesji.
` + COMMON_FOOTER,

    warsztaty:
        HEADER('UMOWA O ORGANIZACJĘ WARSZTATÓW FOTOGRAFICZNYCH') +
        `
## §1 PRZEDMIOT UMOWY
Przedmiotem umowy jest przeprowadzenie przez Wykonawcę cyklu warsztatów fotograficznych pt. **"{{offerTitle}}"**.

**Szczegóły organizacyjne:**
- Miejsce zajęć: **{{eventLocation}}**
- Termin: **{{eventDate}}**
- Liczba uczestników: **{{eventCount}}**
- Skład prowadzących: **{{eventTeam}}**

## §2 PROGRAM WARSZTATÓW
{{workshopPlan}}

## §3 ZAKRES ŚWIADCZEŃ WYKONAWCY
1. Prowadzenie zajęć teoretycznych i praktycznych zgodnie z planem.
2. Udostępnienie uczestnikom indywidualnych kont online (login + PIN, bez zbierania danych osobowych) z dostępem do materiałów edukacyjnych i miejscem na ich zdjęcia.
3. Bieżąca informacja zwrotna (feedback) prowadzącego do prac uczestników.
4. Wręczenie dyplomów ukończenia warsztatów.

## §4 OBOWIĄZKI ZLECENIODAWCY
1. Zapewnienie sali wykładowej na dni teoretyczne wraz z dostępem do prądu i ekranu/projektora.
2. Zapewnienie listy uczestników (imię/pseudonim, wiek) najpóźniej 7 dni przed rozpoczęciem.
3. Uzyskanie zgód rodziców/opiekunów prawnych na udział małoletnich w warsztatach oraz na wizerunek (formularz dostarcza Wykonawca).

## §5 WYNAGRODZENIE
Wynagrodzenie ryczałtowe wynosi **{{totalPrice}} PLN** brutto.
- **Zaliczka: {{depositAmount}} PLN** — płatna do **{{depositDueDate}}** przelewem na rachunek Wykonawcy. Brak wpłaty w terminie powoduje unieważnienie rezerwacji terminu warsztatów.
- Pozostała kwota: w terminie 7 dni po zakończeniu ostatniego dnia warsztatów.

## §6 BEZPIECZEŃSTWO I RODO
1. Wykonawca nie zbiera od uczestników (zwłaszcza małoletnich) adresów e-mail, numerów telefonów ani innych danych osobowych poza loginem warsztatowym i opcjonalnym pseudonimem.
2. Konta uczestników są aktywne wyłącznie na czas trwania warsztatów; po ich zakończeniu Wykonawca usuwa lub anonimizuje konta na wniosek Zleceniodawcy lub po 90 dniach.
3. Wgrywane przez uczestników zdjęcia są dostępne wyłącznie dla nich oraz prowadzącego.
` + COMMON_FOOTER,

    chor:
        HEADER('UMOWA NA WYKONANIE SESJI FOTOGRAFICZNEJ ZESPOŁU / CHÓRU') +
        `
## §1 PRZEDMIOT UMOWY
Przedmiotem umowy jest wykonanie sesji fotograficznej zespołu / chóru **"{{offerTitle}}"**, obejmującej zdjęcia grupowe oraz portrety członków zespołu.

**Szczegóły sesji:**
- Miejsce: **{{eventLocation}}**
- Data: **{{eventDate}}**
- Godzina rozpoczęcia: **{{eventTime}}**
- Liczba osób w zespole: **{{eventCount}}**

{{packageDetails}}

## §2 ZAKRES USŁUGI
1. Sesja grupowa zespołu w uzgodnionej aranżacji (układ, tło, oświetlenie).
2. Indywidualne portrety członków zespołu w spójnej stylistyce.
3. Selekcja i pełna obróbka uzgodnionej liczby zdjęć.
4. Galeria online z możliwością pobrania w wersji do druku oraz internetowej.

## §3 WYNAGRODZENIE
Wynagrodzenie wynosi **{{totalPrice}} PLN** brutto. Płatne przelewem na rachunek Wykonawcy w terminie 14 dni od wydania materiałów.

## §4 TERMIN WYDANIA MATERIAŁÓW
Galeria online: do 21 dni roboczych od dnia sesji.

## §5 LICENCJA
Zespół / chór otrzymuje licencję na wykorzystanie zdjęć w materiałach promocyjnych, na stronie internetowej oraz w mediach społecznościowych z oznaczeniem autorstwa: *"Foto: Przemysław Właśniewski / wlasniewski.pl"*.
` + COMMON_FOOTER,

    b2b:
        HEADER('UMOWA O ŚWIADCZENIE USŁUG FOTOGRAFICZNYCH (B2B)') +
        `
## §1 PRZEDMIOT UMOWY
Przedmiotem umowy jest świadczenie przez Wykonawcę na rzecz Zleceniodawcy usług fotograficznych zgodnie z ofertą **"{{offerTitle}}"**.

**Szczegóły zlecenia:**
- Miejsce realizacji: **{{eventLocation}}**
- Data / okres realizacji: **{{eventDate}}**
- Zakres ilościowy: **{{eventCount}}**

{{packageDetails}}

## §2 WYNAGRODZENIE I FAKTUROWANIE
Strony ustalają wynagrodzenie w kwocie **{{totalPrice}} PLN** netto + VAT zgodnie z obowiązującymi przepisami.
Płatność na podstawie faktury VAT, w terminie 14 dni od dnia doręczenia faktury, na rachunek wskazany w fakturze.

## §3 LICENCJA
Wykonawca udziela Zleceniodawcy licencji niewyłącznej na wykorzystanie wykonanych zdjęć na polach eksploatacji wymienionych w ofercie. Możliwość rozszerzenia licencji wymaga aneksu pisemnego.

## §4 TERMINY
Wykonawca zobowiązuje się dostarczyć materiał w terminie do {{deliveryDays}} dni roboczych od dnia realizacji.
` + COMMON_FOOTER,
};

export const CONTRACT_TEMPLATES_META: ContractTemplateMeta[] = [
    { key: 'standard', label: 'Standardowa', description: 'Uniwersalna umowa o usługi fotograficzne.', matchOfferCategories: ['standard', ''] },
    { key: 'komunia', label: 'Komunia Święta', description: 'Reportaż I Komunii Świętej.', matchOfferCategories: ['komunia'] },
    { key: 'urodziny', label: 'Urodziny / Przyjęcie', description: 'Reportaż z urodzin lub przyjęcia.', matchOfferCategories: ['urodziny', 'przyjecie'] },
    { key: 'slub', label: 'Ślub', description: 'Pełna fotografia ślubna.', matchOfferCategories: ['slub', 'wesele'] },
    { key: 'sesja', label: 'Sesja fotograficzna', description: 'Sesja portretowa, plenerowa, rodzinna.', matchOfferCategories: ['sesja', 'portret', 'plener', 'rodzinna'] },
    { key: 'warsztaty', label: 'Warsztaty fotograficzne', description: 'Warsztaty / szkolenia, w tym dla dzieci. Zawiera plan zajęć i klauzule RODO.', matchOfferCategories: ['warsztaty', 'szkolenie'] },
    { key: 'chor', label: 'Chór / Zespół', description: 'Sesja grupowa i portrety zespołu.', matchOfferCategories: ['chor', 'zespol'] },
    { key: 'b2b', label: 'B2B (firmowa)', description: 'Umowa firma-firma z licencją i fakturą VAT.', matchOfferCategories: ['b2b'] },
];

export function getContractTemplate(key: ContractTemplateKey): string {
    return TEMPLATES[key] || TEMPLATES.standard;
}

/** Wybiera szablon na podstawie kategorii oferty (Offer.category). */
export function suggestTemplateForCategory(category: string | null | undefined): ContractTemplateKey {
    if (!category) return 'standard';
    const found = CONTRACT_TEMPLATES_META.find(t => t.matchOfferCategories.includes(category));
    return found ? found.key : 'standard';
}

/** Renderuje treść z podstawionymi placeholderami. Brakujące pola zostają jako etykiety [BRAK]. */
export function renderContractTemplate(
    key: ContractTemplateKey,
    vars: Record<string, string | number | null | undefined>
): string {
    let out = getContractTemplate(key);
    out = out.replace(/\{\{(\w+)\}\}/g, (_, name) => {
        const v = vars[name];
        if (v === null || v === undefined || v === '') return `[uzupełnij: ${name}]`;
        return String(v);
    });
    return out;
}
