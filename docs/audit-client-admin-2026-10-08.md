# Audyt klient / administrator — 2026-10-08

Zakres: statyczny przegląd aktualnego working tree oraz lokalne testy DOM globalnego koszyka. Bez logowania na produkcji, wywołań usług i zapisów danych klientów. P1 oznacza problem wymagający usunięcia przed wydaniem; P2 — niespójność widoczności lub obsługi. Nie jest to pełny audyt bezpieczeństwa wszystkich tras.

## Potwierdzone ustalenia

| Priorytet | Dowód w kodzie | Skutek i zalecenie |
| --- | --- | --- |
| P1 | `src/app/api/user/me/route.ts:94` pobiera pełne rekordy PhotoOrder według właściciela galerii; `:146` zwraca je jako `photo_orders`. | Starszy endpoint omija projekcję `customerShopMetadata` i weryfikację `ownsAccountOrder` z nowego endpointu konta. `product_ids` może zawierać wewnętrzne Prodigi prepared proofs, klucze obiektów, koszt i provider state. Brakuje też zawężenia `participant_id: null` oraz właściciela konkretnego zamówienia. Zastosować jawny DTO i odpowiednią kontrolę właściciela; dla historii starszych zakupów zwracać tylko używane pola. Potwierdzenie dotyczy ścieżki serializacji; nie odczytywano rzeczywistych danych. |
| P2 | `src/components/client/AccountPage.tsx:1203`–`:1207` mapuje wszystkie statusy inne niż `paid` na „Oczekuje”. | Anulowane i zwrócone zamówienia w „Historii Zakupów Zdjęć” wyglądają na oczekujące, podczas gdy „Moje zamówienia” używa wspólnego `paymentLabel`. Użyć tego samego słownika statusów. |
| P2 | `src/context/AuthContext.tsx:31`–`:37`, `:95`–`:103` czyści sesję użytkownika, lecz nie koszyk; `src/context/CartContext.tsx:106` ładuje jeden `shopping_cart` niezależnie od konta. | Po wylogowaniu/zmianie konta na wspólnym urządzeniu pozostają tytuły, identyfikatory zdjęć, endpointy i metadata poprzedniego koszyka. To nie dowodzi dostępu do prywatnych plików — backend nadal weryfikuje właściciela. Potrzebna świadoma polityka: separacja koszyka właściciela, jawna migracja gościa oraz usuwanie danych prywatnych przy logout. |
| P2 | `src/app/api/galleries/client/route.ts:35`–`:45` nie wyklucza `SHOP_UPLOAD`; `src/lib/galleries/shop-uploads.ts:32` tworzy aktywną galerię INDIVIDUAL; `src/components/client/AccountPage.tsx:791` i `:844` kieruje ją do standardowej galerii „Wybierz i zapłać za zdjęcia”. | Własne zdjęcia do produktów trafiają do listy sesyjnych galerii i standardowego komunikatu zakupu. Rozdzielić etykietę/link personalizacji albo wyłączyć techniczne galerie z listy sesji. Potwierdzony brak rozróżnienia w kodzie; wyglądu rzeczywistego konta nie sprawdzano. |

## Rozdzielenia poprawne i celowe

- `/api/account/orders` (`src/app/api/account/orders/route.ts:18`) ogranicza zakupy do indywidualnej galerii właściciela, następnie `ownsAccountOrder`, a odpowiedź przepuszcza przez `customerShopMetadata`. Zamówienia gościa nie są przywłaszczane przez zgodność adresu dostawy (`src/lib/galleries/order-account.ts:14`).
- `SHOP_UPLOAD` wymaga aktywnego właściciela konta; `SHOP_UPLOAD_GUEST` sprawdza capability gościa (`src/lib/galleries/individual-access.ts:42`). Zwykłe hasło galerii nie zastępuje tych uprawnień.
- Administrator potrzebuje pełnych metadanych realizacji w `/api/admin/gallery-shop/orders`, chronionym `withAuth`. Unified orders rozpoznaje `gallery_merchandise` przed historycznym parserem (`src/app/api/admin/orders/route.ts:290`) i używa zapisanych cen/ilości.
- Nowy klient konta pokazuje zakupy produktów w „Moje zamówienia”; rezerwacje, vouchery i starsze zakupy zdjęć mają istniejące osobne moduły. Wspólny koszyk nie oznacza jednej transakcji wszystkich rodzajów.
- `/logowanie` przyjmuje bezpieczne `returnTo`; przekierowanie zamówienia z konta zachowuje identyfikator (`src/components/client/AccountPage.tsx:64`, `src/app/logowanie/page.tsx:12`). Nie stwierdzono w sprawdzanych komponentach personalizacji starego `?redirect=`.

## Aktualna weryfikacja globalnego koszyka

Lokalnie PASS, rzeczywiste React/CartProvider/BasketDrawer/CheckoutPage, sieć i płatność symulowane:

1. `tests/prodigi-full-global-cart.cjs`: upload → produkt → wspólny licznik/drawer/localStorage; ilość i reload; zachowanie booking/gift oraz innych endpointów; progi cen odbitek po zmianie ilości, reloadzie i usunięciu.
2. `tests/prodigi-full-guest-global-cart.cjs`: modal gościa zamyka się po pojedynczym uploadzie/dodaniu; globalny drawer obsługuje ilość i usunięcie.
3. `tests/prodigi-guest-retained-file.cjs`: oryginalne bajty, otwarcie kolejnego produktu, odrzucenie za małego zamiennika bez utraty koszyka, zachowanie nowego zdjęcia, centralny checkout po statusie paid i obie orientacje wymiarów użytkownika.
4. `tests/qa/gallery-shop-rounds.cjs`: dotychczasowe trzy rundy oraz scenariusze zwrotu z płatności przechodzą po zmianie resetu fixture na czyszczenie również globalnego storage.

Testy nie dowodzą rzeczywistego logowania dwóch kont, prywatnego S3, autoryzacji PostgreSQL ani płatności PayU. Runtime lokalny Node 24.19.0. Wykryty w trakcie QA błąd nieaktualnej ceny progowej w drawerze został poprawiony przez właściciela CartContext i ma niezależny test regresji.
