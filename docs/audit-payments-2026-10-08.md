# Audyt spójności płatności i źródeł oferty — 2026-10-08

Stan: kod roboczy gałęzi `feat/prodigi-shop-fulfillment`, baza audytu HEAD `e5ecbcf`, z równoległą zmianą wspólnego koszyka. Audyt nie zmienia backendu, konfiguracji ani danych. Nie wykonano płatności, zapytań do operatorów, wysyłki wiadomości ani zapisów do rzeczywistej bazy.

## Wniosek

Najpilniejsze są publiczne wejścia przyjmujące kwotę i identyfikator istniejącego zasobu bez weryfikacji: **`/api/checkout` i `/api/payu/order`**. Sam podpis webhooka nie rozwiązuje problemu: operator może poprawnie podpisać płatność zainicjowaną na zaniżoną kwotę. Drugi potwierdzony problem to osobna ścieżka zakupu karty emitująca `GIFT_*`, którego główny webhook nie realizuje. Publiczny odczyt katalogu kart dodatkowo nadpisuje ustawienia administratora.

Nie należy scalać wszystkich modeli biznesowych. Należy współdzielić wycenę, zlecenie płatności, weryfikację callbacka, ledger i reguły przejść stanu, zachowując osobne reguły rezerwacji, kart, galerii, umów i warsztatów.

## Metoda i granice dowodu

Przejrzano inicjatory PayU, obu odbiorców PayU, webhook Stripe, główne źródła pakietów/kart/produktów, odczyt finansów, frontendowe wywołania i middleware. Lokalnie wykonano rzeczywisty kod `api/checkout` i `api/payu/notify`, transpilowany przez TypeScript, z atrapą wyłącznie DB/operatora/efektów zewnętrznych. Weryfikacja podpisu używała rzeczywistego `verifyPayUNotificationSignature` i lokalnego klucza testowego. Wyniki:

1. Żądanie istniejącej rezerwacji 456 z `amount: 0.01` produkuje zlecenie na 1 grosz; poprawnie podpisane testowe `COMPLETED` ustawia `Booking.status = confirmed` bez odczytu należnej ceny. PASS.
2. Poprawnie podpisane testowe `GIFT_456_123456789` zwraca 200 i zapisuje ledger, ale nie aktualizuje ani nie aktywuje `GiftCardOrder`. PASS.

To dowód działania kodu, **nie** dowód wykorzystania na produkcji. Nie badano dzienników transakcyjnych, aktualnej konfiguracji operatorów ani publicznej osiągalności wdrożenia. Daty i identyfikatory testu były syntetyczne. Nie wykonywano pełnego audytu każdej strony CMS lub praw dostępu do całego panelu.

## Mapa istniejących ścieżek

| Wejście | Źródło kwoty | Zasób / identyfikator PayU | Ocena rozdzielenia |
| --- | --- | --- | --- |
| `/api/basket/checkout` | Serwerowy Package / CMS drona / GiftCard template; promocje i vouchery weryfikowane ponownie | Booking lub GiftCardOrder, `CART_*` | Właściwy wspólny checkout rezerwacji i kart; API celowo przyjmuje jedną pozycję |
| `/api/checkout` | `body.amount` w PLN | istniejący Booking, `BOOKING_*` | Duplikat niebezpieczny; nie znaleziono wywołania w obecnym frontendzie |
| `/api/payu/order` | `body.amount` w groszach | Booking / PhotoChallenge / Contract | Aktywny dla umów; brak serwerowego kontraktu wyceny i właściciela |
| `/api/gift-cards/checkout` | GiftCard template z DB | GiftCardOrder, `GIFT_*` | Duplikuje zakup karty i nie ma zgodnego handlera notify |
| `merchandise-server.createShopOrder` | Wspólny katalog + cena/dostawa/zdjęcia z serwera | PhotoOrder, `GALLERY_*`, metadata `gallery_merchandise` | Uzasadniona domena produktów ze zdjęciem; dobry wzorzec idempotencji |
| Galerie indywidualne `/order`, grupowe `/purchase-extras` | Oferta i prawa do zdjęć konkretnej galerii | PhotoOrder, `GALLERY_*`, starsze metadata | Odrębność dostępu do zdjęć jest uzasadniona; callback powinien współdzielić rygor kontroli |
| `/api/workshops/pay` | `WorkshopOffer.price` / zaliczka z DB | WorkshopOffer, `WORKSHOP_*` | Odrębny model oferty uzasadniony; brakuje owner-check i idempotencji |
| `/api/photo-challenge/create-with-payment` | `Package.challenge_price` z DB | PhotoChallenge, `CHALLENGE_*` | Odrębny workflow zaproszenia uzasadniony; omijany przez słabsze `/api/payu/order` |
| `/api/webhooks/stripe` | Zewnętrzny podpisany event | GiftCardOrder | W źródłach nie znaleziono tworzenia nowych Stripe Checkout sessions; historycznej konfiguracji nie zweryfikowano |

