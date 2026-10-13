# Audyt spójności serwisu - 8.10.2026

Stan: draft, niegotowy do produkcji. Przegląd dotyczy przepływów sklepu, galerii, konta, administracji i płatności. Nie jest potwierdzeniem sprawdzenia każdej trasy serwisu. Wymagania nadrzędne: [specyfikacja spójności](SPECYFIKACJA_SPOJNOSCI_SERWISU.md).

## Mapa integracji koszyka

- Wejścia: `GuestProductPreview`, `ProductPersonalizationPage`, `GalleryShoppingPanel`.
- Wspólny stan: `src/context/CartContext.tsx`; panel `src/components/BasketDrawer.tsx`; kasa `src/app/checkout/page.tsx`.
- Kasa zdjęć: `PhotoCartCheckout` adaptuje istniejący `GalleryShoppingPanel`, nie tworzy odrębnego magazynu pozycji. Dawny sessionStorage galerii jest migrowany do wspólnego stanu.
- Zamówienia: istniejący `src/lib/galleries/merchandise-server.ts`, zapis PhotoOrder, istniejąca obsługa płatności i realizacji. Nie dodano tabel ani endpointów.
- Klient: `/api/account/orders`; administrator: `/api/admin/orders` i `/api/admin/gallery-shop/orders`.
- Zakres tej integracji: wspólny koszyk i wybór grupy zamówienia. Poszczególne grupy nadal wymagają oddzielnej płatności. Nie jest to wdrożenie jednej transakcji PayU dla wszystkich typów zakupów.

## Potwierdzone problemy poza integracją koszyka

| Priorytet | Problem | Stan |
| --- | --- | --- |
| P0 | Starsze endpointy płatności przyjmują kwotę i identyfikatory z przeglądarki; część callbacków nie uzgadnia należności. | Blokada odbioru produkcyjnego; szczegóły w audycie płatności. |
| P1 | `/api/user/me` zwraca surowe zamówienia zamiast projekcji klienta i kontroli właściciela konkretnego zakupu. | Do naprawy; potwierdzona ścieżka serializacji, bez odczytu prywatnych danych. |
| P1 | GET `/api/gift-cards/shop` wykonuje upsert stałych szablonów oferty. | Odczyt może nadpisywać CMS; przenieść inicjalizację do jawnej migracji/seeda. |
| P1 | Starszy checkout karty i callback nie mają spójnego identyfikatora GIFT. | Wymaga naprawy oraz testu aktywacji po płatności. |
| P2 | Koszyk nie rozdziela kont po wylogowaniu. | Metadane mogą pozostać na wspólnym urządzeniu; nie dowodzi to dostępu do prywatnego pliku. |
| P2 | Statusy historii i techniczne galerie uploadu są prezentowane niespójnie. | Ujednolicić istniejące widoki konta. |
| P2 | Starszy checkout booking/gift usuwa wybraną grupę już przed przekierowaniem do operatora. | Zachowano istniejące zachowanie, ograniczając usunięcie do tej grupy; nie spełnia jeszcze normy zachowania zakupów po anulowaniu płatności. |

Szczegółowe dowody: [klient i administrator](audit-client-admin-2026-10-08.md), [płatności](audit-payments-2026-10-08.md).

## Dowody i ograniczenia

- Commit `e5ecbcf0c861c98d91387c9ab0646d5e2ff4454a`, Deploy Preview PR99: rzeczywiste API uploadu, prywatności staging i podglądu oraz odczytu kart sprawdzone. Brak transakcji płatnej i zmian produkcyjnych.
- Zmiany wspólnego koszyka: lokalny pełny `test:prodigi-personalization` PASS, w tym realne komponenty React/JSDOM i nowe testy globalnego koszyka oraz centralnego checkout. Usługi/płatność w tych testach są atrapami.
- Lokalny runtime Node 24.19.0; repo deklaruje Node 22. Sam lokalny PASS nie potwierdza builda Netlify.
- Próba pełnego typecheck zakończyła się brakiem pamięci. Nie traktować jej jako PASS.
- Nie potwierdzono całego zakupu od płatności do produkcji, e-maila i doręczenia; nie ogłaszać pełnej gotowości.

## Kolejność odblokowania

1. Naprawić serwerowe wyceny i autoryzację wszystkich czynnych ścieżek płatności oraz uzgadnianie callbacków.
2. Ujednolicić odczyt zamówień klienta, odseparować dane koszyka między kontami, usunąć zapisy z GET oferty.
3. Dokończyć spójność statusów, galerii technicznych i powrotu anulowanej płatności booking/gift.
4. Przeprowadzić rzeczywisty test sandbox całego procesu i odbiór klient/admin. Dopiero potem rozważać produkcję.
