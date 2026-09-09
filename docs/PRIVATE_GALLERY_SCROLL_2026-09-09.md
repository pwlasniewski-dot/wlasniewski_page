# Stabilizacja prywatnej galerii i favicon — 2026-09-09

Właściciel przekazał 25-sekundowe nagranie pionowego przewijania prywatnej galerii w przeglądarce Messengera na iPhonie. Skoki występują w siatce zdjęć oraz przy górnym sliderze, gdy paski aplikacji pojawiają się i chowają. Nagranie nie przedstawia gestów w lightboxie. Następnie właściciel zamówił favicon: po korekcie biała litera W na czarnym tle.

## Zmiana galerii

- Siatki indywidualne i grupowe rezerwują miejsce dla zdjęć według istniejących metadanych width/height przed lazy loading. Explicit CSS aspect-ratio nie zmienia się po odczytaniu wymiarów pliku. Brak/nieprawidłowe metadane mają stałą ramkę 3:2 z object-contain: pełne zdjęcie pozostaje widoczne, przy pionowym kadrze bez metadanych pojawią się boczne marginesy.
- Hero na telefonie zachowuje swój pierwotny, zmierzony wymiar w pikselach. Zmiana samej wysokości WebView nie zmienia wysokości treści nad aktualnie oglądanym zdjęciem. Pomiar jest ponawiany przy zmianie szerokości, w tym obrocie; desktop korzysta z dotychczasowego 90vh/min600.
- Nie ma przechwytywania gestów ani programowego ustawiania scrollY. Autoplay, lightbox, źródła zdjęć, autoryzacja, wybory, płatności, pobieranie i dane klientów zachowują dotychczasowe działanie. Żadne nagrania ani prywatne zdjęcia nie są publikowane w repozytorium.

Podstawa techniczna: [rezerwacja wymiarów lazy images](https://web.dev/articles/browser-level-image-lazy-loading), [jednostki viewport przy zmianach wielkości okna](https://web.dev/blog/viewport-units). Film wskazuje korelację skoków z paskami Messengera; nie deklarujemy pomiaru wewnętrznego API tej aplikacji.

## Favicon

Biała W jest obrysem istniejącego fontu Playfair Display (700) na czarnym kwadracie; SVG nie pobiera fontów. Przygotowano SVG, ICO 16/32/48/64/128/256, PNG 192/512 i Apple Touch 180. Metadata i manifest używają wersjonowanych adresów, aby odświeżyć poprzednią ikonę w pamięci przeglądarki. Oddzielne zasoby Aero Analiza nie są zmieniane.

## Weryfikacja

- Niezależny QA zaakceptował poprawkę galerii; 7/7 testów (3 geometria/resize oraz 4 bezpieczeństwo źródeł podglądu), uruchomione również przez QA.
- Scenariusze: zdjęcie pionowe/poziome/brak wymiarów, zmiany samej wysokości okna podczas przewijania, zmiana szerokości, przejście na desktop i cleanup.
- Typecheck: 126 istniejących diagnostyk poza zmienionym zakresem. Istniejący test group-gallery-operating-model oczekuje dosłownego pg_advisory_xact_lock, choć nietknięty endpoint używa helpera; nie zmieniano tego testu ani endpointu.
- Obraz favicon sprawdzono wizualnie, formaty i rozmiary odczytano z plików. Build dokładnego commita i publikacja są potwierdzane przez Netlify; wynik końcowy trafia do opisu PR.
- Nie wykonano ponownego testu na fizycznym iPhonie ani w prywatnym koncie klienta. Testy nie składają zamówień i nie zmieniają wyborów klientów.

Brak migracji i nowych usług. Cofnięcie: revert tej zmiany.