## Potwierdzone ustalenia

### F1 — P0: zaniżona płatność może potwierdzić cudzą rezerwację lub stan umowy

- `src/app/api/checkout/route.ts:8–33`: wejście przyjmuje `bookingId`, `amount`, `email`, bez autoryzacji i bez odczytu Booking/ceny. `:72` zapisuje provider ID do rekordu wybranego przez użytkownika.
- `src/app/api/payu/order/route.ts:8–18`, `:33`, `:45–74`: analogicznie akceptuje dowolną kwotę i Booking/Challenge/Contract ID. Odczyt umowy w `:23` służy jedynie do uzupełnienia e-maila. Nie weryfikuje właściciela, należności ani dopuszczalnego etapu płatności.
- `src/app/strefa-klienta/umowy/[id]/page.tsx:388`: aktywny frontend korzysta z tego drugiego wejścia.
- `src/app/api/payu/notify/route.ts:716–725`: `BOOKING_*` ustawia `confirmed`, nie porównując kwoty, waluty, poprzedniego stanu ani oczekiwanego provider ID.
- Ten sam plik `:612–632`: `CHALLENGE_*` ustawia `paid`/`sent`; `:821–849`: `CONTRACT_*` ustawia `deposit_paid_at`, również bez kontroli należności.
- `src/middleware.ts:15`: matcher pomija `/api/`, więc nie ma tu ukrytej ochrony stroną logowania.

**Skutek:** prawidłowy podpis PayU poświadcza wpłatę, ale kod mylnie uznaje ją za zapłatę wymaganej należności. Warunek scenariusza: operator przyjmie wskazaną dodatnią małą kwotę, płatność zostanie zakończona i callback trafi do handlera. Nie twierdzimy, że można podrobić podpis lub że taki incydent wystąpił.

**Reuse:** odciąć nieweryfikowane inicjatory lub zamienić je na adaptery istniejącego serwerowego checkoutu. Dla dopłat najpierw owner-check albo celowy token płatności, odczyt pozostałej należności, trwały payment attempt związany z zasobem i kwotą. Callback musi porównać attempt, provider ID, walutę, kwotę i przejście stanu przed skutkami biznesowymi.

### F2 — P1: zakup karty z osobnej strony może zostać opłacony bez wydania karty

- `src/app/karta-podarunkowa/[id]/kup/page.tsx:81` wywołuje `/api/gift-cards/checkout`.
- `src/app/api/gift-cards/checkout/route.ts:76` tworzy `GIFT_<orderId>_<timestamp>`.
- `src/lib/payu.ts:27`, `src/lib/payments/payuNotification.ts:1,35–60` kierują nowe zlecenia do kanonicznego `/api/payu/notify`, nawet jeśli ustawienie zawiera stary callback.
- `src/app/api/payu/notify/route.ts:96–112` zapisuje ledger; `:365–387` blokuje fallback kart dla każdego typowanego prefiksu; nie ma gałęzi `GIFT`. `:904–906` tylko loguje nieobsłużony identyfikator, a `:1031` zwraca sukces.
- `src/app/api/gift-cards/access/[token]/route.ts:40–44` odmawia dostępu, dopóki status nie jest `completed`.

