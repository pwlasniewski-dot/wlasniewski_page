# Specyfikacja spójności serwisu Wlasniewski.pl

Aktualizacja: 8 października 2026. Wymagania użytkownika, obowiązujące dla całego serwisu, wszystkich agentów i kolejnych zadań. Dokument jest normą projektową, nie deklaracją, że wszystkie wymagania już działają.

## Obowiązek przed każdą zmianą

Na początku każdego zadania wprowadzającego zmiany, także po wznowieniu innej rozmowy, przeczytaj aktualne `AGENTS.md`, ten dokument i specyfikację danego modułu. Dla sklepu przeczytaj także `docs/PRODIGI_SHOP.md`, `docs/PRODIGI_ORDER_OPERATIONS.md` oraz aktualny plan integracji Prodigi, gdy zadanie dotyczy jego założeń biznesowych. Po zmianie zakresu uzupełnij odczyt odpowiednich części. Nie uznawaj pamięci rozmowy za zamiennik aktualnych dokumentów.

Przed edycją kodu sporządź mapę istniejącego procesu z konkretnymi plikami: wejście klienta, komponent, stan, API, baza, cena, płatność, historia, powiadomienie, panel administratora. Wyszukaj implementację o podobnym celu i jej użytkowników. Domyślnym rozwiązaniem jest jej rozszerzenie. Nowy równoległy proces wymaga jawnego uzasadnienia braku możliwości integracji.

## Jedna strona, jeden proces zakupowy

- Główny stan koszyka: `src/context/CartContext.tsx`. Panel: `src/components/BasketDrawer.tsx`. Kasa: `src/app/checkout/page.tsx`. Licznik nagłówka czyta ten sam stan.
- Galeria, karta produktu i personalizacja są punktami dodawania do istniejącego koszyka. Konfigurator nie jest drugim sklepem ani drugą kasą.
- Klient wybiera produkt, dodaje własne zdjęcie lub zdjęcie ze swojej dostępnej galerii, widzi podgląd i jakość, ustala ilość i dodaje do wspólnego koszyka. Nowa pozycja nie usuwa poprzednich.
- Odświeżenie, zamknięcie konfiguratora i przejście do innej części strony zachowują pozycje. Migracja starego koszyka nie może ich dublować ani przywracać wcześniej usuniętych.
- Zdjęcia klienta, galerii grupowej i gościa zachowują odrębne uprawnienia. Jeden interfejs nie oznacza wspólnego dostępu do cudzych plików. Haseł, tokenów i podpisanych URL nie zapisuje się w metadanych koszyka.
- Cenę i dostępność potwierdza serwer; suma w pamięci przeglądarki nie jest podstawą obciążenia. Przeliczenie EUR/PLN i dostawa muszą być spójne w podsumowaniu, zamówieniu i administracji.
- Odrębne typy zamówień i realizacji mogą wymagać odrębnych płatności. Interfejs mówi o tym przed zakupem. Nie obiecuje jednej płatności, jeżeli backend jej nie obsługuje. Docelowe łączenie płatności wymaga osobnego projektu rozliczeń, zwrotów i idempotencji, a nie połączenia kwot na froncie.
- Anulowanie lub niepewna płatność zachowuje koszyk. Potwierdzenie opłaty usuwa tylko opłacony, niezmieniony zestaw pozycji. Inne pozycje i zmiany klienta pozostają.

## Jedno źródło danych, spójny admin i klient

Oferta, ceny, opisy i media pochodzą z istniejącego CMS. Odczyt strony nie może nadpisywać zapisanych ustawień ani zasiewać stałych cen. Historyczny zapis ceny zamówienia jest niezmienny i odrębny od bieżącej oferty.

Zamówienia zdjęć, produktów i kart obsługuje istniejące `Rezerwacje → Zamówienia`; linki z galerii zachowują kontekst. Nie twórz równoległych rejestrów. Rezerwacja sesji, voucher ofertowy, karta podarunkowa, zdjęcie cyfrowe i produkt drukowany zachowują swoje znaczenia biznesowe, nawet gdy są widoczne w jednym interfejsie.

Konto klienta, administrator, e-mail i realizacja odczytują ten sam zapis statusu i płatności. Wysłanie do drukarni, zakończenie produkcji, wysyłka i doręczenie nie są tym samym statusem. Podgląd admina ma odpowiadać temu, co zobaczy klient z jego uprawnieniami.

## Warunek odbioru

Sprawdź co najmniej: dodanie z dwóch punktów wejścia; zgodność licznika, ilości, cen i zdjęć; modyfikację, usunięcie, odświeżenie; powrót z płatności anulowanej i opłaconej; ponowione żądanie; brak dostępu innej osoby; odczyt historycznego zamówienia u klienta i admina; powiadomienia bez ujawnienia danych wewnętrznych.

Raport określa wersję kodu, środowisko, rodzaj dowodu (przegląd kodu / test z atrapami / rzeczywiste API / przeglądarka) oraz niezweryfikowane obszary. Nie wolno nazwać całej ścieżki sprawdzoną po zaliczeniu samego wyglądu lub testów lokalnych.

## Kontrola zmian i audyt

Przy każdym PR podaj: co już istniało, co rozszerzono, czy dodano nowy stan/API/tabelę i dlaczego, jakie punkty wejścia sprawdzono, jakie ograniczenia pozostały. Błąd spójności blokuje ogłoszenie gotowości produkcyjnej. Usuwanie duplikatów nie może kasować historii, klientów, zamówień ani starych linków.
