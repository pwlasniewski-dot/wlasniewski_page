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
6. W zakładce „Zamówienia” sprawdź pozycje, konfiguracje, zdjęcia, kwoty i odbiorcę. Płatność jest wyłącznie do odczytu. Dopiero zamówienie opłacone pozwala zapisać obecny lub następny etap realizacji.
7. Po samodzielnym nadaniu przesyłki zapisz numer śledzenia. Nie można oznaczyć wysyłki bez numeru przesyłki.

## Pozostałe bramki przed produkcją

- Niezależne QA obejmuje trzy rundy: zamawianie, usuwanie/anulowanie pozycji, wyjście i powrót, dodawanie produktów, zmiany ilości, ponowne dodanie; także zapis–odczyt konfiguracji admina i render klienta. Wynik należy odczytać z raportu QA, a nie z tego opisu.
- Nie wykonano w ramach tej dokumentacji rzeczywistych płatności ani realizacji zamówień. Przed produkcją potrzebny jest osobny test środowiska płatności i wiarygodnego potwierdzenia statusu `paid`.
- InPost API, mapowy wybór Paczkomatu, tworzenie etykiet i automatyczne śledzenie nie są podłączone. Zapisywany wybór dostawy nie jest nadaniem przesyłki ani potwierdzeniem istnienia punktu.
- Zewnętrzny importer/API nPhoto nie jest podłączony. Lista produktów pochodzi z istniejącego lokalnego katalogu. Produkcję zamawia właściciel.
- Należy zweryfikować działanie na Safari iPhone i komputerze, szerokość panelu administracyjnego, dostępność oraz stabilność istniejącej galerii Historia/Siatka.
- Pozostałe wymagania CMS z AGENTS.md wymagają audytu przed produkcją: kolejność i komplet mediów/modułów, kontrolowane warianty wyglądu, treści marketingowe, analityka lejka. Ta zmiana nie dodaje dowolnego edytora CSS ani nie deklaruje spełnienia wszystkich bramek CMS.
- Zachować dotychczasowe pobrania galerii grupowych, uprawnienia pakietowe oraz istniejące linki Adobe. Nowy koszyk fizyczny nie może zastąpić rozliczania zdjęć cyfrowych.
