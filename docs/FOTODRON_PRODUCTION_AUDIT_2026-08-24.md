# FotoDron — audyt produkcyjny CRM, ofert, umów i galerii

Data: 2026-08-24  
Baza: Neon, gałąź produkcyjna `main`  
Tryb pracy: wyłącznie odczyt danych produkcyjnych; bez migracji, korekt i usuwania rekordów.

## Decyzja

**NO-GO dla bezpośredniego wdrożenia na produkcję.** Kod naprawczy i migracje muszą najpierw przejść kopię produkcji, staging, preflight, testy E2E i niezależny QA. Aktualne dane klienta nie zostały zmienione.

## Reguły biznesowe zatwierdzone przez właściciela

1. Klient widzi tylko aktualną, kanoniczną ofertę; błędne i zastąpione wersje pozostają w audycie, ale nie mylą klienta.
2. Oferta zaakceptowana jest niezmienna. Nowe warunki wymagają nowej wersji i jawnego zastąpienia starej.
3. Konto, oferta, umowa, wpłata i galeria muszą wskazywać tego samego klienta lub mieć jawny, audytowany wyjątek.
4. W galerii grupowej każdy poprawnie uwierzytelniony rodzic ma prawo do całej galerii cyfrowej.
5. Wybory w galerii grupowej są wyłącznie manifestem odbitek dla fotografa.
6. Płatne odbitki dodatkowe i zgoda na publikację są odrębnymi procesami.
7. Link Adobe jest poprawnym kanałem pełnej galerii i pozostaje dostępny po uwierzytelnieniu rodzica.
8. Admin otrzymuje e-mail o incydencie P0/P1, widzi correlation ID i codzienny raport operacyjny.

## 1. Oferty i konta wskazane przez właściciela

### Damian / Oskar Liszaj

- kanoniczne konto: użytkownik #111;
- kanoniczna oferta: #68, `B2C-2026-012`, zaakceptowana na 1 350 zł;
- rozliczenie: zaliczka 405 zł i saldo 945 zł;
- oferta #67 jest błędną, historyczną wersją powiązaną z usuniętym/nieaktywnym kontem i nie może być prezentowana klientowi jako aktualna;
- przed produkcyjną korektą właściciel musi potwierdzić jawne oznaczenie #67 jako zastąpionej przez #68. Rekordu nie kasujemy.

### Smykowska

- kanoniczne konto: użytkownik #116;
- kanoniczna oferta: #78, `B2C-2026-016`, zaakceptowana na 1 630 zł;
- rozliczenie: zaliczka 400 zł i saldo 1 230 zł;
- oferta #75, zaakceptowana na 1 957 zł, jest starą/niewłaściwą wersją i nie może być wyświetlana jako bieżąca;
- przed produkcyjną korektą właściciel musi potwierdzić jawne oznaczenie #75 jako zastąpionej przez #78. Rekordu nie kasujemy.

### Naprawa systemowa przygotowana w kodzie

- relacja zastępowania ofert z powodem, datą i administratorem;
- endpoint i kontrola CAS do oznaczenia starej oferty jako zastąpionej;
- filtrowanie zastąpionych ofert po stronie klienta;
- zachowanie historii, snapshotów, audytu i powiązań;
- serwerowe liczenie ceny i blokada ceny zerowej;
- niezmienność zaakceptowanych ofert i umów;
- idempotencja wysyłek, płatności oraz zapisu dokumentów;
- indeksy gorących ścieżek konta, ofert, umów, galerii i zamówień.

## 2. Galerie grupowe — pełny stan produkcji

| Galeria | Zdjęcia | HQ | Rodzice | Wybory | Zewnętrzny download | Stan |
|---|---:|---:|---:|---:|---:|---|
| #16 Magdalena Juda | 244 | 0 | 11 | 55 | nie | aktywna w polu, ale wygasła 2026-08-22 |
| #19 Klasa C | 299 | 299 | 19 | 72 | tak | aktywna |
| #20 Magdalena Kierys — klasa B | 441 | 430 | 34 | 117 | tak, Adobe | aktywna |

Globalna integralność:

