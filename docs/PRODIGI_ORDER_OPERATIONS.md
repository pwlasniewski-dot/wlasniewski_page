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
4. Odśwież status: jawna akcja administratora pobiera stan i tracking. `Complete` oznacza wysłanie wszystkich pozycji, nie doręczenie. Nie ma automatycznego pollingu ani webhooka w tej wersji.
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
