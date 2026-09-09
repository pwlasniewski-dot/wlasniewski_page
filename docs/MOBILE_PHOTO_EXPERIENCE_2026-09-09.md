# Mobilne portfolio, galerie i pierwszy ekran — 2026-09-09

## Zlecenie i zakres
Właściciel zatwierdził uporządkowanie zdjęć i gestów na telefonie, usunięcie taśmy miniatur i zbędnego CTA sesji, odroczenie Facebooka oraz naprawę strony głównej i blokującego ładowania. Bez nowych płatnych usług. Efekt biznesowy: łatwiejsze oglądanie i dojście do kontaktu; ROI wymaga danych po wdrożeniu.

## Zachowanie
- Zdjęcia portfolio mają pełny kadr, tytuł pod zdjęciem i natywne poziome przewijanie. Pionowy gest przewija stronę. CTA „Zobacz zdjęcia” sesji usunięte; powroty i CMS zachowane.
- Mobile hero home ma zdjęcie ponad treścią CMS, jeden CTA i dyskretny licznik; automatyczna zmiana wyłączona na telefonie. Desktop zachowuje dotychczasową prezentację.
- PhotoLightbox współdzielony przez portfolio oraz oba tryby galerii: Zoom, Counter, preload sąsiadów, bez miniatur. Akcje klienta dostępne na telefonie, bez zamykania podczas wyboru.
- Standard/kupione zdjęcia indywidualne wyświetlają istniejący zoptymalizowany podgląd `file_url` (do 2000 px), z fallbackiem do miniatury. Preload sąsiadów nie pobiera pełnych JPG HQ; przycisk pobierania nadal korzysta z identycznego chronionego endpointu i oryginalnej jakości. Niekupione premium pokazują wyłącznie istniejącą miniaturę, bez fallbacku do `file_url`; brak miniatury ma jawny stan. Ograniczenie: powiększanie podglądu korzysta z rozdzielczości podglądu/miniatury, pełną jakość zapewnia jawne pobranie. Nie zmieniono API ani uprawnień.
- Facebook i kontakt na portfolio dostępne po minięciu końca zdjęć i znikają przy powrocie do nich. Na home ukryte do minięcia hero. W podglądzie znika także kontrolka cookies, powraca po zamknięciu. Ustawienia FB nadal pochodzą z istniejącego CMS.
- Globalny loading jest szkieletem w przepływie strony, bez zasłaniania gotowej nawigacji. CMS pierwszego ekranu i ustawienia są cache’owane z unieważnianiem przez istniejące zapisy CMS. Ceny i promocje pozostają bieżące. Opinie/oferta/poradnik są streamowane pod Suspense po hero; niezależne odczyty wykonywane równolegle.

## Kryteria odbioru
320–430 px i desktop; długi tytuł, brak poziomego overflow; poziomy i pionowy gest; brak taśmy miniatur; zoom/close/focus; wybór nie zmienia zdjęcia; istniejące limity/wysyłka/druk/płatności; pokazanie i ponowne ukrycie FB; CMS nadal steruje tekstami, zdjęciami i CTA.

## Walidacja
W toku: niezależny przegląd, jednostkowe kontrakty, build i UI. Wyniki końcowe dopisujemy po wykonaniu. Testy danych klienta używają wyłącznie syntetycznych fixture; bez zdalnych zamówień/płatności/wyborów.

## Odwrócenie
Revert commita kodu; brak migracji i modyfikacji danych. Nie ma nowych opłat. Szybkość na rzeczywistym iPhonie wymaga końcowej kontroli urządzenia; emulacja/desktop nie stanowi pomiaru sprzętowego.
