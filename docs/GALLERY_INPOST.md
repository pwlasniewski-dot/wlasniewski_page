# InPost ShipX — realizacja zamówień galerii

Panel przy opłaconym zamówieniu obsługuje rzeczywiste wywołania ShipX: utworzenie/opłacenie przesyłki, odświeżenie statusu, PDF etykiety, ograniczone anulowanie oraz zlecenie odbioru kuriera. Nie wykonano realnej transakcji podczas implementacji.

## Konfiguracja serwera

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
