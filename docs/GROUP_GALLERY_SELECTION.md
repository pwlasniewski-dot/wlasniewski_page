# Galeria grupowa — model dostępu, wyboru odbitek i kontroli jakości

> **Źródło prawdy dla galerii komunijnych. Decyzja właściciela: 2026-08-24.**
> W razie sprzeczności z historycznym opisem, komentarzem lub ekranem obowiązuje ten dokument.

## 1. Cel biznesowy

Galeria grupowa zawiera wspólny reportaż z komunii lub wydarzenia klasowego. Po poprawnym uwierzytelnieniu każdy zarejestrowany rodzic może:

- oglądać całą cyfrową galerię grupy;
- pobierać pojedyncze zdjęcia oraz całą galerię;
- użyć zewnętrznego linku do pełnej galerii, np. Adobe, jeżeli administrator go ustawił;
- zaznaczyć do ustalonego limitu zdjęć, które fotograf ma zamówić jako odbitki;
- zamówić osobno płatne odbitki dodatkowe, jeżeli sprzedaż dodatków jest włączona;
- niezależnie zdecydować o zgodzie na publikację.

**Wybór zdjęć nie jest uprawnieniem do plików cyfrowych.** `PhotoSelection` jest manifestem odbitek dla fotografa. Brak wyboru, niepełny wybór, brak płatnego zamówienia lub brak zgody na publikację nie odbierają zalogowanemu rodzicowi prawa do pełnej galerii cyfrowej.

## 2. Jednoznaczne reguły dostępu

| Osoba / stan | Podgląd całej galerii | Pobranie cyfrowe | Wybór odbitek | Zgoda na publikację |
|---|---:|---:|---:|---:|
| Gość przed rejestracją | Tak, tylko w kontrolowanym trybie gościa | Nie | Nie | Nie |
| Zarejestrowany i uwierzytelniony rodzic | Tak | Tak, pełna galeria | Tak, do limitu | Tak, niezależnie |
| Rodzic po wygaśnięciu/dezaktywacji galerii | Nie | Nie | Nie | Nie |
| Administrator | Tak | Tak, operacyjnie | Podgląd/reopen/korekta audytowana | Podgląd i obsługa |

Zasady techniczne:

1. Pobranie pojedyncze i pobranie ZIP muszą sprawdzić ważny token rodzica, zgodność `gallery_id`, istnienie uczestnika, tryb `GROUP`, aktywność i termin galerii.
2. Serwer nie może filtrować plików cyfrowych według `PhotoSelection`, `selection_status`, `PhotoOrder` ani statusu płatności.
3. Link `external_download_url` jest zamierzoną częścią produktu. Nie wolno go ukrywać ani usuwać tylko dlatego, że pobranie odbywa się poza serwisem.
4. Kliknięcie linku Adobe oznacza „wydano link zewnętrzny”, a nie potwierdzone pobranie pliku. Taką samą ostrożność stosujemy do linku ZIP.
5. Brak pełnego źródła JPG/HQ jest błędem przygotowania galerii. Nie wolno oznaczać częściowego ZIP-a jako sukces ani po cichu zastępować pliku do odbitki miniaturą.

## 3. Proces rodzica

Aktualny publiczny ekran to `/galeria/grupowa`.

1. Rodzic podaje wspólny kod galerii i opcjonalne hasło.
2. Serwer wydaje krótko ważny token wejścia; próby podlegają limitowaniu i audytowi.
3. Nowy rodzic zakłada profil we właściwej galerii. Powtórny dostęp jest odzyskiwany jednorazowym linkiem wysłanym na zapisany e-mail; odpowiedź nie ujawnia, czy konto istnieje.
4. Po uwierzytelnieniu rodzic widzi całą galerię i jasne, rozdzielone akcje:
   - „Pobierz zdjęcia” / „Pobierz całą galerię” — pliki cyfrowe;
   - „Zaznacz do druku” — bezpłatne odbitki w ramach limitu;
   - koszyk odbitek dodatkowych — osobne płatne zamówienie;
   - „Potwierdzam wybór zdjęć” — zamknięcie manifestu odbitek;
   - zgoda na publikację — osobna decyzja, która nie zmienia zamówienia ani dostępu.
5. Rodzic dostaje czytelne potwierdzenie: liczba wybranych zdjęć, wersja zgłoszenia, data i stan płatnych dodatków.

Historyczny tryb z osobnym `participant_code` może pozostać dla starszych galerii, lecz nie definiuje obecnego procesu wspólnej galerii komunijnej.

## 4. Dane i niezmienniki

### `ClientGallery`

- `gallery_mode = GROUP` rozdziela ten proces od galerii indywidualnej;
- `group_access_code` i opcjonalne `group_password` są wejściem do grupy;
- `external_download_url` przechowuje zatwierdzony link do pełnej galerii, np. Adobe;
- `max_photos_for_print` określa domyślny limit bezpłatnych odbitek;
- `allow_extra_photo_purchase` steruje sprzedażą odbitek dodatkowych;
- `is_active` i `expires_at` obowiązują w każdym endpointcie rodzica.

