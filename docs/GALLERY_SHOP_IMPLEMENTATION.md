## Aktualny proces — 2026-09-14

Oferta, produkty, ceny ilościowe i dostawa są wspólne. Zbiorcza publikacja przygotowanych produktów odbywa się w obecnym /admin/gallery-shop. Opis wcześniejszej konfiguracji per galeria poniżej dotyczy jawnych wyjątków; nowej osobie nie trzeba tworzyć kolejnego cennika. Wspólny podgląd używa realnych zdjęć, filmu i przykładów wnętrza. Wszystkie zamówienia i wysyłkę obsługuje istniejący widok Rezerwacje → Zamówienia.

# Sklep prywatnej galerii — implementacja robocza

Status: gałąź wdrożeniowa, nie potwierdzenie gotowości produkcyjnej.

## Zakres

- Dotychczasowe oglądanie galerii pozostaje punktem wejścia; zakupy mają osobny panel.
- Odbitki: zaznaczanie wielu zdjęć, wspólne nadanie formatu i ilości, edycja pojedynczego kadru, zmiany i usuwanie pozycji koszyka.
- Produkty: lokalny katalog nPhoto, prywatne przypisanie produktu do galerii z ceną ustaloną przez Foto-Dron; wybrane zdjęcia i okładka zapisują się z zamówieniem.
- Backend wylicza kwoty z aktualnego katalogu w groszach, sprawdza uprawnienia do zdjęć oraz zapisuje niezmienny snapshot konfiguracji zamówienia fizycznego.
- Admin: ceny i formaty, papier, treści wejścia do zakupów, widoczność, limity liczby zdjęć produktów, metody i ceny dostawy, zamówienia z miniaturami i konfiguracją.
- Realizacja fizyczna: nPhoto → Foto-Dron → kontrola i pakowanie → klient. Prodigi pozostaje odrębną przyszłą ścieżką.

## Konfiguracja przez administratora

1. Otwórz edytor konkretnej galerii i sekcję „Sklep prywatnej galerii”. Nowa konfiguracja jest domyślnie wyłączona; brak przykładowych aktywnych cen.
2. Uzupełnij nagłówek, opis i tekst przycisku. Dodaj rzeczywiste formaty odbitek: nazwa, wymiary w mm, papier, cena za sztukę w PLN oraz aktywność.
3. Ustaw co najmniej jedną dostępną metodę dostawy i jej cenę. Włącz sklep oraz „Zapisz ustawienia sklepu”. Panel wykonuje zapis i ponowny odczyt.
4. Wybierz produkt z lokalnego katalogu nPhoto i nadaj własną cenę sprzedaży. Dodanie przypisuje produkt tylko do tej galerii. Aktualizacja prywatnej oferty nie zmienia źródłowego katalogu.
5. Nazwę, opis, adres zdjęcia, cenę i widoczność produktu zatwierdza „Zapisz produkt”. Limity zdjęć zatwierdza „Zapisz ustawienia sklepu”; reguła domyślna wynosi 1–50 zdjęć.
6. W Rezerwacje → Zamówienia sprawdź pozycje, konfiguracje, zdjęcia, kwoty i odbiorcę. Płatność jest wyłącznie do odczytu. Dopiero zamówienie opłacone pozwala zapisać obecny lub następny etap realizacji.
7. Po samodzielnym nadaniu przesyłki zapisz numer śledzenia. Nie można oznaczyć wysyłki bez numeru przesyłki.

## Pozostałe bramki przed produkcją

- Niezależne QA obejmuje trzy rundy: zamawianie, usuwanie/anulowanie pozycji, wyjście i powrót, dodawanie produktów, zmiany ilości, ponowne dodanie; także zapis–odczyt konfiguracji admina i render klienta. Wynik należy odczytać z raportu QA, a nie z tego opisu.
- Nie wykonano w ramach tej dokumentacji rzeczywistych płatności ani realizacji zamówień. Przed produkcją potrzebny jest osobny test środowiska płatności i wiarygodnego potwierdzenia statusu `paid`.
- Adapter InPost, mapowy wybór punktu, kontrola punktu przed płatnością oraz etykiety są zaimplementowane. Pełny odbiór z rzeczywistym API nadal pozostaje bramką; webhook śledzenia nie jest podłączony.
- Zewnętrzny importer/API nPhoto nie jest podłączony. Lista produktów pochodzi z istniejącego lokalnego katalogu. Produkcję zamawia właściciel.
- Należy zweryfikować działanie na Safari iPhone i komputerze, szerokość panelu administracyjnego, dostępność oraz stabilność istniejącej galerii Historia/Siatka.
- Pozostałe wymagania CMS z AGENTS.md wymagają audytu przed produkcją: kolejność i komplet mediów/modułów, kontrolowane warianty wyglądu, treści marketingowe, analityka lejka. Ta zmiana nie dodaje dowolnego edytora CSS ani nie deklaruje spełnienia wszystkich bramek CMS.
- Zachować dotychczasowe pobrania galerii grupowych, uprawnienia pakietowe oraz istniejące linki Adobe. Nowy koszyk fizyczny nie może zastąpić rozliczania zdjęć cyfrowych.

