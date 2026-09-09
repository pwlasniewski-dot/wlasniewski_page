# Admin operacyjny — specyfikacja CRM, lejka i automatyzacji

**Data:** 2026-08-02  
**Agent odpowiedzialny:** Agent CRM i Automatyzacji  
**Zadanie:** #19  
**Gałąź:** `agent/admin-sales-operations`

## 1. Decyzja zarządcza

Platforma posiada większość potrzebnych elementów: leady, profile klientów, rezerwacje, zamówienia, oferty, umowy, płatności, aktywności i galerie. Problemem jest ich rozproszenie. Administrator widzi wiele danych, ale nie otrzymuje jednej odpowiedzi: **co trzeba zrobić dzisiaj, aby doprowadzić klienta do płatnej realizacji**.

Nie należy tworzyć kolejnego niezależnego CRM. Trzeba zbudować warstwę operacyjną nad obecnymi danymi, ujednolicić statusy, bezpiecznie połączyć rekordy i dodać kontrolowane automatyzacje.

## 2. Cel mierzalny

Mierniki podstawowe:

- czas od wpłynięcia zapytania do pierwszej reakcji,
- liczba leadów bez kontaktu po 24 godzinach,
- liczba ofert bez następnej czynności,
- konwersja lead → oferta → zamówienie → płatność,
- liczba porzuconych rezerwacji odzyskanych przez przypomnienie,
- wartość przychodu przypisana do źródła,
- liczba ręcznych operacji potrzebnych do obsługi jednego klienta.

## 3. Operacyjny etap klienta

Pierwsza wersja nie powinna od razu wprowadzać nowego enumu do każdego modelu. Należy utworzyć jeden serwis `deriveClientOperationalStage`, który wylicza etap z aktualnych danych.

Proponowane etapy operacyjne:

1. `NEW_LEAD` — nowe zapytanie bez reakcji.
2. `CONTACT_DUE` — kontakt rozpoczęty, brak ustalonego dalszego kroku.
3. `OFFER_DRAFT` — przygotowywana oferta.
4. `OFFER_SENT` — oferta wysłana, oczekiwanie na klienta.
5. `OFFER_ACCEPTED` — oferta zaakceptowana.
6. `CONTRACT_DUE` — umowa do przygotowania lub podpisu.
7. `CONTRACT_SIGNED` — umowa podpisana.
8. `DEPOSIT_DUE` — zaliczka oczekuje lub jest po terminie.
9. `BOOKED` — termin zabezpieczony.
10. `PREPARATION_DUE` — należy wysłać lub sprawdzić przygotowanie.
11. `SESSION_DUE` — sesja nadchodzi.
12. `POST_SESSION` — materiał do obróbki i galerii.
13. `GALLERY_DUE` — galeria do utworzenia lub wysłania.
14. `ORDER_DUE` — wybór, dopłata lub produkt do realizacji.
15. `DELIVERED` — zlecenie dostarczone.
16. `FOLLOW_UP_DUE` — opinia, polecenie lub kolejna sesja.
17. `CLOSED_WON` — proces sprzedażowy zakończony przychodem.
18. `CLOSED_LOST` — klient zrezygnował; wymagany powód.

Etap wyliczany musi zwracać także:

- `nextAction`,
- `dueAt`,
- `priority`,
- `reason`,
- `entityLinks`,
- `estimatedValue`,
- `lastContactAt`.

## 4. Ekran „Dzisiaj”

Widok startowy administratora składa się z pięciu sekcji:

### 4.1. Pilne

- nowy lead bez reakcji,
- zaliczka po terminie,
- sesja bez umowy lub płatności,
- problem z płatnością,
- klient czekający na galerię po deklarowanym terminie.

### 4.2. Do kontaktu

- niedokończona rezerwacja,
- oferta nieotwarta,
- oferta bez decyzji,
- umowa bez podpisu,
- klient wymagający potwierdzenia szczegółów.

### 4.3. Do przygotowania

- oferta,
- umowa,
- plan sesji,
- wiadomość przygotowawcza,
- galeria.

### 4.4. Do realizacji

- zamówienie zdjęć,
- album lub odbitki,
- pliki do wydania,
- przesyłka.

### 4.5. Możliwości sprzedaży

- klient po dostarczeniu galerii bez zakupu dodatków,
- rocznica poprzedniej sesji,
- brak opinii po zakończeniu,
- klient z voucherem lub poleceniem.

Każdy wiersz lub karta pokazuje tylko dane potrzebne do decyzji:

- klient,
- wartość,
- źródło,
- etap,
- termin,
- ostatni kontakt,
- jedna główna akcja,
- link do pełnej historii.

## 5. Profil klienta

Profil klienta staje się centrum zlecenia, nie zbiorem niezależnych zakładek.

Nagłówek:

- dane kontaktowe,
- status klienta,
- bieżący etap,
- najbliższy termin,
- łączna wartość,
- następna czynność,
- szybkie `Zadzwoń`, `E-mail`, `Dodaj notatkę`.

Oś czasu:

- lead,
- kontakt,
- oferta,
- otwarcie oferty,
- akceptacja lub odrzucenie,
- umowa,
- podpis,
- płatność,
- sesja,
- galeria,
- zamówienie,
- dostawa,
- opinia.

Zakładki mogą pozostać dla szczegółów, ale najważniejsze informacje nie mogą wymagać przechodzenia między sześcioma ekranami.

## 6. Łączenie rekordów

Preferowana kolejność identyfikacji:

