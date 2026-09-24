# Prodigi / analityka — etap diagnostyczny, 24.09.2026

Status: kod przygotowany i sprawdzony lokalnie; nie wdrożono produkcyjnego zakupu Prodigi.
Baza: `9c10ac613d6521c7da5b857b2d1b55e20959930c`. Gałąź: `feat/prodigi-sandbox-economics`.
Dokument nadrzędny: `Plan_integracji_Prodigi_Wlasniewski.pdf`. Historia v7 od strony 77;
v8 B2B/spacery na stronach 89–95; v9 lokalna bramka druku i QA na stronach 96–98.
Najnowszy zakres kodu i ograniczenia: `PRODIGI_RELEASE_GATE.md`.

## Korekta decyzji biznesowej

Prodigi jest kandydatem do pilotażu, nie potwierdzonym najtańszym ani najbardziej opłacalnym dostawcą.
Nie mamy porównania identycznych produktów i pełnej dostawy do Polski, cen konta live ani wyników próbek.
Oficjalne API umożliwia wycenę bez zamówienia, a piaskownica nie realizuje fizycznej produkcji.
Ceny piaskownicy mogą różnić się od live. Nie opieramy polityki marży na testowej cenie.

Rekomendacja: najpierw 2–3 produkty, pełny koszt, próbki i sprzedaż do istniejących klientów galerii.
Równolegle pozyskiwanie klientów sesji. Przy małej liczbie zleceń rozbudowa integracji nie zastąpi popytu.
Porównać Prodigi z dwiema alternatywami dla tych samych wymiarów, materiału, ramy i adresu.
W macierzy: produkcja, wysyłka, podatki/import, FX, tracking, termin, próbka, szkody, reprint, czas obsługi.
Nie wybrano zwycięzcy i nie wykonano płatnych zamówień.

## Audyt zgodności z PDF

Odczytano dokument 76 stron. Zachować strony 1–76 jako historię; nowe fakty dopisać w aneksie.
Wersja v6 opisywała lokalne checkpointy `feature/prodigi-catalog-pricing`, bez push i wdrożenia.
Obecne main i dostępne gałęzie zdalne nie zawierają tych plików ani modelu CommerceOrderBuffer.
Nie udało się odzyskać ich z dostępnych plików. Historyczne 74 testy i 8 SQL nie są wynikiem dzisiejszej wersji.
Oznaczenie `RECOVERY-01 OPEN`: odzyskać checkpoint lub odtworzyć zgodny model i ponownie przetestować.

Aktualny AGENTS.md wymaga jednego centrum Rezerwacje → Zamówienia. Nie odtwarzać osobnej sekcji
/admin/commerce/buffer. Katalog wspólny dla sklepu i galerii; nPhoto pozostaje odrębnym procesem realizacji.
Prodigi to produkcja na zamówienie; brak dowodu na publiczny licznik fizycznego stocku.

## Wdrożony w kodzie zakres

- `GalleryShopAdmin`: rozwijany panel diagnostyki Prodigi przy dotychczasowych integracjach, bez nowej sekcji zamówień.
- `GET /api/admin/gallery-shop/prodigi`: tylko informacja o obecności klucza i wyłączonych zamówieniach.
- `POST` tej samej trasy: `product` albo `quote`; auth administratora, ten sam Origin, JSON, limit 16 KiB, limit zapytań.
- Stały host `https://api.sandbox.prodigi.com/v4.0`; tylko GET products i POST quotes, bez orders/refund/shipping mutations.
- `PRODIGI_SANDBOX_API_KEY` wyłącznie w środowisku serwera. Nie używać NEXT_PUBLIC, nie zapisywać klucza w CMS.
- Wyceny tylko PL/PLN; etap obejmuje GLOBAL-CAN-10X10 i GLOBAL-FAP-10X10 z jednym polem default, bez wkładek i dodatków.
- Wycena API może zawierać 1–10 pozycji; panel pozwala sprawdzić jeden SKU i ilość. To nie koszyk sprzedaży.
- Pozostałe SKU mają tylko odczyt metadanych. Albumy/pageCount i dodatkowe pola wymagają osobnego kontraktu.
- Timeout dostawcy 12 s, przeglądarki 20 s, brak automatycznego retry. Redirecty zablokowane, maksymalna odpowiedź 1 MiB.
- Odrzucenie ostrzeżeń, braków kosztu/PLN/przesyłek oraz zerowego kosztu produktu. Dostawa zero może być prawidłowa.
- Wyświetlenie przewidywanego kraju i przewoźnika nie gwarantuje trasy, trackingu ani InPost.
- `Analityka → Sprzedaż`: FinanceActuals oraz PodRevenueSimulator działają niezależnie od odczytu analytics v3.

