# Obsługa produktów Prodigi w zamówieniach galerii

Zakres obecnego adaptera: produkty z jednym zdjęciem HQ i jednym polem druku `default`, pełny kadr (`fitPrintArea`), dostawa kurierem do Polski. Fotoksiążki, wiele pól druku i mieszane koszyki mają jawną blokadę. Adapter nie obsługuje zamawiania przyszłej sesji ani plików przesyłanych przez kupującego spoza galerii.

## Test bez danych klienta

`POST /api/admin/gallery-shop/prodigi-test-orders` wymaga administratora, poprawnego Origin oraz stałego `testId` (UUID wygenerowany przed pierwszą próbą). Akcje: `create` (także SKU), `refresh`, `cancel`. API zawsze wybiera sandbox, syntetyczny adres oraz oficjalny obraz testowy Prodigi. Nie tworzy sprzedaży ani fałszywej płatności; trwały zapis diagnostyczny jest w Setting `prodigi_sandbox_test_v1_<testId>`.

Klucz `PRODIGI_SANDBOX_API_KEY` jest wyłącznie serwerowy. Ponowny `create` z tym samym testId nie ponawia zlecenia. Przy nieznanym wyniku należy sprawdzić dashboard po `sandbox-test-<testId>`; nie usuwać blokady i nie zmieniać testId celem ponowienia tej samej próby.

## Produkcja

Do aktywacji wymagane są łącznie `PRODIGI_ORDER_ENV=live`, `PRODIGI_LIVE_ORDERS_ENABLED=true`, `PRODIGI_API_KEY`, kwalifikowany snapshot produktu live (`liveQualified` i `ordersEnabled`) oraz potwierdzona płatność. Podglądy deploy-preview, branch-deploy i izolowana baza QA blokują live niezależnie od klucza i flagi. Domyślne środowisko to sandbox; rzeczywiste zamówienie klienta nie zostanie wysłane do sandbox.

W istniejącym widoku Rezerwacje → Zamówienia:

1. Sprawdź pliki HQ i koszt: serwer weryfikuje przynależność zdjęć do galerii, źródło S3, format JPEG/PNG, rozdzielczość, SHA-256; zapisuje prywatną kopię pliku pod kluczem zależnym od jego zawartości. Pobiera nową wycenę i kurs NBP. Administrator dostaje linki do rzeczywistych plików produkcyjnych ważne 15 minut.
2. Zatwierdź podgląd, wariant i adres. Dowód zatwierdzenia wiąże hash finalnego pliku, parametry, ilość, cenę linii i zamówienie. Wycena ma operacyjny limit 15 minut, który nie jest gwarancją ceny dostawcy.
3. Zleć produkcję: ponowna kontrola plików i kosztu. Wzrost kosztu wymaga nowego przygotowania i zatwierdzenia. Wspólna blokada transakcyjna z obsługą zwrotów weryfikuje pokrycie całego zamówienia płatnościami minus zwroty oraz przejście pełnego release gate. CAS trwałe zapisuje `submitting` przed zewnętrznym POST. Stały idempotencyKey identyfikuje jedną próbę. Prodigi otrzymuje podpisany link do kopii i jej MD5 do kontroli pobranych bajtów.
4. Odśwież status: jawna akcja administratora pobiera stan i tracking. `Complete` oznacza wysłanie wszystkich pozycji, nie doręczenie. Nowe zlecenia otrzymują również indywidualny callback opisany poniżej; ręczne odświeżenie pozostaje sposobem kontroli i obsługi starszych zleceń.
5. Anulowanie: najpierw dostępność akcji z API, następnie wynik API. Pełne potwierdzone anulowanie zmienia status realizacji na `cancelled`. Nie oznacza zwrotu pieniędzy klientowi; zwrot musi przejść osobno przez PayU.

Stan `unknown` lub pozostawiony `submitting` blokuje nowy POST. Administrator może podać ID znalezione w dashboardzie. Serwer pobiera to zamówienie i wymaga zgodności zarówno merchantReference, jak i idempotencyKey przed powiązaniem wyniku. Nie wolno resetować blokady na podstawie samego timeoutu.

Produkcja i tracking są w `PhotoOrder.product_ids`, nie w drugim rejestrze sprzedaży. Panel i API blokują równoległe ręczne etapy, eksport nPhoto i nadanie InPost dla tych pozycji. Prywatne dowody, identyfikatory dostawcy i pliki nie są częścią publicznego widoku klienta.