- zero wyborów przekraczających limit;
- zero wyborów zdjęcia należącego do innej galerii;
- zero powtórzonych znormalizowanych e-maili w tej samej galerii;
- 64/64 e-maile rodziców są poprawne składniowo;
- funkcjonalny indeks unikalny `(gallery_id, lower(trim(parent_email)))` nie jest blokowany przez aktualne dane;
- dwa zestawy profili o tej samej znormalizowanej nazwie (#47/#48 w galerii #19 i #51/#52 w #20) wymagają ręcznej oceny; nazwa nie jest wystarczającym dowodem do połączenia.

### Galeria #20 — rzeczywista anomalia ZIP

- 49 zdarzeń dotyczy tylko trzech rodziców i trzech dni;
- każdy wpis ma inny klucz S3, więc powstało 49 osobnych archiwów;
- zdarzenia tworzą około osiem klastrów interakcji, a 26 kolejnych prób nastąpiło w czasie do 5 sekund; rekord to 0,049 s;
- trzy archiwa były częściowe: 433/441, 439/441 i 440/441, ale zapisano je jako sukces;
- log `GROUP_DOWNLOAD_ALL_SUCCESS` dowodzi przygotowania paczki przez serwer, nie ukończonego pobrania przez przeglądarkę;
- stare logi nie zawierają `job_id`, `run_id`, correlation ID, rozmiaru ZIP, czasu budowy ani danych pozwalających rozróżnić podwójny klik, retry i wiele kart;
- źródła powielenia w kodzie: administracyjna pętla paczek per rodzic, cache artefaktu per uczestnik, nieatomowe `read → write → dispatch` i brak blokady przycisku/pamięci zadania w UI.

Naprawa przygotowana:

- usunięcie przycisku uruchamiającego serię paczek per rodzic;
- jeden artefakt pełnej galerii na hash manifestu HQ, współdzielony między rodzicami;
- autoryzacja i audyt nadal osobno dla każdego rodzica;
- atomowy claim przez transakcyjny advisory lock Neon po `job_id`;
- blokada ponownego kliknięcia, `sessionStorage`, wznowienie statusu po odświeżeniu, `AbortController` i łagodniejszy polling;
- brak choć jednego pliku kończy zadanie stanem `FAILED`, nigdy częściowym sukcesem;
- osobne zdarzenia `REQUESTED`, `CREATED`, `REUSED`, `BUILD_STARTED`, `READY`, `FAILED`, `LINK_ISSUED` i wydanie linku Adobe;
- incydent P1 i e-mail do admina dla braku HQ albo awarii generatora.

### Gotowość HQ i wydruku

- #16: brak HQ dla 244/244 zdjęć; 51 unikalnych zdjęć wybranych do odbitek również nie ma HQ;
- #20: brak HQ dla 11/441 zdjęć; dwa z nich występują w sześciu wierszach wyborów odbitek;
- #19: wszystkie 299 zdjęć mają HQ;
- Adobe rozwiązuje cyfrową dostawę #20, ale nie zastępuje plików HQ dla laboratorium;
- eksport drukarni ma być blokowany przy brakującym HQ i nie może po cichu użyć miniatury/WEBP.

### Wybory, zgody i płatne dodatki

- #16: wszystkich 11 rodziców ma po 5 wyborów; 9 zgód na publikację, 2 braki zgody;
- #19: 14 kompletów, 2 wybory częściowe, 3 braki; 11 zgód, 8 braków;
- #20: 21 kompletów, 4 wybory częściowe, 9 braków; 13 zgód, 21 braków;
- brak zgody jest poprawną decyzją i nie ogranicza pobrania galerii;
- #20 ma pięć zamówień `PENDING` starszych niż 7 dni: #8, #9, #12, #14 i #20;
- zamówienie #14 odpowiada późniejszemu opłaconemu #16 i wymaga ręcznego uzgodnienia, nie automatycznego usunięcia;
- osiem opłaconych zamówień grupowych nie ma wpisu znalezionego po `PaymentLedger.resource_id`: #23 w galerii #19 oraz #10, #13, #15, #16, #17, #24 i #26 w #20; łączna luka wynosi odpowiednio 22,50 zł i 86 zł;
- dwa poziomy flagi sprzedaży dodatków (galeria i uczestnik) są niespójne i muszą zostać sprowadzone do jednego źródła prawdy.

## 3. Logowanie i szybkość

Produkcja ma 12 historycznych sukcesów logowania i 4 nieudane próby z ostatnich 30 dni, ale stare logi nie zapisują czasu. `pg_stat_statements` nie jest zainstalowane, więc Neon nie potrafi obecnie przedstawić listy najwolniejszych zapytań. Nie instalowano rozszerzenia na produkcji w ramach audytu.

Zapytanie konta po e-mailu korzysta z unikalnego indeksu `users.email`. Bez pomiarów nie wolno jednak zgadywać, czy opóźnienie powoduje Neon, bcrypt, zapis audytu, sieć czy frontend.

Naprawa obserwowalności przygotowana w kodzie:

- `Server-Timing` i correlation ID dla każdego logowania;
- osobne czasy: parsowanie, limiter, Neon, bcrypt, audyt i token;
- incydent `SLOW_LOGIN` po przekroczeniu 1 500 ms;
- zapis sukcesu i każdej przyczyny odmowy;
- indeksy portalu klienta i gorących ścieżek;
- dzienny p95 logowania oraz liczba sukcesów, błędów i wolnych prób w panelu i e-mailu.

Przed produkcją wymagany jest test 20–50 logowań na stagingu z pomiarem cold/warm, DB, bcrypt, audit write oraz odczytu pierwszego ekranu `/konto`.

## 4. Widoczność administratora

Przygotowany system obejmuje:

- trwałą tabelę incydentów P0–P3;
- e-mail dla nowych P0/P1 z 15-minutową deduplikacją i limitem, aby zwykłe kliknięcia nie spamowały skrzynki;
- ekran `/admin/incidents` z filtrem, stanami `OPEN / ACKNOWLEDGED / RESOLVED`, correlation ID i szczegółami;
- dzienny raport: konta, welcome, logowania i p95, oferty, umowy, galerie, płatności oraz otwarte incydenty;
- metryki galerii grupowych: konta rodziców, magic login, zatwierdzenia odbitek, żądania/build/reuse/gotowość/błędy ZIP oraz wydane linki ZIP/Adobe;
- audyt błędów zapisu klienta, wysyłki dokumentu, płatności, braków HQ i generatora ZIP.

Zwykły sukces nie wysyła natychmiastowego maila. Trafia do raportu dziennego. Natychmiastowy alert dotyczy awarii, braku danych produkcyjnych, blokady klienta albo naruszenia dostępu.

## 5. Tabele puste i kandydaci legacy

Statystyki `pg_stat_user_tables` są przybliżone i okazały się nieaktualne dla części tabel, dlatego kandydatów sprawdzono również przez dokładne `count(*)` oraz referencje aktywnego kodu.

Kandydaci do kwarantanny, nie do natychmiastowego usunięcia:

| Tabele | Wiersze | Powód |
|---|---:|---|
| `clients`, `client_offers`, `client_contracts` | 0 / 0 / 0 | drugi, nieużywany w runtime model CRM obok `users`, `offers`, `contracts`; występuje w historycznych skryptach |
| `email_subscribers`, `subscribers` | 0 / 0 | dwa puste modele subskrypcji bez aktywnych odwołań runtime |
| `system_settings` | 0 | pusty model key/value obok używanej tabeli `settings` |

Nie kwalifikujemy do usunięcia wyłącznie dlatego, że są puste:

- `baskets` / `basket_items` — są częścią aktywnego kontraktu koszyka i panelu klienta;
- `offer_sections` / `offer_items` — aktywny endpoint oferty nadal je odczytuje;
- `analytics_snapshots` — aktywny moduł BI tworzy i czyści snapshoty;
- `marketing_templates` — statystyka szacowała 0, ale dokładne zapytanie wykazało 18 rekordów;
- pozostałe puste tabele modułów opcjonalnych wymagają osobnego audytu właściciela funkcji.

Bezpieczny proces usunięcia tabeli legacy:

1. potwierdzić brak odczytów i zapisów w kodzie, skryptach, zadaniach i raportach;
2. wykonać backup oraz kopię produkcji;
3. usunąć/zmigrować historyczne skrypty;
4. oznaczyć model jako deprecated przez jeden cykl wydania;
5. obserwować błędy runtime;
6. dopiero w osobnej, odwracalnej migracji usunąć FK, model i tabelę.

W tym audycie nie usunięto żadnej tabeli.

## 6. Ryzyka migracji

- migracje `AdminIncident`, outbox, wersji dokumentów, indeksów, idempotencji płatności, supersession ofert i galerii grupowej nie są jeszcze zastosowane na produkcji;
- unikalny indeks e-maila galerii grupowej przechodzi aktualny preflight danych, ale musi zostać utworzony i przetestowany na branchu stagingowym;
- migracja nie usuwa żadnego wyboru: kompletne historyczne zestawy `max/max` oznacza `LEGACY_REVIEW_REQUIRED`, a częściowe i puste pozostawia `DRAFT`; nic nie jest automatycznie uznawane za niezmiennie zatwierdzone;
- jeśli którakolwiek wcześniejsza wersja migracji `20260823150000` została zastosowana poza widoczną historią, jej modyfikowanie jest niedozwolone — potrzebna jest migracja uzupełniająca;
- outbox e-mail i inicjalizacja PayU wymagają lease/expiry/recovery workera; rekord `SENDING/initializing` nie może pozostać osierocony;
- generator ZIP wymaga testu na prawdziwym S3; lokalne testy syntetyczne nie zastępują stagingu.

## 7. Bramka wdrożeniowa

1. Snapshot/backup produkcji i świeży branch staging z aktualnego `main`.
2. `prisma migrate deploy`, `prisma validate/generate`, typecheck i build.
3. Preflight danych przed i po migracji; zero utraconych kont, ofert, umów, wyborów i wpłat.
4. Ręczna decyzja właściciela dla #67→#68 i #75→#78.
5. Ręczna decyzja dla profili #47/#48 i #51/#52, nazw klasy B/AB oraz starych zamówień `PENDING`.
6. Uzupełnienie HQ albo jawna blokada produkcji odbitek #16/#20.
7. Uzgodnienie ośmiu opłaconych zamówień grupowych z `PaymentLedger`.
8. E2E: konto → welcome → login → oferta → akceptacja → umowa → wpłata → galeria → Adobe/internal ZIP → wybór odbitek → opłacony dodatek → eksport drukarni.
9. Test 50 równoległych żądań pełnego ZIP: jeden build, wiele audytowanych wydań linku.
10. Test błędu jednego pliku: stan `FAILED`, incydent i e-mail, bez częściowego sukcesu.
11. Test raportu dziennego oraz obsługi incydentu w panelu.
12. Niezależny QA i dopiero potem osobna zgoda na promocję produkcyjną.

## Materiały powiązane

- `docs/GROUP_GALLERY_SELECTION.md` — kanoniczny model galerii grupowej;
- `docs/QA_GALLERIES_ANALYTICS_2026-08-09.md` — historyczna bramka QA i aneks decyzji właściciela;
- `task.md` — bieżący plan wykonawczy;
- `PROJECT_HISTORIA.md` — trwała historia decyzji.

## Aneks wdrożeniowy — 2026-08-26

Dedykowany Neon staging `staging-crm-observability-20260823` został odświeżony z aktualnego produkcyjnego `main`. Zastosowano atomowo wszystkie 11 brakujących migracji. Wynik:

- 18/18 migracji Prisma zakończonych, 0 problematycznych;
- liczby rekordów krytycznych before/after bez zmian;
- 46 kompletnych historycznych wyborów oznaczonych `LEGACY_REVIEW_REQUIRED`;
- 18 częściowych lub pustych wyborów pozostawionych jako `DRAFT`;
- zero osieroconych relacji, duplikatów e-maili galerii, przekroczeń limitu i wyborów między galeriami.

Staging bazy jest poprawny. Produkcyjny Neon pozostaje bez zmian do przejścia buildu wdrożeniowego, testów prawdziwego S3/ZIP i kontroli canary.