Klucza Prodigi nie było w dostępnym środowisku; prawdziwy odczyt piaskownicy ma status NOT RUN.
Nie dodawano kluczy, nie zmieniano schematu ani danych produkcyjnych, nie uruchamiano druku.

## Finanse rzeczywiste i symulator

Rzeczywisty raport: wpłaty i zwroty w PLN według dat zdarzeń, oddzielnie rejestr i starsze zapisy.
Snapshot RepeatableRead; dedup identyfikatorów także poza okresem i dla wspólnego CART.
Waluty obce pomijane z komunikatem. Nieuzgodnione starsze wpłaty online nie są domyślnie uznawane za wpływ.
Zakres dat w Europe/Warsaw, DST i maks. 366 dni; admin auth, no-store, 503 z data:null zamiast fikcyjnego zera.
Brak historii wielu refundów częściowych pozostaje ograniczeniem modelu. Brak uzgodnienia z mBank.
Koszty, przychód księgowy i zysk pozostają niedostępne. Kwota wpłaty zaliczkowej nie jest zyskiem.

Symulator: ruch, konwersja, koszyk z dostawą, pełny koszt dostawcy, opłaty, rezerwa, reklama,
stałe koszty, czas i stawka obsługi, nakład startowy, cel i horyzont. Kwoty gotówkowe bez odliczenia VAT
albo ręcznie ujednolicone netto. Sam przełącznik nie przelicza liczb ani podatków; PIT/ZUS poza modelem.
Praca stała, marketingowa i administracyjna powinna wejść do stałych kosztów, obok minut na zamówienie.

Wynik = zamówienia × (koszyk − koszt dostawcy − płatności − rezerwa − wycena obsługi) − reklama − stałe koszty.
ROI = (wynik miesięczny × miesiące − nakład startowy) / nakład startowy.
Cel zakłada stały budżet reklamy i konwersję. Większy ruch może wymagać większej reklamy; nie jest prognozowany.
Zapis scenariusza jest jawnie lokalny, wersjonowany i walidowany; nie synchronizuje się między urządzeniami.

Przykład domyślny jest fikcyjny: 1000 wizyt, 1% konwersji, 199 zł koszyka, 110 zł dostawcy,
2%+0,30 zł płatności, rezerwa2%, reklama300, stałe100, 10 min ×60 zł/h.
10 zamówień → 1990 zł wpływów w modelu, 307,40 zł wyniku po wycenie obsługi.
Cel20 tys.:289 zamówień /28900 wizyt. Cel40 tys.:572 /57200. Nie znamy prawdopodobieństwa takiej sprzedaży.

## Docelowa ścieżka — nieukończona

Własne zdjęcie lub przypisana prywatna galeria → lokalny podgląd/kadr → produkt lub sesja+produkt lub sama sesja
→ jeden koszyk z aktualną ceną i zasadami → płatność → trwały bufor sklepu.
Produkt po sesji: termin → sesja → finalna galeria → wybór zdjęcia → wariant/kadr → akceptacja wersji
→ jawne rozliczenie zmiany ceny → adres/usługa/aktualna wycena → bramka realizacji → dokładnie jedno zlecenie.
Gotowy plik może pominąć oczekiwanie na sesję, ale nie kontrolę praw, pliku, ceny i akceptacji.
Przykładowe zdjęcie nie może trafić do druku. Konto bez przypisanej galerii nie daje przycisku pustej galerii.

Zachęta pokazuje rzeczywiste portfolio z prawem publikacji, nie obiecuje klientowi konkretnego efektu AI.
Możliwy zakup własnego wydruku bez sesji; sesja jest dobrowolną opcją. Teksty, ceny i CTA edytowalne w CMS.
Przyszły upload: prywatność, limity bajtów/pikseli, dekodowanie, orientacja, profil, usuwanie EXIF/GPS kopii,
postęp, powtórzenie i usunięcie; wersja/hash akceptacji odpowiada dokładnemu plikowi produkcyjnemu.