## Aktualizacja 2026-09-13 — wspólna oferta i realizacja

- `/admin/gallery-shop`: wspólna oferta `gallery_shop_default`, ceny w groszach, dostawa i produkty `GalleryProduct.gallery_id=null`. Galerie bez lokalnego ustawienia dziedziczą cennik. Lokalne wyjątki i istniejące produkty pozostają; DELETE ustawienia przywraca dziedziczenie bez kasowania zamówień/produktów. Pusta oferta nie pokazuje CTA klientowi.
- `/admin/bookings/orders`: wspólne centrum zamówień i przesyłek (stary adres gallery-orders przekierowuje), paginacja, wyszukiwanie i filtry wczytanej listy, przygotowanie pakietu produkcyjnego, panel InPost.
- Klient: jasny interfejs, trzy stałe zakładki, stabilna siatka, mobilne dodawanie, trwałe w tej sesji szkice/koszyk/dostawa, wznowienie istniejącej płatności. Terminalny powrót PayU usuwa parametr shopOrder.
- nPhoto: cztery zweryfikowane propozycje (Harmonijka, Fotoalbum PRO, Fotokalendarz Basic, odbitki Fuji Silk), oficjalne mockupy i źródła w `src/lib/nphoto/starter-catalog.ts`. Import jednym kliknięciem jest atomowy, powtarzalny i nie nadpisuje własnych zmian; tworzy nieaktywne szkice bez wymyślonych cen. Odbitki stają się formatami, nie nieokreślonym produktem z jedną ceną. Pełna nazwa/parametry/opis wariantu zapisują się w snapshot zamówienia.
- Produkcja: endpoint POST `.../shop/orders/{id}/production` automatycznie kompletuje JPG odbitek 300dpi w zamówionym formacie z pełnym kadrem, materiały do projektu produktów, kolejność i specyfikację JSON. Pobiera wyłącznie własne źródła S3 HQ. Brak HQ lub błąd jednego zdjęcia zatrzymuje pakiet; brak częściowego „sukcesu”. ZIP jest prywatny z krótkotrwałym linkiem. Album/kalendarz wymagają projektu, pakiet nie jest zamówieniem w labie.
- InPost: realny adapter ShipX, wybór punktów z publicznego API, opcjonalna mapa v5; walidacja punktu przed płatnością; nadanie, PDF, status, anulowanie zgodnie z usługą i osobne zlecenie odbioru. Konfiguracja i granice w `GALLERY_INPOST.md`. Nie wykonano realnego nadania.
- Nowy admin sklepu korzysta z same-origin `/api/` i istniejącego Bearer admin_token, bez kierowania przez legacy Strapi.
- Eksporty odbitek grupowych rozpoznają nowe zamówienia fizyczne; wybory do albumu nie są traktowane jako odbitki ani prawa do plików Premium. Stare API nie pozwala kupić produktu nowego sklepu bez konfiguracji i dostawy.

### Rzeczywiste zależności uruchomienia

W tej sesji brak DATABASE_URL, PayU sandbox i danych InPost. Klucze nadań i identyfikator organizacji należy ustawić w sekretach hostingu; publiczny token mapy ograniczyć do domen. Własne ceny i widoczność publikuje się w jednej wspólnej ofercie, nie per klient.

Nie znaleziono publicznego kontraktu API nPhoto do składania zleceń. Potwierdzono istnienie integracji partnerskich, co nie zapewnia dostępu temu projektowi. Automatyczne przekazanie zamówienia do labu wymaga dokumentacji i dostępu partnerskiego nPhoto; nie implementujemy zgadywanego endpointu ani skryptu obchodzącego logowanie. Źródła: https://nphoto.com/pl/harmonijka ; https://nphoto.com/pl/fotoalbumy/fotoalbum-pro ; https://nphoto.com/pl/fotokalendarze/fotokalendarz-basic ; https://nphoto.com/pl/odbitki-i-wydruki/odbitki ; https://nphoto.com/pl/strefa-klienta/zdjecia-do-pobrania ; https://help.photonesto.com/pl/articles/11589338-integracja-z-labem-nphoto-w-photonesto .
