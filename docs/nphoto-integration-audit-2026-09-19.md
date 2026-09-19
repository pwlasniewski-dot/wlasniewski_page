# nPhoto — stan produkcji i następny etap, 19.09.2026

## Dowody

- Netlify: produkcyjny deploy `6aae26531b0a150008f9d342`, stan ready, publikacja 19.09.2026 06:08 UTC, commit `773e738ad528111c539ebd831270a057d693d0be`.
- PR #81 został scalony. Historia zamówień, powrót po płatności i nowe potwierdzenia są w wersji produkcyjnej. To potwierdzenie wersji kodu, nie nowy test płatności.
- Odczyt publicznego `/api/shop/catalog` na produkcji: success=true. Bez odczytu danych prywatnych klientów, bez zmian w bazie.

## Oferta widoczna publicznie

| Produkt | Cena PLN | Wybór zdjęć | Dodatkowe ujęcia | Film | Wnętrze |
|---|---:|---:|---:|---|---|
| Harmonijka 8×8 | 41,54 | 12 | 0 | tak | brak |
| Fotoalbum PRO 20×20 | 257,70 | 20 | 0 | tak | brak |
| Lite Album 20×20 | 140,59 | 16 | 0 | brak | 1 obraz |
| Wall Decor 40×60 | 119,24 | 1 | 0 | tak | nie dotyczy |

Każdy produkt ma zdjęcie główne. Odbitki: 15×21 Fuji Silk 2,50 zł, 10×15 Fuji Silk 1,50 zł. Dostawa: Paczkomat 17 zł, kurier 25 zł, odbiór osobisty 0 zł. Publiczne dane nie dowodzą poprawnego otwarcia mapy InPost ani całej płatności.

## Funkcje w wdrożonym kodzie

- Wspólny katalog, wyjątki galerii, szkice, edycja cen, widoczności i mediów, archiwizacja.
- Import oferty z publicznej strony konkretnego produktu nPhoto; własna cena, ręczne potwierdzenie wariantu i mediów. To nie synchronizacja hurtowego cennika.
- Galeria zdjęć produktu, film MP4 na żądanie i przeglądarka przykładowych rozkładówek. Brakuje przede wszystkim treści, nie kolejnej przeglądarki.
- Wybór zdjęć, ilości, płatność, historia i maile; ocena zachowania na produkcji wymaga osobnego testu autoryzowanej sesji.
- Eksport opłaconego zamówienia: odbitki JPG 300 dpi; dla albumów zdjęcia HQ w kolejności i JSON. Albumy i kalendarze wymagają projektu. Eksport nie składa zamówienia u dostawcy.
- W kodzie istnieje propozycja kalendarza 2027; nie ma go w obecnie opublikowanym katalogu.

## Co nPhoto udostępnia

1. Makiety marketingowe produktów: https://nphoto.com/pl/strefa-klienta/zdjecia-do-pobrania . Pobrana paczka Lite Album ma 2 PSD i 2 JPG (oraz systemowy Thumbs.db). Sam PSD nie działa jako interaktywny konfigurator w sklepie.
2. Projektowanie: https://nphoto.com/pl/jak-projektowac . nDesigner PRO / Kreator online, programy zewnętrzne, produkcyjne makiety zależne od wariantu w nShopie lub koszyku. Makiety reklamowe i produkcyjne mają różne przeznaczenie.
3. Sezon 2026: https://nphoto.com/pl/aktualnosci/oferta-na-swieta-2026 . Katalog z miejscem na własne ceny, mockupy, grafiki social, treści reklam i maili, podziękowania, dyplomy, materiały o reklamach. Część wymaga formularza lub konta. Nie wysłano formularza ani nie zapisano użytkownika na marketing.
4. Link ze strony sesji świątecznych prowadzi też do starszej kampanii 2024/2025. Nie traktować jej rabatów jako aktualnych.

## Trzy etapy

### 1. Uzupełnić prezentację istniejących czterech produktów

Cel: pokazać, za co klient płaci. Przygotować 3–5 zgodnych z wariantem ujęć: okładka, wnętrze, skala, detal. Najpierw Harmonijka i PRO; Lite ma już jeden podgląd wnętrza. Korzystać z własnych fotografii w oficjalnych mockupach. Gotowe JPG/WebP wybierać z istniejącej biblioteki mediów. Filmy uruchamiane przez klienta, bez automatycznego pobierania.

Przygotowana poprawka: oficjalne źródła w obecnym adminie, wielokrotny wybór ujęć i rozkładówek, dopisywanie bez kasowania poprzednich, deduplikacja, jawny limit 12, odrzucenie PSD/ZIP/PDF/wideo. Zapis i publikacja pozostają w obecnym procesie. Brak nowych tabel.

Odbiór: zapisać i odczytać media, obejrzeć podgląd mobilny, sprawdzić zgodność modelu/koloru/rozmiaru z opisem. Nie publikować przykładowej makiety jako projektu konkretnego klienta.

### 2. Wprowadzić małą ofertę prezentową 2026/2027

Najpierw kalendarz oraz prosty zestaw rodzinny oparty na obecnych produktach. Koszt konkretnego wariantu sprawdzić w zalogowanym nShopie, doliczyć projekt, dostawę od dostawcy i obsługę. Nie wyliczać marży na podstawie hasła „do -75%”. Dopiero po wycenie aktywować produkt; nie dodawać kilkunastu nieprzetestowanych pozycji naraz.

### 3. Domknąć przekazanie do produkcji

Zapisać przy zamówieniu specyfikację wariantu i link do projektu; dodać akceptację projektu klienta i referencję zamówienia nPhoto do istniejących szczegółów zamówienia. Dopiero po potwierdzeniu dokumentacji i uprawnień partnera rozważyć automatyczne składanie zamówień. Nie znaleziono w obecnym kodzie takiej integracji; publiczne instrukcje projektowania nie są dokumentacją API.

## Mierzenie efektu

Porównać otwarcia szczegółów produktu → wybór zdjęć → koszyk → opłacone zamówienie oraz średnią wartość zamówienia. Najpierw wykorzystać istniejące zdarzenia. Nie przypisywać wzrostu sprzedaży samemu wdrożeniu bez wystarczającej liczby wizyt.

## Pozostaje

- Materiały wymagające logowania/formularza i rzeczywiste ceny zakupowe nPhoto nie zostały odczytane.
- Nie przeprowadzono nowego zakupu ani wysyłki maila na produkcji.
- Dodatkowe media nie zostały opublikowane ani automatycznie zastąpione w produktach.
- Bieżąca poprawka admina jest etapem przygotowania materiałów, nie generatorem wizualizacji PSD ani automatycznym zamawianiem w nPhoto.

## Walidacja implementacji

Test wyboru mediów i render filmu/rozkładówek przechodzi. Po wygenerowaniu Prisma Client przechodzi też 9 grup zapisu sklepu, w tym tworzenie, edycja, archiwizacja i przywracanie w trzech rundach. Początkowy błąd tworzenia wynikał z brakującego lokalnego klienta Prisma. Kontrola mobilna pozostaje do wykonania; zmiana jest draftem.
