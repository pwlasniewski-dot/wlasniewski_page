## Zapis widoczności produktu — 2026-09-14

Zgłoszony przez użytkownika nieaktywny zapis naprawiono w istniejącym edytorze: stan wszystkich kart jest wspólny, jeden PUT zapisuje produkty i ustawienia atomowo. Siedem nowych regresji obejmuje zapis i ponowny render klienta; transport bazy i logowanie podstawione. Build Node 22 PASS, 261/261 tras. TSC: 106 wcześniejszych diagnostyk, brak w zmienionych plikach. Nie jest to potwierdzenie odbioru live. Logowanie CLI nadal oczekuje autoryzacji użytkownika; zatwierdzone zmienne QA pozostają do podłączenia.

## Stan domknięcia 2026-09-14

Zgłoszenie ze zrzutu koszyka sprawdzono odczytowo: produkcyjne gallery_shop_26 ma lokalną dostawę 15/20 zł, a gallery_shop_default już 17/25 zł. Lokalna oferta zawiera wcześniejszy album komunijny. Na osobnej bazie QA obie konfiguracje mają 17/25 zł i wybór 6–9. Live preview API zwróciło 503 dla punktów w Płużnicy oraz brak tokenu mapy. Poprawiono komunikat API, aby nie odsyłał do niedostępnej mapy; sześć grup inpost-picker PASS. Nie naprawia to brakującego dostępu API InPost; jego rzeczywisty odbiór pozostaje otwarty.

Najnowszy krok: CLI Netlify jest zainstalowane i oczekuje na zakończenie natywnej autoryzacji konta. Poprawiono rozpoznawanie QA w Functions, które nie otrzymują automatycznie buildowego CONTEXT; do zatwierdzonego połączenia trzeba dodać niesekretny GALLERY_QA_CONTEXT=deploy-preview w identycznym zakresie gałęzi. Dwie regresje izolacji PASS. Zmienne i test zakupu nie są jeszcze wykonane. Instrukcja: [NETLIFY_ENV_SETUP.md](../NETLIFY_ENV_SETUP.md).

Zapisana konfiguracja osobnej bazy testowej: [NPHOTO_QA_CATALOG.json](NPHOTO_QA_CATALOG.json). Cztery produkty nPhoto są w niej aktywne: Harmonijka 41,54 zł, PRO 257,70 zł (20 stron), Lite 140,59 zł (16 stron), canvas 119,24 zł. Odbitki zachowują aktualne ceny użytkownika: 15×21 za 2,50 zł oraz 10×15 za 1,50 zł. Publiczna oferta wybiera pierwszy format i cztery produkty; panel galerii ma oba formaty. Dostawa: Paczkomat 17 zł, kurier 25 zł; canvas tylko kurier. Rzeczywiste zdjęcia pochodzą z folderu Media → nPhoto — produkty. Wcześniejszy [NPHOTO_LAUNCH_PRESET.json](NPHOTO_LAUNCH_PRESET.json) jest historyczną propozycją, nie konfiguracją do automatycznego nadpisania cen użytkownika.

Konfiguracja katalogu oraz publicznego POS PayU sandbox została zatwierdzona i wykonana wyłącznie na gałęzi Neon audit-admin-unification-20260914. Wykonanie wspólnego loadera, prezentacji React i wyceny na odczytanym snapshotcie zakończyło się PASS; nie utworzono zamówienia ani nie wywołano dostawców. Produkcyjny katalog pozostaje poza tą operacją.

Użytkownik zatwierdził także zapis połączenia tej bazy w Netlify helpful-axolotl-cc1cbb jako sekret GALLERY_QA_DATABASE_URL, wyłącznie dla fix/admin-unification-audit-20260914, zakresy Builds i Functions, z pustymi wartościami innych kontekstów. Nie trzeba ponawiać tej zgody. Zapis nie został jeszcze wykonany: po wznowieniu przeglądarka pokazała ekran logowania Netlify. Użytkownik następnie połączył integrację Netlify; połączenie zostało potwierdzone. Bieżąca sesja nie udostępniła jeszcze jej operacji, więc zapis nadal nie został wykonany. Bez zapisu, ponownego deployu preview i potwierdzenia izolacji nie wykonywać testowej płatności na istniejącym preview.

Pozostałe bramki: rzeczywista płatność sandbox i callback, zapis i odczyt jednego zamówienia w Rezerwacje → Zamówienia, konfiguracja testowego ShipX/Points/Geowidget i odbiór wysyłki, sesja właściwego klienta oraz iPhone/Safari. Nie potwierdzono pełnej integracji dostawców ani gotowości produkcyjnej. Poniższe starsze rundy są historią odbioru, a nie aktualnymi cenami lub statusem zgód.

# Kolekcja startowa nPhoto — odbiór do pilota

Aktualizacja: 2026-09-14. Bieżący odbiór dotyczy PR #75. Opis poniżej zawiera także wcześniejsze rundy; nie stanowi potwierdzenia pełnej gotowości produkcyjnej.

## Zakres

Jedno źródło cen i opisów: wspólne `GalleryProduct` oraz formaty z `gallery_shop_default`. Nowa prezentacja jest modułem obok istniejących kart podarunkowych i w koncie klienta. Nie migruje i nie usuwa wcześniejszego katalogu `NphotoAlbum`. Główna nawigacja nowej oferty prowadzi do wspólnej kolekcji; starszy import pozostaje opcjonalny.