**Skutek:** brak aktywacji/wiadomości/karty pomimo ukończonej wpłaty. Potwierdzone lokalnym wykonaniem handlera, bez PayU.

**Reuse:** jedna usługa zakupu i aktywacji GiftCardOrder, używana przez koszyk i zgodność starych linków; jawny handler historycznych `GIFT_*`, z kontrolą kwoty/provider ID i idempotencją. Nie wystarczy zmienić etykiety w UI.

### F3 — P1: publiczny GET katalogu kart nadpisuje ofertę CMS

- `src/app/api/gift-cards/shop/route.ts:6–22`: 15 ofert zaszytych w kodzie.
- `:24–56`: każdy GET robi upsert z `update` ceny, wartości, tytułu, opisu, motywu, dostępności i `lowest_price_30d`.
- `src/app/api/admin/gift-cards/[id]/route.ts:13,29–39`: administrator może prawidłowo zmienić te same pola; następny publiczny GET je przywraca.

**Skutek:** zapis admina nie jest źródłem prawdy; wyłączenie lub zmiana ceny oferty może zostać cofnięta samym wejściem na stronę. Nadpisanie `lowest_price_30d` jest również błędem historii cen, bez dokonywania oceny prawnej.

**Reuse:** pozostawić dane GiftCard jako ofertę; domyślne pozycje wyłącznie w jawnej migracji/seedzie typu create-if-missing. GET ma tylko czytać. Zachować ID i historię istniejących zakupów.

### F4 — P1: wartość wydawanej karty nie jest niezmiennym snapshotem zakupu

- `src/app/api/basket/checkout/route.ts:607–623` utrwala `amount_paid` i referencję do template.
- `src/app/api/payu/notify/route.ts:255–278` podczas aktywacji czyta bieżący template i klonuje jego aktualne `amount`, `value`, treści. Analogicznie stary fallback `:388–424` i Stripe `:53–79`.

**Skutek:** zmiana szablonu między utworzeniem płatności a callbackiem zmienia wartość/treść dostarczanej karty przy niezmienionej zapłaconej kwocie. F3 zwiększa częstość niejawnych zmian.

**Reuse:** wspólny immutable snapshot oferty w GiftCardOrder, wykorzystany przez checkout, aktywację, mail i prezentację. Oddzielić nominalną wartość karty od ceny sprzedaży; nie zakładać ich stałej równości.

### F5 — P1: brak trwałej idempotencji starych inicjatorów; retry może tworzyć nowe zamówienia

- `src/app/api/basket/checkout/route.ts:149`: nowy losowy `CART_*` przy każdej próbie, `:613` nowy GiftCardOrder. Kontrola terminu chroni rezerwację sesji, ale nie deduplikuje zakupu karty.
- `src/app/api/gift-cards/checkout/route.ts:49,76`: nowy order i nowy identyfikator przy każdej próbie.
- `src/app/api/payu/order/route.ts:45–55` oraz `/api/checkout/route.ts:33`: timestamp zamiast trwałego identyfikatora próby.
- Basket `:761–776` traktuje także niejednoznaczny błąd sieci jako failed/cancelled, choć provider mógł już przyjąć płatność. Osobny gift checkout nie uzgadnia takiego stanu.

**Skutek:** duplikaty rekordów i linków płatności po odświeżeniu/retry. Nie oznacza automatycznego dwukrotnego obciążenia; dwa ukończone linki wymagają dwóch płatności. Brakuje bezpiecznego uzgodnienia nieznanego wyniku.

**Reuse:** wzorzec z `merchandise-server.ts:86–98,121,130–133`: idempotency key + fingerprint + unique DB + stan do uzgodnienia po niejednoznacznym wyniku. Dla starszych domen zastosować ten sam mechanizm, zachowując ich rekordy biznesowe.