### `GalleryParticipant`

- jeden profil odpowiada jednemu rodzicowi/zgłoszeniu w danej galerii;
- znormalizowany e-mail nie może tworzyć dwóch aktywnych profili w tej samej galerii;
- `max_selections` jest limitem odbitek, nie limitem pobierania;
- `selection_status`: `DRAFT` oznacza wybór edytowalny, `SUBMITTED` — zatwierdzony manifest, a `LEGACY_REVIEW_REQUIRED` — kompletny historyczny wybór zachowany do krótkiego przeglądu admina;
- `publication_consent`, `consent_scope` i `consent_given_at` są niezależne od wyboru odbitek;
- nie usuwamy automatycznie profili o podobnych danych. Możliwe duplikaty trafiają do ręcznego uzgodnienia z pełnym audytem.

### `PhotoSelection` i `GroupSelectionSubmission`

- unikalność `(participant_id, photo_id)` eliminuje duplikat tego samego wyboru;
- zdjęcie musi należeć do tej samej galerii co uczestnik;
- zapis wyboru jest transakcyjny i odporny na równoległe kliknięcia;
- zatwierdzenie tworzy niezmienny snapshot identyfikatorów zdjęć, wersję, hash i czas;
- ponowne otwarcie wyboru przez administratora musi zostawić zdarzenie audytowe;
- istniejących wyborów nie usuwamy, nie ukrywamy i nie konwertujemy automatycznie na złożone zamówienie;
- przy migracji kompletne historyczne wybory `max/max` otrzymują `LEGACY_REVIEW_REQUIRED`, natomiast częściowe i puste pozostają `DRAFT`; administrator może potwierdzić albo ponownie otworzyć komplet bez utraty historii.

### `PhotoOrder` i płatności

- płatne dodatki są osobnym zamówieniem odbitek;
- status `PAID` musi mieć ślad w kanonicznym rejestrze płatności albo jawnie oznaczony historyczny wyjątek;
- powtórzone `PENDING` o tym samym składzie i późniejsze `PAID` trafia do kolejki deduplikacji, bez automatycznego kasowania;
- globalna i uczestnikowa flaga sprzedaży dodatków nie mogą przedstawiać dwóch sprzecznych źródeł prawdy.

## 5. Panel administratora

Administrator musi na jednym ekranie galerii widzieć:

- liczbę zdjęć deklarowaną i faktyczną;
- gotowość pełnych źródeł cyfrowych oraz osobno gotowość JPG/HQ do odbitek;
- wszystkich rodziców, ich ostatnią aktywność, stan `DRAFT/SUBMITTED`, liczbę wybranych odbitek i płatne dodatki;
- zdjęcia wybrane do druku bez źródła HQ — jako blokadę eksportu, z konkretnym ID zdjęcia i listą rodziców;
- płatności `PENDING`, możliwe duplikaty profili i zamówień oraz rozbieżności `PaymentLedger`;
- stan linku Adobe i fakt jego wydania rodzicowi;
- błędy logowania, rejestracji, wyboru, generowania ZIP i pobierania wraz z czasem, correlation ID, uczestnikiem, etapem i bezpiecznymi szczegółami technicznymi;
- dzienny raport oraz alarm e-mail dla nowych incydentów, bez wysyłania zwykłego kliknięcia jako awarii.

Eksport dla laboratorium obejmuje zatwierdzone bezpłatne wybory i opłacone dodatki. Nie może korzystać z miniatury/WEBP jako cichego zamiennika JPG/HQ ani zwrócić częściowej paczki jako poprawnej.

## 6. ZIP i obserwowalność

Jedna treść pełnej galerii powinna prowadzić do jednego współdzielonego artefaktu ZIP dla wersji zawartości, niezależnie od liczby rodziców. Autoryzacja i audyt pozostają per rodzic, ale ciężka praca nie może być powtarzana dla każdego profilu.

Wymagania:

- deterministyczny `content_hash` galerii i idempotency key żądania;
- atomowe przejęcie zadania po `job_id`, nie schemat „odczytaj, a potem bezwarunkowo zapisz”;
- stany `QUEUED`, `PROCESSING`, `READY`, `FAILED`; jakikolwiek brak pliku kończy się `FAILED`, nie `SUCCESS`;
- telemetry: `job_id`, `run_id`, correlation ID, inicjator, liczba oczekiwana/dodana/odrzucona, bajty ZIP, czas kolejkowania/budowy, wynik wydania URL;
- osobne zdarzenia: utworzenie zadania, reuse, gotowość, błąd, wydanie URL, klik linku Adobe;
- ponowne użycie gotowej paczki w okresie TTL zamiast generowania kolejnej;
- alarm, gdy powstaje więcej niż jedno zadanie dla tego samego `job_id`, gdy paczka jest częściowa albo gdy występuje seria szybkich żądań.

