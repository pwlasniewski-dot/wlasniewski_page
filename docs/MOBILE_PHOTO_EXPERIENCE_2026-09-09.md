# Mobilne portfolio, galerie i pierwszy ekran — 2026-09-09

## Zlecenie i zakres
Właściciel zatwierdził uporządkowanie zdjęć i gestów na telefonie, usunięcie taśmy miniatur i zbędnego CTA sesji, odroczenie Facebooka oraz naprawę strony głównej i blokującego ładowania. Bez nowych płatnych usług. Efekt biznesowy: łatwiejsze oglądanie i dojście do kontaktu; ROI wymaga danych po wdrożeniu.

## Zachowanie
- Zdjęcia portfolio mają pełny kadr, tytuł pod zdjęciem i natywne poziome przewijanie. Pionowy gest przewija stronę. CTA „Zobacz zdjęcia” sesji usunięte; powroty i CMS zachowane.
- Mobile hero home ma zdjęcie ponad treścią CMS, jeden CTA i dyskretny licznik. Na wyraźną korektę właściciela przywrócono automatyczną zmianę zdjęć na telefonie (istniejący interval, domyślnie 6 s) oraz w sliderach kategorii i sesji portfolio (6 s). Dotyk i przewijanie odraczają następną zmianę o pełny interwał; autoplay pauzuje poza ekranem, w nieaktywnej karcie, podczas podglądu, hover/fokusu klawiatury i przy ograniczeniu ruchu systemu. Ostatnie zdjęcie wraca do pierwszego bez przewijania przez całą taśmę. Desktop home zachowuje dotychczasowy automat, a podgląd zdjęć nadal jest sterowany ręcznie.
- PhotoLightbox współdzielony przez portfolio oraz oba tryby galerii: Zoom, Counter, preload sąsiadów, bez miniatur. Akcje klienta dostępne na telefonie, bez zamykania podczas wyboru.
- Standard/kupione zdjęcia indywidualne wyświetlają istniejący zoptymalizowany podgląd `file_url` (do 2000 px), z fallbackiem do miniatury. Preload sąsiadów nie pobiera pełnych JPG HQ; przycisk pobierania nadal korzysta z identycznego chronionego endpointu i oryginalnej jakości. Niekupione premium pokazują wyłącznie istniejącą miniaturę, bez fallbacku do `file_url`; brak miniatury ma jawny stan. Ograniczenie: powiększanie podglądu korzysta z rozdzielczości podglądu/miniatury, pełną jakość zapewnia jawne pobranie. Nie zmieniono API ani uprawnień.
- Facebook i kontakt na portfolio dostępne po minięciu końca zdjęć i znikają przy powrocie do nich. Na home ukryte do minięcia hero. W podglądzie znika także kontrolka cookies, powraca po zamknięciu. Ustawienia FB nadal pochodzą z istniejącego CMS.
- Globalny loading jest szkieletem w przepływie strony, bez zasłaniania gotowej nawigacji. CMS pierwszego ekranu i ustawienia są cache’owane z unieważnianiem przez istniejące zapisy CMS. Ceny i promocje pozostają bieżące. Opinie/oferta/poradnik są streamowane pod Suspense po hero; niezależne odczyty wykonywane równolegle.

## Kryteria odbioru
320–430 px i desktop; długi tytuł, brak poziomego overflow; poziomy i pionowy gest; brak taśmy miniatur; zoom/close/focus; wybór nie zmienia zdjęcia; istniejące limity/wysyłka/druk/płatności; pokazanie i ponowne ukrycie FB; CMS nadal steruje tekstami, zdjęciami i CTA.

## Walidacja
W toku: niezależny przegląd, jednostkowe kontrakty, build i UI. Wyniki końcowe dopisujemy po wykonaniu. Testy danych klienta używają wyłącznie syntetycznych fixture; bez zdalnych zamówień/płatności/wyborów.

Korekta autoplay: niezależny przegląd zaakceptował kod. Wykonano test zachowania rzeczywistego hooka z kontrolowanym zegarem i zdarzeniami DOM: interwał, pętla, gest i bezwładność przewijania, wznowienie po pauzach, cleanup, pojedyncze zdjęcie i wyłączona gałąź desktop. Testy portfolio/podgląd/FB: 15/15. Typecheck nie zgłasza diagnostyk w zmienionych plikach; pełny projekt ma pozostałe błędy typów, w tym brak wygenerowanego klienta Prisma w świeżym checkout. Build dokładnego commita jest sprawdzany przez Netlify przed scaleniem. Test na fizycznym iPhonie nie został wykonany.

## Odwrócenie
Revert commita kodu; brak migracji i modyfikacji danych. Nie ma nowych opłat. Szybkość na rzeczywistym iPhonie wymaga końcowej kontroli urządzenia; emulacja/desktop nie stanowi pomiaru sprzętowego.
