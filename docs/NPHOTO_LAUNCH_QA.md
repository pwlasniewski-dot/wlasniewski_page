# Kolekcja startowa nPhoto — odbiór do pilota

Data: 2026-09-13. PR #72 pozostaje wersją do testów; bez scalania i wdrożenia na produkcję.

## Zakres

Jedno źródło cen i opisów: wspólne `GalleryProduct` oraz formaty z `gallery_shop_default`. Nowa prezentacja jest modułem obok istniejących kart podarunkowych i w koncie klienta. Nie migruje i nie usuwa wcześniejszego katalogu `NphotoAlbum`. Główna nawigacja nowej oferty prowadzi do wspólnej kolekcji; starszy import pozostaje opcjonalny.

| Propozycja | Edytowalny wariant startowy | Reguła projektu studia |
| --- | --- | --- |
| Odbitki | 15×21 cm, Fuji Silk, rzeczywiste 152×210 mm | Ilość osobno dla zdjęcia |
| Harmonijka | 8×8 cm, 12 stron, oprawa V6 | 12 zdjęć |
| Fotoalbum PRO | 20×20 cm, 10 rozkładówek, Fuji Silk, V11 | 20 zdjęć |
| Lite Album | 20×20 cm, 5 rozkładówek, Fuji Lustre, A30 | 10 zdjęć |
| Fotoobraz Wall Decor | Canvas 40×60 cm, rama 2 cm | 1 zdjęcie; tylko kurier |

Liczby zdjęć są propozycjami układu studia, nie ograniczeniami nPhoto. Klient kupuje konkretny opisany wariant, wybiera fotografie i liczbę egzemplarzy. Fotograf przygotowuje projekt. Nie jest to wizualizacja 3D ani samodzielny edytor rozkładówek klienta.