1. jawne `client_id` / `user_id`,
2. relacja przez rezerwację lub zamówienie,
3. bezpieczne dopasowanie po znormalizowanym e-mailu,
4. dopasowanie po telefonie tylko jako sugestia do ręcznego zatwierdzenia.

Nie wolno automatycznie scalać klientów wyłącznie na podstawie podobnego imienia. Każde scalenie musi mieć podgląd, dziennik i możliwość odtworzenia.

## 7. Bezpieczne linki dokumentów

Obecny tymczasowy sposób kopiowania zwykłego adresu oferty nie może być traktowany jako gotowy mechanizm udostępniania.

Docelowy link:

- zawiera losowy, nieprzewidywalny token albo podpisany token z identyfikatorem dokumentu i klienta,
- ma termin ważności,
- może zostać unieważniony,
- nie pozwala zmienić identyfikatora w URL i zobaczyć innego dokumentu,
- zapisuje pierwsze i kolejne otwarcia,
- po akceptacji może zostać ograniczony do podglądu,
- nie ujawnia danych w logach ponad niezbędne minimum.

## 8. Automatyzacje

### 8.1. Model wykonania

Każde zaplanowane działanie posiada:

- typ zdarzenia,
- klienta i rekord źródłowy,
- czas wykonania,
- `idempotencyKey`,
- stan `scheduled / sent / skipped / failed / cancelled`,
- liczbę prób,
- przyczynę pominięcia,
- treść lub wersję szablonu,
- możliwość ręcznego zatrzymania.

### 8.2. Reguły pierwszej wersji

| Zdarzenie | Warunek | Działanie |
|---|---|---|
| porzucona rezerwacja | brak ukończenia i brak płatności | przypomnienie po 1 h oraz 24 h |
| oferta oczekuje | wysłana, brak akceptacji | przypomnienie po 24 h i 72 h |
| umowa oczekuje | wysłana, brak podpisu | przypomnienie przed terminem |
| zaliczka oczekuje | brak płatności | przypomnienie przed i po terminie |
| sesja nadchodzi | termin potwierdzony | wiadomość 14 dni, 3 dni i 1 dzień przed |
| galeria gotowa | aktywna i niewysłana | wiadomość z bezpiecznym dostępem |
| realizacja zakończona | zdjęcia dostarczone | prośba o opinię po ustalonym czasie |
| rocznica | zakończona sesja | propozycja kolejnej sesji po 10–12 miesiącach |

Po zmianie stanu na zapłacony, anulowany, podpisany lub zakończony niepasujące przypomnienia są automatycznie anulowane.

## 9. Rola AI

W pierwszej wersji AI może:

- przygotować szkic odpowiedzi na podstawie danych klienta,
- streścić historię kontaktu,
- wskazać brakujące dane,
- zaproponować następne działanie zgodne z regułami.

AI nie może:

- samodzielnie zmieniać ceny,
- negocjować warunków,
- podpisywać lub akceptować dokumentów,
- wysyłać swobodnie wygenerowanych wiadomości bez zatwierdzonego szablonu lub ręcznej akceptacji,
- wykonywać operacji finansowych.

## 10. Raport zarządczy

Podstawowy raport:

`źródło | leady | skontaktowane | oferty | zaakceptowane | zamówienia | przychód | konwersja | średni czas reakcji`

Dodatkowo:

- wartość utraconych szans i powód,
- skuteczność przypomnień,
- przychód z klienta powracającego,
- udział zamówień z dodatkami,
- liczba spraw bez następnej czynności.

## 11. Mobile admin

Przy szerokości 320–430 px:

- szerokie tabele są zastąpione kartami,
- telefon i e-mail są klikalne,
- następne działanie jest nad pozostałymi danymi,
- przyciski destrukcyjne są schowane w menu i wymagają potwierdzenia,
- każda operacja ma widoczny stan zapisu,
- modal nie może zawierać kolejnego małego wewnętrznego scrollboxa.

## 12. Proponowana architektura

Warstwa domenowa:

- `clientOperations/deriveStage.ts`,
- `clientOperations/nextAction.ts`,
- `clientOperations/automationRules.ts`,
- `clientOperations/attribution.ts`.

Komponenty:

- `AdminTodayQueue`,
- `OperationalStageBadge`,
- `NextActionPanel`,
- `ClientJourneyTimeline`,
- `ClientRevenueSummary`,
- `AutomationHistory`,
- `SecureShareLinkControl`.

Nowy model bazy jest dopuszczalny dopiero po sprawdzeniu, czy obecne `crm_activity`, logi i modele zamówień nie wystarczają. Jeżeli będzie potrzebny, preferowany jest mały model zadań i wykonań automatyzacji zamiast kopiowania wszystkich statusów.

## 13. Rollout

1. raport tylko do odczytu,
2. etap i następna czynność wyliczane bez automatyzacji,
3. bezpieczne linki,
4. ręczne uruchamianie przypomnień z logiem,
5. automatyzacje jednej reguły na raz,
6. raport przychodu i źródeł.

Każdy etap musi mieć wyłącznik funkcji oraz możliwość cofnięcia.

## 14. Bramka przekazania do Codex

Codex może rozpocząć wdrożenie po zatwierdzeniu:

- słownika etapów,
- kolejki `Dzisiaj`,
- zasad łączenia rekordów,
- modelu bezpiecznego linku,
- harmonogramów automatyzacji,
- granic działania AI,
- listy mierników.

Pierwszy PR techniczny nie może jednocześnie przebudowywać całego CRM, bazy, panelu i systemu wiadomości. Zmiany mają być etapowe i odbierane przez niezależny QA.