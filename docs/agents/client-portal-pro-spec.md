# Panel klienta Pro — specyfikacja UX i konwersji

**Data:** 2026-08-02  
**Agent odpowiedzialny:** Agent UX i Optymalizacji Konwersji  
**Zadanie:** #18  
**Gałąź:** `agent/client-portal-pastel-funnel`

## 1. Decyzja zarządcza

Obecny panel jest szeroki funkcjonalnie, ale wizualnie zbyt ciężki: czarne tło, złote akcenty, wiele konkurujących kafelków i brak jednej osi prowadzącej klienta przez obsługę. Nie należy usuwać funkcji. Należy zmienić sposób ich podania.

Nowa wersja ma być jasna, spokojna i fotograficzna. Ma pasować jednocześnie do fotografii rodzinnej, reportażowej i ślubnej. Premium nie będzie oznaczać czerni i złota, tylko porządek, dobre zdjęcia, dużo światła, czytelną typografię i przewidywalny proces.

## 2. Cel mierzalny

Po wdrożeniu klient powinien w ciągu 5 sekund odpowiedzieć na trzy pytania:

1. Na jakim etapie jestem?
2. Co mam teraz zrobić?
3. Co wydarzy się później?

Mierniki:

- wejście w główne CTA panelu,
- akceptacja oferty,
- podpis umowy,
- opłacenie zaliczki,
- otwarcie poradnika przed sesją,
- otwarcie i ukończenie wyboru w galerii,
- zakup dodatków,
- liczba ręcznych pytań klienta na jedno zlecenie.

## 3. Oś obsługi klienta

Wspólny model prezentacji:

1. **Oferta** — sprawdź i zaakceptuj.
2. **Umowa** — przeczytaj i podpisz.
3. **Zaliczka** — opłać termin.
4. **Przygotowanie** — sprawdź ubiór, pozy, checklistę i plan.
5. **Sesja** — termin, miejsce, kontakt i ważne informacje.
6. **Galeria** — obejrzyj i wybierz zdjęcia.
7. **Zamówienie** — dopłata, albumy, odbitki i dostawa.
8. **Po realizacji** — pobranie, opinia i kolejna sesja.

Etap nie jest osobną kopią danych w pierwszej wersji. Powinien być wyliczany przez jeden serwis na podstawie obecnych ofert, umów, płatności, rezerwacji i galerii. Dzięki temu UI nie tworzy drugiego źródła prawdy.

## 4. Zasada jednego działania

Na ekranie głównym panelu występuje dokładnie jedna karta `Następny krok`.

Przykłady:

- oferta oczekuje → `Sprawdź ofertę`,
- umowa oczekuje → `Podpisz umowę`,
- zaliczka oczekuje → `Opłać zaliczkę`,
- sesja potwierdzona → `Przygotuj się do sesji`,
- galeria gotowa → `Wybierz zdjęcia`,
- wybór zakończony → `Opłać dodatki`,
- realizacja zakończona → `Pobierz zdjęcia`.

Pozostałe działania są wizualnie drugorzędne. Niedopuszczalne są równorzędne, duże przyciski prowadzące do kilku różnych procesów.

## 5. System wizualny

### 5.1. Rdzeń kolorystyczny

| Rola | Kolor | Użycie |
|---|---|---|
| `portal-bg` | `#F7F3EE` | główne tło |
| `portal-surface` | `#FFFDF9` | karty i formularze |
| `portal-text` | `#2E2A27` | podstawowy tekst |
| `portal-muted` | `#6E6760` | tekst pomocniczy |
| `portal-border` | `#E4D9CF` | obramowania i separatory |
| `portal-sage` | `#AAB7A2` | przygotowanie, zakończenie |
| `portal-blush` | `#D8B7B0` | rodzina, emocje, wyróżnienia |
| `portal-sky` | `#B8CAD8` | dokumenty i informacje |
| `portal-sand` | `#DCCBB7` | płatności i terminy |
| `portal-gold-detail` | `#B9975B` | wyłącznie subtelny detal premium |
| `portal-danger` | `#A94B4B` | błędy i zaległości |
| `portal-success` | `#3F704D` | sukces i ukończenie |

Pastelowe kolory pełnią rolę tła, obramowania lub dekoracji. Mały tekst nie może być pisany jasnym pastelowym kolorem. Tekst pozostaje grafitowy albo ciemnozielony, aby zachować kontrast.

### 5.2. Typografia i przestrzeń