## Weryfikacja

- `node --import tsx tests/unit/prodigi-orders.test.ts`: adapter, środowiska, wynik niejednoznaczny, bezpieczny tracking, wymagane assety i brak automatycznych powtórzeń.
- `node tests/qa/prodigi-orders.cjs`: admin/Origin, obowiązkowy testId, trwała blokada po błędzie transportu, nieopłacone zamówienie i duplikat.
- Niezależna kontrola ścieżki release: `tests/prodigi-full-release.cjs`.

Powyższe testy automatyczne nie wysyłają zleceń do sieci Prodigi i nie zapisują produkcyjnej bazy. Osobny rzeczywisty test sandbox wymaga uruchomienia diagnostyki na syntetycznych danych.

Dokumentacja kontraktu API: https://www.prodigi.com/print-api/docs/reference/ (Orders, idempotencyKey, actions/cancel, Assets.md5Hash, Order completion).

## Rzeczywista próba sandbox

Próba wykonana przez prowadzącego integrację: `ord_1176531`, końcowy wynik `Cancelled`. Dane syntetyczne, bez zamówienia klienta i opłaty produkcyjnej.

## Własne zdjęcia klienta — magazyn i konfiguracja

Nowe endpointy `/api/shop/personalization/session`, `/upload`, `/complete` i `/photos/{id}` wymagają aktywnego konta klienta. Sesja tworzy jedną prywatną galerię `terms_source=SHOP_UPLOAD`, związaną z ID klienta. Hasło udostępniania, cookie galerii, zgodność samego e-maila oraz podgląd administratora nie dają dostępu do tych zdjęć. Rezerwacja pliku i zakończenie są związane z tym samym kontem; powtórne zakończenie zwraca ten sam rekord zdjęcia.

Limity: JPEG/PNG do 20 MB, 100 plików i łącznie 50 MB na klienta, 60 megapikseli po dekodowaniu. HEIC wymaga eksportu do JPEG. Przeglądarka liczy SHA-256 i wysyła plik bezpośrednio podpisanym PUT do S3; body funkcji Netlify zawiera tylko małe JSON. Podpis obejmuje rozmiar, typ, SHA-256 oraz warunek `If-None-Match: *`. Podpis wygasa po 10 minutach. Zakończenie ponownie sprawdza rozmiar HEAD, rzeczywiste bajty, SHA, magic bytes i dekodowanie sharp. Normalizuje obrót, usuwa EXIF/XMP/IPTC, przygotowuje JPEG sRGB i miniaturę. Pliki nie otrzymują `public-read`. Klient widzi wyłącznie autoryzowany endpoint miniatury; nie otrzymuje klucza finalnego S3 ani publicznego adresu pliku.

Przed ustawieniem `SHOP_UPLOADS_PRIVATE_STORAGE_CONFIRMED=true` operator musi potwierdzić wszystkie warunki:

1. Prefiks `shop-personalization/` w skonfigurowanym `S3_BUCKET` rzeczywiście nie jest publiczny. Sam brak ACL `public-read` nie wystarcza, jeśli polityka całego bucketa dopuszcza anonimowe `GetObject`. Testowy obiekt syntetyczny w tym prefiksie ma zwracać anonimowo 403; odczyt uprawnionym kluczem działa. Nie wolno używać zdjęcia klienta do sprawdzania prywatności. Jeżeli obecna polityka udostępnia cały bucket, najpierw trzeba ograniczyć ją do publicznych prefiksów albo zastosować odrębny, właściwie podłączony magazyn prywatny.
2. Rola serwera ma uprawnienia do podpisanego PutObject oraz Head/Get/Put/Delete w tym prefiksie. Końcowe pliki znajdują się w `shop-personalization/{clientId}/final/`, staging w `shop-personalization/staging/{clientId}/`.
3. Lifecycle usuwa porzucone obiekty **wyłącznie staging** po 1 dniu. Reguła ma dokładny prefiks `shop-personalization/staging/`, bez symboli wieloznacznych. Nie konfiguruj wygaszania całego `shop-personalization/`, bo usunęłoby pliki powiązane z zamówieniami. Kod usuwa staging po zakończeniu oraz odrzuceniu pliku, ale nie obejmuje pliku porzuconego po samym PUT. Wygasłe rezerwacje nie zajmują logicznego limitu klienta.
4. CORS umożliwia PUT z dokładnych zaufanych originów witryny oraz konkretnego podglądu używanego do testu. Dozwolone nagłówki: `content-type`, `x-amz-checksum-sha256`, `if-none-match`, `content-length`. Nie potrzebuje ciasteczek ani nagłówka Authorization na żądaniu PUT do S3. Przeglądarka wysyła dokładnie nagłówki zwrócone przez endpoint `/upload`.
5. Flaga prywatności i dane dostępowe są serwerowe i mają właściwy zakres wdrożenia. Ta flaga nie konfiguruje polityki AWS automatycznie.