### F6 — P1: ogólny ledger zwrotów nadpisuje zamiast sumować odrębne zwroty

- `src/app/api/payu/notify/route.ts:998–1025` nie deduplikuje `refundId`; `refunded_amount = refundAmount || ledgerPayment.amount` zastępuje poprzednią wartość.
- Dwa odrębne finalne zwroty 1000 i 2000 zapiszą na końcu 2000, a nie 3000. Brak/zero kwoty zostanie potraktowany jako zwrot całej wpłaty.
- Gałąź wymaga też `body.order` już w `:60–62`; payload bez niego, poza wcześniej obsłużonym merchandise, nie dojdzie do refund handlera. Nie weryfikowano aktualnego kształtu rzeczywistych callbacków historycznych transakcji.

**Skutek:** niespójność raportów wpłat netto i zwrotów dla starszych domen.

**Reuse:** deduplikowany rejestr zwrotów per provider/refund ID i suma w transakcji, jak `src/lib/galleries/merchandise-refund.ts:12–34`; nie przenosić dosłownie nazw domeny Prodigi.

### F7 — P1/P2: Stripe i stary callback mają słabsze reguły replay/stanu

- Stripe ma rzeczywistą weryfikację podpisu (`src/app/api/webhooks/stripe/route.ts:23–37`), ale `:43–97` każde powtórzenie `checkout.session.completed` klonuje nową kartę i przestawia referencję zamówienia. Brak transakcyjnego znacznika eventu, kontroli `session.payment_status`, kwoty/waluty i powiązanego session ID. `payment_failed`/`charge.refunded` w dalszej części nadpisują status bez wspólnego ledgeru.
- `src/app/api/payments/callback/route.ts:34–49` również weryfikuje podpis, lecz `:74–92,113–138` zapisuje każdy otrzymany status bez kwoty/provider ID i bez monotonii; późniejszy PENDING/CANCELED może cofnąć PAID. Błędy zapisu są łapane, po czym odpowiedź pozostaje OK.
- Kanoniczny resolver nie kieruje nowych zleceń do starego callbacka; nie znaleziono nowego inicjatora Stripe. Ich aktualna konfiguracja i liczba historycznych płatności pozostają nieznane.

**Skutek:** potwierdzony błąd kodu przy replay/późnych eventach; priorytet P1 jeśli te integracje nadal otrzymują zdarzenia, P2 jeśli są wyłącznie nieaktywne historycznie. Nie zgłaszamy obejścia podpisu.

**Reuse:** wejścia historyczne jako adaptery do wspólnej weryfikacji i przejść stanu. Wyłączenie dopiero po sprawdzeniu starych transakcji, linków i retry operatorów, bez usuwania historii.

### F8 — P2: historyczne karty `completed` nie trafiają do fallbacku finansów

- `src/lib/analytics/finance.ts:32` pobiera GiftCardOrder wyłącznie ze statusem `paid`.
- Aktywacja PayU `src/app/api/payu/notify/route.ts:283` oraz Stripe `src/app/api/webhooks/stripe/route.ts:96` zapisuje `completed`.

**Skutek ograniczony:** nowe wpłaty PayU obecne w PaymentLedger są liczone niezależnie i nie znikają z raportu przez ten filtr. Pomijane są historyczne/Stripe karty `completed`, które nie mają ledgeru. Bez analizy danych nie podajemy kwoty różnicy.

**Reuse:** wspólna semantyka settled status, jawna normalizacja historycznych danych i deduplikacja ledger/fallback. Nie zmieniać na ślepo wszystkich nazw statusów w bazie.

### F9 — P2: stara ścieżka karty ufa Origin jako adresowi powrotu z tokenem dostępu

- `src/app/api/gift-cards/checkout/route.ts:66–88` wstawia nagłówek Origin bez allowlisty do continueUrl zawierającego `access_token`.