Źródła producenta: [odbitki](https://nphoto.com/pl/odbitki-i-wydruki/odbitki), [harmonijka](https://nphoto.com/pl/harmonijka), [PRO](https://nphoto.com/pl/fotoalbumy/fotoalbum-pro), [Lite Album](https://nphoto.com/pl/fotoalbumy/lite-album), [fotoobraz](https://nphoto.com/pl/wall-decor/fotoobraz). Materiały marketingowe: [makiety nPhoto](https://nphoto.com/pl/strefa-klienta/zdjecia-do-pobrania). Makiety akrylu lub alu-dibondu nie zastępują fotografii canvas.

## Zabezpieczenia i publikacja

- Zbiorczy import tworzy cztery produkty oraz jeden format, zawsze nieaktywne, z ceną 0. Nie włącza wspólnego sklepu ani prezentacji publicznej.
- Bez potwierdzenia praw import zapisuje szkice bez zdjęć. Zaznaczenie opcji mediów jest decyzją administratora. Można dodać własne fotografie.
- Ponowny import zachowuje ceny, opisy, zdjęcia, reguły i widoczność. Rozpoznaje istniejący produkt po znaczniku lub kanonicznym adresie producenta.
- Nieprawidłowe istniejące ustawienia blokują import; transakcja Serializable zapobiega częściowemu zapisowi.
- Publiczne API zwraca wyłącznie wybrane, aktywne, wycenione produkty wspólne. Nie zwraca galerii, zdjęć klienta, zamówień ani identyfikatorów dostawcy.
- Produkty bez zgodnego sposobu dostawy nie są oferowane. Ograniczenie kurier-only obowiązuje też przy lokalnej zmianie liczby zdjęć. Serwer ponownie sprawdza dostawę dla całego koszyka.
- Galeria ze swoim wcześniejszym cennikiem zachowuje wyjątek. Nowe galerie bez wyjątku dziedziczą standard. Niedostępny format z publicznego linku jest wyjaśniony klientowi, nie zamieniany po cichu.
- Przejście przez logowanie zachowuje wyłącznie prawidłowy identyfikator produktu/formatu. Brak dowolnych przekierowań, automatycznego dodawania do koszyka lub rozpoczynania płatności. Powrót PayU ma pierwszeństwo.

## CMS i analityka

Tytuł, opis, CTA, komunikat braku galerii, zdjęcie odbitek i jego alt, układ, wybór produktów i kolejność są edytowalne w `Oferta galerii`. Nazwy, opisy, media i ceny produktów pozostają na wspólnych kartach. Podglądy używają pełnego zdjęcia bez przycinania na telefonie i komputerze. Dane ItemList/Offer są generowane z tego samego katalogu; istniejące metadane i canonical strony kart nie są zmieniane przez ten moduł.

Publiczne CTA używają istniejącej analityki kliknięć po zgodzie użytkownika. W koncie wywołują istniejące autoryzowane zdarzenia operacyjne `offer_open` i `gallery_open`. Dane zdjęć i kody dostępu nie trafiają do tych zdarzeń. Zamówienia końcowe zapisuje istniejący moduł zakupów. Nie dodano marketingowego śledzenia prywatnych galerii ani pełnej międzystronicowej atrybucji sprzedaży.

## Testy lokalne

`npm run test:gallery-shop`: **112 grup/testów PASS**, także w niezależnym odbiorze QA: dotychczasowe 74, import kolekcji 16, publiczne API/CMS 9, storefront 13. Testy używają rzeczywistych komponentów React i tras, z podstawioną bazą oraz zewnętrznym transportem. Nie tworzą płatnych przesyłek, zamówień nPhoto ani rzeczywistych płatności.

Rundy: (1) admin zapis–odczyt–render i wspólna cena; (2) edycje koszyka, powtórny import, odzyskanie po odświeżeniu; (3) ukrycie/ponowna dostępność, zmiana ceny, rozdzielenie galerii i powrót płatności. Dodatkowo wybór dokładnie jednego zdjęcia canvas, zastąpienie zdjęcia, zgodność dostawy i blokada nieobsługiwanego koszyka.

Build Next.js w Node 22 zakończony powodzeniem. Lokalnie brak `DATABASE_URL`: prerender korzysta z dotychczasowych fallbacków, więc build nie potwierdza integracji z rzeczywistą bazą. Pełne `tsc` ma istniejące błędy projektu; diagnostyki zmienionych plików są sprawdzane osobno. Przegląd niezależnego agenta QA uzupełnia testy wykonawców.

## Przed testem z klientką i produkcją

1. Zatwierdzić konkretne warianty i ceny sprzedaży pięciu propozycji, koszt kuriera oraz Paczkomatu; 0 nie jest ceną sprzedaży.
2. Dodać właściwe zdjęcia produktów (własne albo z uprawnieniem), sprawdzić opisy, aktywować wybrane pozycje.
3. Zatwierdzić i włączyć wspólną ofertę oraz wybrać jej publiczną prezentację. Nie publikować wcześniejszych testowych produktów przypadkiem.
4. Wskazać właściwą galerię klientki. Jeśli ma lokalny cennik, świadomie ustalić jego zachowanie lub powrót do standardu.
5. Na iPhonie klientki sprawdzić prawdziwą sesję klienta, wybór zdjęć, koszyk, dostawę i uzgodniony test płatności. Sesja administratora nie dowodzi izolacji roli klienta.
6. Zweryfikować na koncie nPhoto dostępność i koszt wariantów oraz pliki produkcyjne. Istniejący eksport zamówienia pomaga przygotować realizację; produkcję zleca fotograf w nPhoto. Nie ma potwierdzonego API automatycznego zamawiania u producenta.

Realny test płatności/etykiety InPost, prawa do zdjęć, zatwierdzenie cen i produkcja nPhoto nie są zaliczone przez lokalne testy. Nie ogłaszać gotowości produkcyjnej bez tych decyzji i testu pilota.
