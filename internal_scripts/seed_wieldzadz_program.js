/**
 * Wypełnia warsztat "wieldzadz" 7-dniowym programem fotograficznym dla dzieciakow,
 * pakietem materialow edukacyjnych i ustawia status='active' (zeby landing /warsztaty/[slug] dzialal).
 *
 * Uruchom: node internal_scripts/seed_wieldzadz_program.js
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SLUG = 'wieldzadz';

// Format weekendowy 3-zjazdowy: 04.07 (sobota), 08.07 (środa wieczór), 11.07 (sobota — finał).
// Między zjazdami uczestnicy fotografują samodzielnie (zadania domowe), na zjazdach omawiamy.
const SCHEDULE = [
    {
        date: '2026-07-04', start: '10:00', end: '18:00',
        topic: 'Zjazd 1 (sobota) — Aparat od podszewki + pierwsza sesja',
        plan: '10:00 powitanie, integracja, "kto czym fotografuje" (pokazujemy sprzęt). 10:30 wykład praktyczny: jak działa aparat — przysłona, czas, ISO bez teorii, od razu na żywych przykładach na rzutniku. 12:00 ćwiczenia z trybem M w sali — każdy ustawia ekspozycję sam. 13:00 obiad. 14:00 wyjście w plener (łąki/las wokół Wieldzadza) — pierwsza sesja w trybie manualnym, ćwiczymy trójkąt ekspozycji w praktyce. Prowadzący chodzi od osoby do osoby z indywidualnymi wskazówkami. 16:30 powrót, omawianie zdjęć na rzutniku (najlepsze i najsłabsze — bez hejtu, tylko nauka). 17:30 zadanie domowe na 4 dni: każdy ma temat ("światło poranne", "cień", "ruch", "detal", "portret bliskiej osoby" — losujemy). Minimum 30 zdjęć, wybierasz 5 najlepszych na zjazd 2. 18:00 koniec dnia.',
    },
    {
        date: '2026-07-08', start: '17:00', end: '21:00',
        topic: 'Zjazd 2 (środa wieczór) — Omówienie zadań + kompozycja i portret',
        plan: '17:00 zbiórka, każdy wgrywa swoje 5 najlepszych zdjęć z tygodnia na panel uczestnika (zakładka "Moje zdjęcia"). 17:30 indywidualne omawianie pracy każdego — prowadzący daje konkretny feedback przy całej grupie (uczymy się od siebie nawzajem). 18:30 wykład: kompozycja — zasada trójpodziału, linie prowadzące, kadrowanie, "oddech" w portrecie. 19:00 krótka przerwa, kanapki. 19:30 sesja portretowa w parach na miejscu — każdy fotografuje partnera w różnym świetle (przy oknie, w cieniu, pod lampą). Ćwiczymy ostrość na oko, ogniskową 50–85 mm, rozmowę z modelem. 20:30 omawianie portretów na żywo — co działa, co nie. 20:45 zadanie domowe na 3 dni do finału: własny mini-projekt ("seria 5 zdjęć na jeden temat"), temat wymyśla sam uczestnik. 21:00 koniec.',
    },
    {
        date: '2026-07-11', start: '10:00', end: '17:00',
        topic: 'Zjazd 3 (sobota) — Wystawa, dyplomy, finałowa sesja grupowa',
        plan: '10:00 zbiórka, wgranie finałowych projektów (5 zdjęć × seria) na panel. 10:30 prezentacja każdego projektu — każdy uczestnik opowiada o swoim temacie, dlaczego go wybrał, co próbował pokazać. Reszta grupy + prowadzący komentują. 12:30 obiad + grupowe zdjęcie pamiątkowe. 13:30 minikurs edycji w telefonie (Lightroom Mobile / Snapseed) — minimalna naturalna obróbka, ekspozycja, kontrast, wyostrzenie. Każdy edytuje jedno zdjęcie z własnego portfolio. 14:30 wystawa wydrukowanych prac (każdy uczestnik dostaje 3 swoje zdjęcia drukowane A4 jako pamiątkę). 15:30 uroczyste wręczenie dyplomów ukończenia warsztatów + drobne nagrody (książka o fotografii, vouchery na sesję dla rodziny). 16:00 ostatnia wspólna sesja portretowa — całą grupę fotografuje prowadzący (potem dostajecie te zdjęcia w panelu). 16:30 podsumowanie, wymiana kontaktów, info jak rozwijać się dalej, polecane książki / kanały YT / kursy. 17:00 koniec — pendrive z WSZYSTKIMI Twoimi zdjęciami z całych warsztatów + zdjęciami grupowymi do odbioru.',
    },
];

const MATERIALS = [
    {
        title: 'Trójkąt ekspozycji — jak naświetlić zdjęcie',
        body_md: `Zdjęcie wychodzi DOBRZE naświetlone, gdy światło, czas i czułość są w równowadze.

**Trzy parametry:**
- **Przysłona (f/...)** — jak szeroko otwarte oko aparatu. Mała liczba (f/2.8) = duże oko, dużo światła, rozmyte tło. Duża liczba (f/16) = małe oko, mało światła, ostro od bliska do daleka.
- **Czas (1/125 s)** — jak długo aparat patrzy. Krótko (1/1000) = zatrzymujesz ruch. Długo (1/30) = ruch się rozmywa.
- **ISO (100, 400, 1600)** — czułość matrycy. Niskie ISO = czyste zdjęcie. Wysokie ISO = jaśniej w mroku, ale "ziarno".

> Reguła: gdy zwiększasz jeden, zmniejsz drugi, żeby zdjęcie nie było za jasne ani za ciemne.`,
    },
    {
        title: 'Tryb manualny (M) — krok po kroku',
        body_md: `1. Ustaw **ISO** najniższe, jakie się da (100 w słońcu, 800–1600 w cieniu).
2. Ustaw **przysłonę** zależnie od efektu: portret z rozmytym tłem → f/2.8–f/4. Pejzaż ostry wszędzie → f/8–f/11.
3. Patrz na **wskaźnik ekspozycji** w wizjerze (skala "-2 ... 0 ... +2").
4. Kręć **czasem**, żeby strzałka stała na 0.
5. Pstryk! Sprawdź zdjęcie. Za ciemne → wydłuż czas. Za jasne → skróć czas.`,
    },
    {
        title: 'Kompozycja: zasada trójpodziału',
        body_md: `Wyobraź sobie kratkę 3×3 na zdjęciu. **Najważniejsze rzeczy** (oko portretowanej osoby, horyzont) wstaw na **liniach** lub w **punktach przecięcia** — nie na środku. Zdjęcie od razu wygląda lepiej.

**Linie prowadzące:** ścieżka, droga, rzeka — niech "ciągną" oko w głąb kadru. Mocno działają.

**Pozostaw oddech:** jeśli ktoś patrzy w lewo, zostaw więcej miejsca po lewej stronie, nie po prawej.`,
    },
    {
        title: 'Światło — najważniejsza rzecz w fotografii',
        body_md: `**Złota godzina** — godzina po wschodzie i godzina przed zachodem. Światło jest miękkie, ciepłe, robi cienie pod kątem. NAJLEPSZE do portretów i pejzaży.

**Południe** — światło z góry, twarde cienie pod oczami. Słabo dla portretów. Dobre dla architektury z mocnym kontrastem.

**Pochmurny dzień** — naturalny "softbox", brak twardych cieni. Bardzo dobre do portretów, kwiatów, makro.

**Cień w słoneczny dzień** — światło odbite, równomierne. Wstaw modela w cień drzewa, nie w pełne słońce.`,
    },
    {
        title: 'Portret — jak fotografować ludzi',
        body_md: `1. **Ostrość ZAWSZE na oko** (najbliższe do aparatu).
2. Przysłona f/2.8–f/4 dla rozmytego tła.
3. **Ogniskowa 50–85 mm** — najlepsze proporcje twarzy. Szeroki kąt (24 mm) deformuje, długi (200 mm) spłaszcza.
4. **Rozmawiaj z modelem** — sztywne pozy = nudne zdjęcia. Niech ktoś się śmieje, patrzy w bok, idzie.
5. Fotografuj **z poziomu oczu modela** — nie z góry (pomniejsza), nie z dołu (deformuje nos).`,
    },
    {
        title: 'Makro i detal',
        body_md: `**Najmniejsza odległość ostrzenia** — sprawdź w specyfikacji obiektywu. Bliżej nie ostrzy, choćbyś chciał.

**Manual focus** — przy makro autofocus często ucieka. Ustaw ostrość ręcznie na konkretny szczegół (np. oko owada).

**Przysłona f/8–f/11** — bo głębia ostrości w makro jest BARDZO mała, trzeba ją wydłużyć.

**Statyw lub szybki czas (1/250+)** — najmniejsze drgnięcie = rozmazane zdjęcie.`,
    },
    {
        title: 'Reportaż — fotografowanie ludzi w terenie',
        body_md: `**Etyka:** zawsze pytaj o zgodę, gdy fotografujesz osobę z bliska. Uśmiech i krótkie "mogę zrobić Pani zdjęcie?" otwiera drzwi.

**Bądź niewidzialny:** mały aparat, długi obiektyw, cierpliwość. Najlepsze ujęcia łapie się z dystansu, gdy ludzie zapomną o aparacie.

**Czekaj na moment:** decydujący moment Cartier-Bressona — nie pstrykaj na ślepo, czekaj aż coś się wydarzy.

**Tło ma znaczenie tak samo jak osoba** — sprawdź czy w tle nie ma kosza na śmieci, znaku zakazu, śmiesznego napisu.`,
    },
    {
        title: 'Edycja w telefonie — Lightroom Mobile / Snapseed',
        body_md: `**Minimalna obróbka, naturalny styl:**
1. Wyprostuj horyzont (Crop → Straighten).
2. Ekspozycja: lekko w górę jeśli ciemne, w dół jeśli przepalone.
3. Kontrast: +10 do +20 (nie więcej).
4. Cienie: +20 (rozjaśnij ciemne miejsca).
5. Światła: -20 (przyciemnij przepalenia).
6. Saturacja/Vibrance: +5 do +15 (subtelnie).
7. Wyostrzenie: +20.

**Złota zasada:** lepiej ZBYT MAŁO niż za dużo. Naturalność wygrywa.`,
    },
    {
        title: 'Co zabrać na warsztaty — checklista',
        body_md: `**Sprzęt:**
- Aparat (lustrzanka / bezlusterkowiec / dobry kompakt — dowolny system).
- Wszystkie obiektywy które masz.
- **Ładowarka + zapasowe baterie** (dwie minimum).
- **Karty pamięci** (min. 2 × 32 GB lub 1 × 64 GB).
- Statyw (jeśli masz).
- Czyścik / szmatka mikrofibra.

**Reszta:**
- Wygodne buty na spacery.
- Kurtka przeciwdeszczowa (pogoda potrafi zaskoczyć).
- Czapka i krem z filtrem (lipiec, słońce).
- Notes i długopis.
- **Kabel do ładowania telefonu** + powerbank.
- Dobry humor i otwartość.`,
    },
    {
        title: 'Słowniczek — co znaczy fachowy żargon',
        body_md: `- **Bokeh** — ładne rozmycie tła za obiektem ostrym.
- **Crop** — przycięcie zdjęcia.
- **DOF (Depth of Field)** — głębia ostrości, ile jest ostre od przodu do tyłu.
- **EXIF** — dane techniczne zapisane w pliku zdjęcia.
- **HDR** — high dynamic range, łączenie kilku ekspozycji w jedno zdjęcie.
- **JPG vs RAW** — JPG = gotowe, RAW = surowy plik do obróbki (większy, ale lepiej edytuje się).
- **Ogniskowa** — "mm" obiektywu, im więcej tym dalej "widzi".
- **Stabilizacja (IS, VR, OSS)** — kompensuje drgania ręki, pozwala na dłuższy czas.
- **Wizjer / Live View** — patrzysz przez wizjer (oko) lub na ekran z tyłu.`,
    },
];

(async () => {
    const w = await p.workshop.findUnique({ where: { slug: SLUG } });
    if (!w) { console.error(`Brak warsztatu ${SLUG}`); process.exit(1); }

    const updated = await p.workshop.update({
        where: { slug: SLUG },
        data: {
            description: 'Weekendowy kurs fotografii dla młodych pasjonatów (10–17 lat) w formule 3 zjazdów: sobota 04.07, środa wieczór 08.07 i finałowa sobota 11.07.2026. Między zjazdami zadania domowe — fotografujesz samodzielnie, na zjeździe omawiamy. Mała grupa (max 8 osób), indywidualne konsultacje, wystawa końcowa z wydrukowanymi pracami, dyplom i pendrive z całym portfolio. Uczymy techniki, kompozycji, własnego stylu — bez nudnej teorii, w terenie z aparatem w ręku.',
            schedule: SCHEDULE,
            materials: MATERIALS,
            starts_at: new Date('2026-07-04T10:00:00.000Z'),
            ends_at: new Date('2026-07-11T17:00:00.000Z'),
            status: 'active',
        },
    });
    console.log('OK — uzupełniono warsztat:', { id: updated.id, slug: updated.slug, status: updated.status, scheduleDays: SCHEDULE.length, materials: MATERIALS.length });
    await p.$disconnect();
})();