- nagłówki: elegancki font display obecny w marce, bez nadmiernego pogrubienia,
- tekst roboczy i formularze: czytelny sans-serif,
- maksymalnie trzy poziomy hierarchii na jednym ekranie,
- większe odstępy między procesami, mniejsze wewnątrz kart,
- promień kart 16–20 px, nie każda sekcja jako osobna „pigułka”,
- delikatne cienie; brak neonowych poświat i pulsujących gradientów w zwykłych stanach.

## 6. Architektura informacji

### 6.1. Widok główny

Kolejność:

1. powitanie i najbliższy termin,
2. karta `Następny krok`,
3. pozioma lub przewijana oś etapów,
4. skrót sesji: data, miejsce, kontakt,
5. dokumenty i płatności,
6. galeria lub przygotowanie — zależnie od etapu,
7. pomoc i kontakt.

### 6.2. Nawigacja

Desktop:

- `Przegląd`,
- `Sesje i galerie`,
- `Oferta i umowa`,
- `Przygotowanie`,
- `Zakupy`,
- `Ustawienia`.

Mobile:

- widoczne trzy najczęstsze pozycje zależne od etapu,
- pozostałe w czytelnym panelu `Więcej`,
- pełne etykiety, bez nawigacji złożonej wyłącznie z ikon,
- aktywny stan oparty na tle i obramowaniu, nie tylko kolorze.

Karty podarunkowe i warsztaty pozostają dostępne, ale nie konkurują z bieżącą obsługą zlecenia.

## 7. Komponenty docelowe

Duży plik `src/app/konto/page.tsx` należy rozdzielić co najmniej na:

- `ClientPortalShell`,
- `ClientPortalHeader`,
- `ClientPortalNavigation`,
- `ClientJourneyTimeline`,
- `ClientNextActionCard`,
- `ClientSessionSummary`,
- `ClientDocumentsSummary`,
- `ClientGallerySummary`,
- `ClientEmptyState`,
- `ClientErrorState`,
- `ClientStatusBadge`.

Logika pobierania danych powinna zostać skupiona w jednym hooku lub warstwie serwisowej. Refaktoryzacja nie może zmienić kontraktów API bez osobnego uzasadnienia.

## 8. Stany obowiązkowe

Każdy moduł musi mieć:

- skeleton podczas ładowania,
- pusty stan z informacją, co się wydarzy,
- błąd z przyciskiem ponowienia,
- stan wymagający reakcji,
- stan wykonany,
- stan zablokowany z wyjaśnieniem przyczyny.

Animacja może wspierać zmianę stanu, ale nie może pulsować bez końca ani rozpraszać klienta.

## 9. Integracja poradnika

Wdrożony poradnik pozostaje źródłem treści. Panel pokazuje go kontekstowo:

- po akceptacji terminu — pełna sekcja przygotowania,
- przed sesją — skrócona checklista i przycisk do pełnego poradnika,
- po sesji — nie zajmuje głównego miejsca na ekranie.

Treści CMS i zabezpieczenia endpointu pozostają bez zmian.

## 10. Dostępność i mobile

Minimalne warunki:

- brak poziomego przewijania przy 320 px,
- cele dotykowe minimum 44 × 44 px,
- logiczna kolejność klawiatury,
- widoczny focus,
- WCAG AA dla tekstu i elementów interaktywnych,
- komunikaty błędów niezależne od koloru,
- kwoty, daty i etykiety nie mogą być ucinane,
- test na Safari iOS.

## 11. Zakres pierwszego wdrożenia

Etap A — bezpieczny refaktor:

1. wydzielenie komponentów,
2. wspólne wyliczanie etapu i następnej czynności,
3. testy istniejących funkcji.

Etap B — nowy wygląd:

1. tokeny i jasny shell,
2. nawigacja,
3. karta następnego kroku,
4. oś etapów,
5. stany modułów.

Etap C — optymalizacja:

1. zdarzenia analityczne,
2. testy realnych scenariuszy,
3. korekta hierarchii na podstawie danych.

## 12. Poza pierwszą wersją

- chatbot AI,
- automatyczne negocjowanie oferty,
- personalizacja wyglądu generowana przez AI,
- usuwanie zakładek biznesowych,
- duża migracja modeli Prisma.

## 13. Bramka przekazania do Codex

Codex może rozpocząć implementację dopiero, gdy zaakceptowane są:

- oś ośmiu etapów,
- zasada jednego głównego CTA,
- jasna paleta i wskazane tokeny,
- nowa architektura nawigacji,
- rozdzielenie monolitycznego pliku bez zmiany działania API.

Każdy PR musi zawierać zrzuty 375/768/1440 px, testy Playwright oraz listę zachowanych funkcji.