Historyczne zdarzenia `GROUP_DOWNLOAD_ALL_SUCCESS` znaczą wyłącznie, że serwer próbował przygotować paczkę. Nie dowodzą, że rodzic pobrał ją w przeglądarce.

## 7. Znane anomalie z audytu produkcji 2026-08-24

### Galeria #20 — Magdalena Kierys

- 441 zdjęć, 34 profile rodziców, 117 wyborów / 98 unikalnych zdjęć;
- link Adobe jest prawidłowy i ma pozostać;
- 49 różnych ZIP-ów wygenerowano dla 3 rodziców w około 8 klastrach interakcji; 26 kolejnych zdarzeń nastąpiło w czasie do 5 sekund;
- trzy częściowe paczki (433/441, 439/441 i 440/441) zapisano jako `SUCCESS`;
- 11 zdjęć nie ma HQ, w tym dwa wybrane do odbitek przez łącznie 6 zgłoszeń;
- pięć starych zamówień nadal ma `PENDING`; jedno odpowiada późniejszemu opłaconemu zamówieniu;
- starsze opłacone zamówienia nie są w pełni uzgodnione z `PaymentLedger`;
- dwa podobne profile mogą należeć do tej samej osoby i wymagają ręcznego potwierdzenia;
- nazwa w bazie „klasa B” i historyczne logi „Klasa AB” wymagają decyzji właściciela, bez automatycznego przemianowania.

### Galeria #19 — klasa C

- 299 zdjęć i 19 profili rodziców; wszystkie zdjęcia mają źródło HQ, a zewnętrzny kanał pełnej galerii jest skonfigurowany;
- 14 rodziców ma komplet wyborów, 2 wybór częściowy, 3 brak wyboru;
- 11 zgód na publikację i 8 braków zgody — jest to prawidłowe i nie zmienia dostępu cyfrowego;
- jedna opłacona pozycja, zamówienie #23 na 9 odbitek / 22,50 zł, nie ma odpowiadającego wpisu znalezionego po `resource_id` w `PaymentLedger`;
- profile #47 i #48 mają tę samą znormalizowaną nazwę i wymagają ręcznej oceny; nie wolno ich automatycznie łączyć;
- flaga dodatkowych odbitek jest włączona dla 2 z 19 profili, co trzeba uzgodnić z globalnym ustawieniem galerii.

### Galeria #16 — Magdalena Juda / Błędowo

- 244 zdjęcia, 11 profili i komplet 5 wyborów dla każdego rodzica;
- wszystkie 244 zdjęcia nie mają `download_source_url`, więc wewnętrzny pełny download/HQ był niegotowy;
- 51 unikalnych zdjęć wybranych do odbitek nie ma źródła HQ;
- galeria wygasła 2026-08-22; danych i wyborów nie wolno usuwać tylko z tego powodu.

Te anomalie wymagają naprawy danych po kopii bezpieczeństwa i ręcznej akceptacji. Audyt produkcji był tylko do odczytu; ten dokument nie potwierdza wykonania migracji ani zmiany danych produkcyjnych.

Globalny preflight trzech galerii grupowych wykazał jednocześnie: zero wyborów przekraczających limit, zero wyborów zdjęcia z innej galerii, zero powtórzonych znormalizowanych e-maili w obrębie galerii oraz 64/64 syntaktycznie poprawne e-maile rodziców. Funkcyjny indeks unikalny e-maila nie jest więc blokowany przez aktualne dane, ale nadal musi zostać sprawdzony na kopii produkcji w pełnej migracji stagingowej.

## 8. Bramka jakości przed wdrożeniem

- test uprawnień: gość nie pobiera, poprawnie zalogowany rodzic pobiera dowolne zdjęcie i pełną galerię;
- test niezależności: zmiana wyboru/płatności/zgody nie zmienia prawa do plików cyfrowych;
- test Adobe: link jest widoczny po uwierzytelnieniu i jego kliknięcie jest audytowane poprawnym czasownikiem;
- test równoległości wyboru oraz niezmiennego snapshotu zgłoszenia;
- test 100/300/500 prawdziwych JPG na stagingu z pomiarem czasu, pamięci, rozmiaru i pojedynczym artefaktem przy wielu kliknięciach;
- test częściowej awarii: brak jednego pliku daje `FAILED` i alarm, nigdy sukces;
- test eksportu odbitek: zatwierdzone wybory + opłacone dodatki, zero cichych fallbacków HQ;
- test dziennego raportu i wiadomości alarmowej do administratora;
- migracja na kopii produkcji, raport preflight i plan rollbacku;
- niezależny odbiór QA. Do zamknięcia bramki obowiązuje **NO-GO dla produkcji**.

## Historia

- **2026-05-18** — pierwszy historyczny opis systemu wyborów.
- **2026-08-24** — właściciel formalnie potwierdził: pełna galeria cyfrowa jest dostępna każdemu uwierzytelnionemu rodzicowi, wybory służą odbitkom, a link Adobe pozostaje częścią procesu. Dokument dostosowano do aktualnej architektury i wyników audytu produkcji.