### Bezpieczna kontrola po konfiguracji

Najpierw zarezerwuj osobne konto testowe w odizolowanej bazie, a do uploadu użyj syntetycznego JPEG. Sprawdź: odczyt miniatury przez właściciela, odmowę z drugiego konta i bez logowania, wygaśnięcie podpisu, odmowę zmienionego SHA, dwukrotne `/complete` bez dodatkowego zdjęcia oraz brak publicznego odczytu S3. Dopiero po tych sprawdzeniach włączaj upload klientom.

Testy lokalne korzystają z pamięciowych atrap Prisma/S3 i rzeczywistego sharp. Nie zastępują potwierdzenia polityki AWS, CORS, połączenia z odizolowaną bazą ani testu przeglądarkowego podpisanego PUT. W tej sesji połączenie z bazą przez TCP:5432 z wykonawcy było niedostępne, a utworzenie kolejnej gałęzi Neon blokował limit konta. Nie wykonano z tego powodu pełnego zewnętrznego przebiegu uploadu i płatności.

Włączenie w CMS jest niezależne od flagi infrastruktury: wspólna konfiguracja `gallery_shop_default` musi mieć włączony sklep i `publicOffer.personalizationEnabled=true`. Serwer sprawdza to przed utworzeniem sesji, rezerwacją przesyłania oraz zakończeniem pliku. Wyłączenie personalizacji nie odbiera właścicielowi odczytu już zapisanych zdjęć. Testy normalizacji: `node --import tsx tests/unit/shop-upload-image.test.ts`; test dokładnego właściciela galerii: `node --import tsx tests/unit/shop-upload-owner.test.ts`; niezależna kontrola procesu i limitów: `node tests/prodigi-full-upload.cjs`.


## Automatyczne zmiany statusu Prodigi

Nowy POST zlecenia zawiera indywidualny `callbackUrl` z losowym 256-bitowym tokenem. Serwer zapisuje wyłącznie SHA-256 tokena i indeks do istniejącego PhotoOrder, atomowo razem z blokadą rozpoczęcia realizacji. URL ma stały zaufany host produkcyjny, nie pochodzi z nagłówka przeglądarki.

`POST /api/shop/prodigi/callback/{token}` traktuje maksymalnie 512 KB JSON wyłącznie jako sygnał. Żadna cena, płatność, status, identyfikator ani adres z tego body nie jest zapisywany. Po znalezieniu indeksu serwer sam pobiera aktualny stan przez autoryzowane GET Prodigi, używając środowiska i ID zapisanego w zamówieniu. Wymaga zgodności merchantReference oraz idempotencyKey i aktualizuje rekord przez CAS. Dopiero ten potwierdzony stan uruchamia wspólny mechanizm powiadomień z trwałym zapobieganiem duplikatom.

Callback przychodzący przed zapisaniem ID dostawcy lub podczas konfliktu zapisu dostaje 503; nie odblokowuje nowego zlecenia i nie korzysta z ID przesłanego w body. Odpowiedzi zawierają tylko potwierdzenie, bez danych klienta. Starsze zlecenia bez indeksu zachowują ręczne odświeżanie. Kod nie zakłada istnienia udokumentowanego podpisu kryptograficznego callbacka Prodigi; bezpieczeństwo opiera się na losowym tokenie pojedynczego zamówienia i odczycie autorytatywnym z API. Nie oznacza to testu rzeczywistej dostawy callbacka przez dostawcę — ten wymaga wdrożonego adresu i odizolowanego testu.