| Propozycja | Edytowalny wariant startowy | Reguła projektu studia |
| --- | --- | --- |
| Odbitki | 15×21 cm, Fuji Silk, rzeczywiste 152×210 mm | Ilość osobno dla zdjęcia |
| Harmonijka | 8×8 cm, 12 stron, oprawa V6 | 12 zdjęć |
| Fotoalbum PRO | 20×20 cm, 10 rozkładówek, Fuji Silk, V11 | 20 zdjęć |
| Lite Album | 20×20 cm, 8 rozkładówek (16 stron), Fuji Lustre, A30 | 16 zdjęć |
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

`npm run test:gallery-shop`: **115 grup/testów PASS**: dotychczasowe 74, import kolekcji 16, publiczne API/CMS 9, storefront 16. Niezależny odbiór QA potwierdził wcześniejsze 112 oraz ponownie 41 grup dotyczących nowej oferty po poprawce routingu. Trzy nowe regresje rozwiązują prawdziwe przekierowania Next.js i renderują docelową stronę sklepu wraz z kartami oraz pięcioma ofertami; sprawdzają także opóźnienie i błąd serwisu kart. Testy używają rzeczywistych komponentów React i tras, z podstawioną bazą oraz zewnętrznym transportem. Nie tworzą płatnych przesyłek, zamówień nPhoto ani rzeczywistych płatności.

Rundy: (1) admin zapis–odczyt–render i wspólna cena; (2) edycje koszyka, powtórny import, odzyskanie po odświeżeniu; (3) ukrycie/ponowna dostępność, zmiana ceny, rozdzielenie galerii i powrót płatności. Dodatkowo wybór dokładnie jednego zdjęcia canvas, zastąpienie zdjęcia, zgodność dostawy i blokada nieobsługiwanego koszyka.

Build Next.js w Node 22 zakończony powodzeniem. Lokalnie brak `DATABASE_URL`: prerender korzysta z dotychczasowych fallbacków, więc build nie potwierdza integracji z rzeczywistą bazą. Pełne `tsc` ma istniejące błędy projektu; diagnostyki zmienionych plików są sprawdzane osobno. Przegląd niezależnego agenta QA uzupełnia testy wykonawców.

## Przed testem z klientką i produkcją

### Sprawdzenie rzeczywistego Deploy Preview

W zalogowanym panelu administratora wykonano zbiorczy import: zapisano cztery nieaktywne produkty oraz nieaktywny format 15×21, bez cen sprzedaży i bez kopiowania zdjęć producenta. Następnie wybrano wyłącznie te pięć pozycji do przyszłej prezentacji publicznej; zapis i ponowny odczyt ustawień zakończyły się komunikatem sukcesu. Wspólny sklep i prezentacja publiczna pozostają wyłączone. Wcześniejsze produkty i lokalne ustawienia galerii nie zostały zmienione.

Test w przeglądarce ujawnił przekierowanie `/sklep` i `/sklep-karty-podarunkowe` do `/karta-podarunkowa`. Moduł oferty podpięto do tej rzeczywistej strony docelowej, między zachowanymi kartami podarunkowymi a instrukcją ich zakupu. Link podglądu administratora i adresy Offer wskazują docelową trasę. Regresje obejmują teraz faktyczne przekierowania i render strony, nie tylko pojedynczy komponent.

Sprawdzono otwarcie zakupów w istniejącej galerii testowej i zachowanie jej wcześniejszych formatów/cen. Dwie odbitki 15×21 po dotychczasowe 2,50 zł dały 5,00 zł; z kurierem 20,00 zł suma wyniosła 25,00 zł, a po przełączeniu na Paczkomat 15,00 zł — 20,00 zł. Testową pozycję usunięto z koszyka (z dostępnym cofnięciem); końcowy koszyk jest pusty. Nie wysłano formularza płatności. Nie jest to jeszcze test konta właściwej klientki ani opłaconego zamówienia nowych produktów.

### Pozostałe bramki pilota

1. Zatwierdzić konkretne warianty i ceny sprzedaży pięciu propozycji, koszt kuriera oraz Paczkomatu; 0 nie jest ceną sprzedaży.
2. Dodać właściwe zdjęcia produktów (własne albo z uprawnieniem), sprawdzić opisy, aktywować wybrane pozycje.
3. Zatwierdzić i włączyć wspólną ofertę oraz wybrać jej publiczną prezentację. Nie publikować wcześniejszych testowych produktów przypadkiem.
4. Wskazać właściwą galerię klientki. Jeśli ma lokalny cennik, świadomie ustalić jego zachowanie lub powrót do standardu.
5. Na iPhonie klientki sprawdzić prawdziwą sesję klienta, wybór zdjęć, koszyk, dostawę i uzgodniony test płatności. Sesja administratora nie dowodzi izolacji roli klienta.
6. Zweryfikować na koncie nPhoto dostępność i koszt wariantów oraz pliki produkcyjne. Istniejący eksport zamówienia pomaga przygotować realizację; produkcję zleca fotograf w nPhoto. Nie ma potwierdzonego API automatycznego zamawiania u producenta.

Realny test płatności/etykiety InPost, prawa do zdjęć, zatwierdzenie cen i produkcja nPhoto nie są zaliczone przez lokalne testy. Nie ogłaszać gotowości produkcyjnej bez tych decyzji i testu pilota.