Bufor należy do sklepu, nie do zlecenia wstrzymanego w Prodigi. Historyczna cena klienta jest niezmienna.
Atomic claim/outbox, stały idempotencyKey, timeout UNKNOWN i uzgodnienie przed retry.
Anulowanie, refund, dokument oraz reklamacja to osobne potwierdzane operacje. Complete oznacza wysłanie,
nie doręczenie. Faktura i jej obowiązek czasowy nie czekają automatycznie na pakowanie.

## Wykonane testy i pętle

Środowisko: Node24.19.0 (repo oczekuje22), Prisma5.22, transport/baza symulowane. Nie są to testy po wdrożeniu.
Polecenie `npm run test:prodigi-foundation`: 67 przypadków PASS: 46 Node tests (13 sandbox,13 symulator,20 finanse),
13 API/DOM sandbox oraz8 DOM symulatora. Nie sumować ponowień tych samych testów jako nowych przypadków.

- R1: unit sandbox11 PASS; niezależny review wykrył braki, więc nie oznaczono całego procesu jako gotowy.
- R2 / POD-2026-001: puste shipments i zerowy koszt produktu → walidacja; POD-S12 PASS.
- R2 / POD-2026-002: album/pageCount i dodatkowe pola → allowlista2SKU; POD-S13 PASS.
- R2 / POD-2026-003: niepełne required print areas → blokada UI; POD-U05 PASS.
- R2 / POD-2026-004: zawieszony POST → timeout; niezależne wykonanie z przyspieszonym zegarem PASS.
- R3 / POD-2026-005: regresja gallery-shop-save: automatyczny odczyt konfiguracji dodawał alert obok edycji katalogu.
  Zmieniono na leniwie otwierany panel, dodano POD-U00; cały `npm run test:gallery-shop` PASS.
- R4 / POD-2026-006: brak timeout GET konfiguracji → timeout20s, komunikat; POD-U06 PASS.
- FIN-001–006: waluty, dedup, refundy, auth/error, daty/DST, frontend stale/race →20 testów PASS.
- Symulator:13 matematycznych +8 DOM, w tym3 odmienne cykle zapis/odczyt, wartości puste/ujemne/NaN,
  brak rentowności, zerowa konwersja, brak localStorage, reset, podstawa netto →PASS.
- Niezależny QA po poprawkach: brak znalezionych P0/P1 dla etapu diagnostycznego, nie odbiór sprzedaży.

Prisma generate PASS. Pełny typecheck domyślnie przerwany OOM2GB; powtórka4GB zakończona.
Baza i wersja zmieniona: każda103 diagnostyki,56 różnych po usunięciu numerów linii; brak nowych diagnostyk.
Wynik całego repo nadal FAIL. Nie wyciszano błędów, nie pomijano plików. Dowody w `docs/qa/prodigi-2026-09-24/`.
Playwright: brak przeglądarki, próba pobrania nieudana; prawdziwy browser E2E i wizualne mobile mają status BLOCKED.
Nie ma podstaw do uznania pełnego wdrożenia tylko na podstawie testów DOM.

## Następny odbiór

1. Uzupełnić klucz sandbox w środowisku podglądu; sprawdzić obaSKU, warianty i wyceny PL w rzeczywistym API.
2. Uzyskać ceny live bez zamawiania, porównać dostawców i zakwalifikować fizyczne próbki.
3. Odzyskać/odtworzyć katalog marż oraz trwały bufor na obecnym modelu wspólnych zamówień; migracja na izolowanej bazie.
4. Upload, publiczny podgląd, CMS zachęty i wspólny koszyk; blokady prywatności i dokładnej wersji zdjęcia.
5. Płatność, bufor po sesji, zatwierdzanie wariantu, kolejka, idempotencja, paczki i statusy.
6. Faktury/mBank/KSeF, korekty i historia refundów; reklamacje oraz anulowanie. InPost dla Prodigi osobno kwalifikować.
7. Zamknąć bramkę build/typecheck na obsługiwanym Node22, browser E2E/mobile, sandbox i próbkach; dopiero pilot klientów.

## Źródła

Sprawdzone24.09.2026:
- https://www.prodigi.com/print-api/docs/reference/ — kontrakt produktów, quotes i rozdzielenie środowisk.
- https://www.prodigi.com/faq/print-api/ — sandbox, brak fizycznej realizacji, różnice cen.
- https://www.prodigi.com/faq/payments-and-pricing/ — kontekst kosztów konta.
- https://www.prodigi.com/faq/shipping/ — logistyka wymagająca kwalifikacji.
- PDF v6 strony1–76 i repo main9c10ac6, AGENTS.md — stan i reguły projektu.

