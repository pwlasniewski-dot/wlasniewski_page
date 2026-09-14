# InPost ShipX — realizacja zamówień galerii

Panel przy opłaconym zamówieniu obsługuje rzeczywiste wywołania ShipX: utworzenie/opłacenie przesyłki, odświeżenie statusu, PDF etykiety, ograniczone anulowanie oraz zlecenie odbioru kuriera. Nie wykonano realnej transakcji podczas implementacji.

## Konfiguracja serwera

- `INPOST_POINTS_TOKEN`: opcjonalny osobny token Points; domyślnie adapter używa INPOST_API_TOKEN z uprawnieniem API Points.
- `INPOST_GEOWIDGET_TOKEN`: publiczny token mapy ograniczony do domen; wspierana również istniejąca nazwa NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN. Token ShipX nigdy nie jest zamiennikiem tokenu mapy.
- `INPOST_API_TOKEN`: token odpowiedniego środowiska, wyłącznie po stronie serwera.
- `INPOST_ORGANIZATION_ID`: ID organizacji ShipX.
- `INPOST_ENVIRONMENT`: `sandbox` (domyślnie) lub `production`.
- `INPOST_COURIER_SERVICE`: `inpost_courier_c2c` (domyślnie, prepaid) lub `inpost_courier_standard` (odpowiednia umowa).
- `INPOST_SENDER_JSON`: opcjonalny nadawca; wymagany dla zamówienia odbioru kuriera. Bez niego dane nadawcy przesyłki bierze ShipX z konta organizacji.

Przykład formatu danych nadawcy (wartości przykładowe, zastąpić rzeczywistymi):

```json
{"company_name":"Nazwa nadawcy","email":"nadawca@example.com","phone":"501222333","address":{"street":"Testowa","building_number":"1","city":"Toruń","post_code":"87-100","country_code":"PL"}}
```

Panel pokazuje brakujące nazwy zmiennych, nigdy token. Dla obu środowisk wymagane są odrębne dane konta. Zmiana środowiska lub organizacji blokuje operacje na już zapisanej przesyłce z innego konta.

## Bezpieczeństwo nadania

Autoryzowany administrator, opłacone zamówienie, zgodne `gallery_id`. Jedno nadanie na zamówienie. Unikalny `Setting.gallery_shipment_${orderId}` powstaje przed POST do InPost. Zapis jest trwały, nie ma automatycznego ponawiania ani usuwania blokady po timeout. Aktualizacje używają compare-and-set, nie modyfikują metadata realizacji zamówienia.

Niepewna odpowiedź wymaga sprawdzenia w ShipX według `gallery-${galleryId}-order-${orderId}`. Można przypiąć istniejące ID przesyłki; API sprawdza dokładną zgodność numeru referencyjnego. Brak znalezionej przesyłki wymaga ręcznego wyjaśnienia przez obsługę — aplikacja nie zakłada, że operacja finansowa nie zaszła. Po anulowaniu także nie powstaje automatycznie kolejne nadanie.

Uproszczone utworzenie w ShipX kupuje usługę asynchronicznie. Panel wymaga potwierdzenia kosztu zgodnego z kontem InPost. Zakup etykiety nie zamawia odbioru kuriera: to osobna operacja z osobnym potwierdzeniem i trwałą blokadą przed duplikatem. Niepewny odbiór wymaga sprawdzenia w ShipX. Ceny usług InPost nie są tym samym co opłata dostawy pobrana od klienta.

## Ograniczenia i odbiór

Obsługiwane paczki: Paczkomat A/B/C i standardowy kurier, maks. 25 kg. Nie obsługujemy niestandardowych paczek, wielu paczek jednego zamówienia, COD ani automatycznych zwrotów. Status odświeża administrator, webhook nie jest podłączony. Ręczne etapy realizacji pozostają osobną funkcją.

Przed uruchomieniem produkcji wykonać zatwierdzoną próbę sandbox: autoryzacja, nadanie, asynchroniczne potwierdzenie, PDF, status, zlecenie odbioru. Następnie sprawdzić poprawność danych i umowy produkcyjnej. Testy `node tests/qa/gallery-shipment-server.cjs`: 9 grup, rzeczywiste handlery i adapter, baza oraz transport mockowane, brak realnych opłat.

## Oficjalne źródła

- [Uproszczone tworzenie przesyłki](https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/18153501)
- [Etykieta przesyłki](https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/18153509)
- [Anulowanie przesyłki](https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/18153504)
- [Dispatch Order — odbiór kuriera](https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/18153482)
- [Proces integracji](https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/47415642)
- [FAQ i środowisko sandbox](https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/53706753)

## Sprawdzenie bez opłat — 2026-09-14

Wspólna oferta → Dostawa → Sprawdź połączenia wykonuje autoryzowany GET organizacji i odczytuje jej listę usług, odpytuje API Points oraz loguje testowo OAuth PayU bez tworzenia zamówienia. Zapisany token mapy jest oznaczony jako skonfigurowany; jego ograniczenia domenowe wymagają osobnego sprawdzenia mapy w koszyku. Ready nie oznacza zakończonego testu etykiety.

Wyszukiwanie i sprawdzenie punktu używają obecnych adresów api.inpost.pl/v1/points oraz sandbox-api-gateway-pl.easypack24.net/v1/points. Autoryzacja jest wyłącznie serwerowa, przekierowania odrzucane, odpowiedź dla klienta ograniczona do danych punktu. Błędny, zamknięty lub niedostępny punkt blokuje rozpoczęcie płatności. Oficjalne źródła: [API Points](https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/18153470), [Organizacja i usługi](https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/18153487/Organization), [sandbox PayU](https://developers.payu.com/europe/docs/testing/sandbox/).