**Skutek:** adres powrotu do karty nie jest ograniczony do właściwego serwisu. Nie dowiedziono możliwości pozyskania tokena dowolnego istniejącego zamówienia; problem dotyczy zamówienia utworzonego tym żądaniem.

**Reuse:** istniejący resolver `orderOrigin` z jawnym wyborem środowiska, zamiast zaufania dowolnemu nagłówkowi.

## Co już jest właściwie rozdzielone lub zabezpieczone

- Basket checkout jest publiczny celowo, ponieważ pozwala kupić jako gość. Sam brak logowania przy tworzeniu nowego zakupu nie jest podatnością. Problem F1 dotyczy wybranego istniejącego zasobu i niezweryfikowanej należności.
- Basket `:49–64` wymaga jednej pozycji; `:174–217` odczytuje aktualny CMS/Package i promocję, `:594–610` aktualną kartę, `:641–644` oblicza sumę po stronie serwera. Nie ufa `totalAmount` jako cenie.
- Rezerwacje mają blokadę terminu i zasobów promocyjnych (`basket/checkout:469–556`). Callback CART ma transakcyjne blokady rezerwacji (`payu/notify:130`) i wydania karty (`:253–259`), więc proste powtórzenie nie wydaje kolejnej karty w tej gałęzi.
- `api/packages/route.ts:15` używa wspólnego `findPricedPublicPackages`; zapisy admina są autoryzowane (`:31`). Nie ma powodu tworzyć kolejnego katalogu pakietów dla checkoutu.
- Produkty galerii korzystają ze wspólnego katalogu z jawnym wyjątkiem galerii (`merchandise-server:22–45`), odrębnej autoryzacji rodzica lub właściciela (`:50–67`) oraz serwerowej wyceny, weryfikacji zdjęć i expectedTotal (`:100–113`).
- Merchandise callback porównuje PLN, pełną kwotę i powiązany provider ID (`merchandise-payment:16`), chroni przejście płatności przez updateMany (`:19,37`), nie przywraca stanu paid po refundzie. Zwroty mają osobną deduplikację i blokadę (`merchandise-refund:12–34`).
- Wszystkie nowe PayU inicjatory używają biblioteki `createPayUOrder`. QA wymaga izolowanej bazy, jawnego sandboxa oraz callbacka na tym samym origin (`payu.ts:111–129`). To warto zachować.
- Dostęp do cyfrowych zdjęć, realizacja fizycznego produktu, rezerwacja terminu i saldo karty to różne uprawnienia. Wspólny navbar/koszyk nie uzasadnia łączenia ich w jeden rekord lub jedną fikcyjną płatność.

## Kolejność napraw i wymagane dowody

1. Zamknąć F1 w obu inicjatorach i handlerach; testy nieautoryzowanego ID, zaniżonej/nadmiarowej kwoty, waluty, niepasującego provider ID oraz poprawnej należności. Nie wdrażać samej zmiany UI.
2. Ujednolicić zakup karty z zachowaniem historycznego `GIFT_*`; test: CMS → zakup → podpisany callback → jedna aktywna karta → dostęp klienta → ponowienie callbacka.
3. Usunąć mutację z publicznego GET i utrwalić snapshot zakupu; test edycji admina między checkoutem a webhookiem.
4. Rozszerzyć trwałą idempotencję i uzgadnianie nieznanych płatności; testy timeout po stronie operatora, retry i dwóch równoległych żądań.
5. Ujednolicić ledger zwrotów i statusy historyczne; zweryfikować dwie częściowe refundacje, replay oraz brak podwójnego liczenia.
6. Dopiero po inwentaryzacji aktywnych historycznych callbacków wygasić ich stare implementacje, pozostawiając adaptery kompatybilności tam, gdzie są potrzebne.

Przed każdą zmianą wskazać istniejące źródło oferty, właściciela rekordu, handler płatności i ekran administratora. Nowy endpoint/stan/UI wymaga wykazania, dlaczego obecnego mechanizmu nie da się rozszerzyć. Koszt tego audytu: lokalna analiza i atrapowe testy; ROI nieustalone.