## R5 — restrykcyjny audyt admina i responsywności po uwagach właściciela

Kod zapisany zdalnie w draft PR https://github.com/pwlasniewski-dot/wlasniewski_page/pull/91.
Pierwszy checkpoint e147959. Poniższa runda zastępuje opis początkowego rozmieszczenia paneli.

Produkcja: cloud browser /admin oraz /admin/login pokazały502 z Connection refused, bez dotarcia do logowania.
Niezależny anonimowy HEAD /admin z kontenera zwrócił HTTP200 i nagłówki Netlify. Hosting pokazał aktywne ready.
Nie jest to dowód awarii strony u klientów. Dokładnej przyczyny odmowy połączenia w cloud browser nie ustalono.
Nie wprowadzano zmian w działającym hostingu; nie odczytano produkcyjnych danych administratora.

Ustalenia i wykonane poprawki:
- UX-001: utrata niezapisanego scenariusza po zmianie zakładki → jeden trwały panel sales; szkic pozostaje.
- UX-002: raporty poza panelem wskazanym przez aria-controls → poprawna przynależność i panel także przy awarii v3.
- UX-003: kalkulator wypierał fakty → dane wpłat i istniejące KPI najpierw; symulator domyślnie zwinięty.
- UX-004: diagnostyka Prodigi w sekcji wysyłki Foto-Dron → osobny rozwijany blok przy nagłówku wspólnej oferty.
  Skróty Test Prodigi i Wpłaty i rentowność; drugi skrót otwiera /admin/analytics?view=sales.
- UX-005: dwuznaczny główny refresh → Odśwież ruch i rezerwacje; finanse zachowują swój przycisk.
- UX-006: błędna nazwa/suma walut w zamówieniach → Wartość opłaconych zamówień PLN, jawny zakres wszystkich
  wczytanych bez filtrów i bez rozliczenia zwrotów; ostrzeżenie innych walut i link do finansów.
- UX-007: zbyt wąskie kolumny przy sidebarze/tablecie → siatka zależna od dostępnej szerokości w finansach
  i wariantach symulatora; układ SKU dopiero od lg; łamanie długiej nazwy klucza; czytelny loading Prodigi.
- FIN-007: niepełny kontrakt odpowiedzi powodował crash → walidacja wszystkich używanych pól i kwot, dat,
  zakresu zgodnego z żądaniem, notes;17 błędnych payloadów przeszło test odmowy bez crasha.
- FIN-008: wiszący odczyt finansów → timeout20s i retry, brak spóźnionego sukcesu po abort.

Końcowy test: npm run test:prodigi-foundation obejmuje83 przypadki/grupy (48 Node,13 API/DOM Prodigi,
8 DOM symulatora,12 istniejących i rozszerzonych grup analityki,2 grupy karty zamówień).
Nie sumujemy83 z wcześniejszymi67; to rozszerzony zestaw po poprawkach.

Nadal OPEN w całym istniejącym adminie, poza odebranym etapem:
- mobilna tabela zamówień: siedem kolumn, akcje daleko z prawej; potrzebne mobilne karty z detalami;
- zamknięte menu boczne używa transformacji bez zarządzania fokusem/inert; Escape, powrót fokusu,44px;
- stare katalogi nPhoto i starszy edytor wymagają czytelnych oznaczeń i linków do wspólnej oferty;
- powrót z galerii ma stałą trasę CRM, nie zachowuje kontekstu wejścia;
- nie wykonano pomiaru renderu320/390/768/1440, testu klawiatury całego admina ani zoom200% w przeglądarce.

Próba lokalnego wizualnego harnessu nie jest PASS: cloud browser odrzucił protokół file jako niedozwolony.
Nie użyto obejścia blokady. Wcześniejsza instalacja lokalnego Chromium także się nie powiodła.
Testy React DOM są wykonane; wizualny odbiór responsywności, prawdziwe logowanie i produkcyjny UX pozostają BLOCKED.
Nie deklarujemy „maksymalnie responsywnego” całego admina na podstawie samych klas CSS.

Potwierdzenie końcowe R5: pełny zestaw83 i regresja koszyka PASS. Typecheck po wszystkich zmianach:
103 diagnostyki/56 różnych, dokładnie jak baza; brak nowych. Dowód: typecheck-final-4gb.log i typecheck-comparison.json.
Aneks v7 PDF obejmuje strony77–88; zachowano tekst i zawartość każdej z pierwszych76 stron, sprawdzono render wszystkich12 nowych stron.
