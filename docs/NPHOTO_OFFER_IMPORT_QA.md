# nPhoto: przygotowanie oferty i podgląd — 2026-09-13

## Zakres

Wspólna oferta `/admin/gallery-shop` zawiera pracownię: publiczny adres produktu nPhoto → odczyt materiałów → własny opis, cena, format, liczba stron/rozkładówek i zakres zdjęć → podgląd → nieaktywny szkic. Fotograf osobno włącza widoczność. Import nie uruchamia sklepu, nie publikuje produktu i nie zamawia produkcji.

`GalleryProductPreview` jest wspólny dla importera, edytora zapisanej oferty i szczegółów produktu klienta. `nphotoOfferDescription` ustala zapisany opis wraz z wariantem. Klient wybiera zdjęcia i ilość egzemplarzy. Podgląd pokazuje fotografie produktu, nie gotowy projekt z fotografiami klienta ani pełny konfigurator producenta.

Zapisane media można zmieniać w panelu. Istniejące ceny i produkty nie są zastępowane przy ponownym imporcie tego samego adresu. Limit zdjęć, oferta i koszt są weryfikowane przez istniejący serwer zakupów; zamówienie zachowuje opis wariantu w swoim snapshotcie.

## Bezpieczeństwo

- Uwierzytelnienie administratora przed pobraniem lub zapisem.
- Publiczne HTTPS `nphoto.com`/`www.nphoto.com`, konkretne polskie strony produktów; brak dowolnych hostów, danych logowania, parametrów i stron konta.
- Ręczna kontrola każdego przekierowania (maksymalnie 2), wspólny limit 8 sekund i 2 MB odczytanego HTML.
- Konserwatywny parser DOM: tylko produkt, nie nawigacja ani powiązane oferty; żadnych skryptów, embedów, wymyślonych cen lub kombinacji wariantów.
- Potwierdzenie uprawnień do tekstów i zdjęć przed zapisem. Publiczna dostępność zdjęcia nie oznacza automatycznie prawa do jego wykorzystania.
- Nieaktywne szkice, transakcja Serializable dla produktu i reguł. Nieprawidłowa istniejąca konfiguracja nie jest zerowana przez import.

## Testy

`npm run test:gallery-shop`: 74 grupy PASS (10 domena, 11 interfejs zakupów, 21 serwer sklepu, 9 nadawanie, 5 wybór punktu, 13 import, 5 UI oferty). Testy nowych ścieżek korzystają z kontrolowanych HTML, odpowiedzi HTTP i bazy w pamięci. Nie potwierdzają prawdziwych transakcji PostgreSQL ani dostępu do dostawcy.

Kontrola niezależnego agenta: brak wykrytych P0/P1. Poprawiono rozbieżność podglądu/opisu po zapisie, limity UI/API i obsługę starych nieprawidłowych danych mediów. `git diff --check` PASS. Build Node 22 ukończony (exit 0); istniejąca konfiguracja pomija błędy typów podczas buildu, a strony zależne od bazy użyły fallbacków z powodu braku lokalnego DATABASE_URL. Pełny typecheck nadal ma wcześniejsze diagnostyki projektu; nie należy przedstawiać go jako PASS.

Lokalny odczyt nPhoto osiągnął bezpieczny limit 8 sekund. Nie obchodzono ograniczeń. Dopóki rzeczywisty odczyt w deploy-preview nie przejdzie, nie wolno deklarować importu online jako w pełni zweryfikowanego. Rzeczywisty zapis nowej oferty i jej publikacja nie były wykonywane — właściciel nie wskazał jeszcze docelowych produktów i cen. PR pozostaje draftem.

### Uzupełnienie: odczyt online i kontrola wizualna

Na wdrożonym `2dfb050` odczyt `/pl/fotoalbumy/fotoalbum-pro` przez formularz administratora zakończył się sukcesem: nazwa, opis, 12 prawdziwych zdjęć produktu i dwa zestawy parametrów. Obejrzano zdjęcia oraz wspólny podgląd. Brak ceny pozostaje opisany jako „Cena do ustalenia”. Nie potwierdzono uprawnień do materiałów, nie zapisano szkicu ani nie włączono widoczności.

W tej samej przeglądarce potwierdzono szczegóły istniejącego produktu klienta, prawidłową cenę, Escape zamykający tylko szczegóły i przejście do wyboru zdjęć. Wybór anulowano, koszyk pozostał pusty. Istniejące dane testowe (literówki i zdjęcie niezwiązane z albumem) pozostawiono bez podmiany. Kontrola dotyczy desktopowego Chrome ze wspólną sesją admina, nie fizycznego iPhone/Safari ani izolowanej sesji klienta.

Poprawka `cc07e11` usuwa kopiowanie limitów zdjęć do opisu: są wyświetlane dynamicznie z reguł produktu, więc zmiana limitu w adminie nie pozostawia starej liczby w opisie. 13 testów importu i 5 interfejsu przeszły ponownie po tej poprawce. Sukces pojedynczego odczytu online nie oznacza pełnej obsługi wszystkich produktów ani automatycznego zlecania produkcji.

## Ustalenia dotyczące dostawców

- [Crystal Albums w Photonesto](https://help.photonesto.com/pl/articles/11652809-integracja-photonesto-z-crystal-albums-przewodnik-krok-po-kroku): potwierdzone klucz i tajny kod API w koncie producenta oraz przekazywanie odbitek do koszyka. Dokumentacja partnera nie potwierdza udostępnienia API własnemu sklepowi ani pełnego katalogu albumów.
- [Crystal Albums w Mafelo](https://kb.crystal-albums.pl/mafelo-produktydodatkowe): fotograf tworzy ofertę z własną ceną i limitem zdjęć, klient wybiera produkt i zdjęcia. To wzorzec prezentacji, nie dowód automatycznej produkcji albumów.
- [QT Albums + Pic-Time](https://www.qtalbums.com/pic-time): wybrane albumy, popularne oprawy i ograniczona personalizacja dla klienta. Potwierdzona integracja partnerska, nie publiczne API dla naszej strony.
- [nPhoto w Photonesto](https://help.photonesto.com/pl/articles/11589338-integracja-z-labem-nphoto-w-photonesto): opisane 68 konfiguracji odbitek; nie należy przedstawiać ich jako 68 albumów lub całej oferty nPhoto.

Do decyzji o dostawcy: dostęp dla własnej aplikacji, dokumentacja i środowisko testowe, zakres produktów/wariantów, wysyłanie plików i projektów, ceny zakupu, statusy realizacji oraz warunki używania mediów. Jakość wymaga porównania próbek, nie samej specyfikacji strony. Żadna nowa integracja produkcyjna z alternatywnym producentem nie została tutaj uruchomiona.
