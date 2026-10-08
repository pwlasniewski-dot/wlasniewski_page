# Prodigi w istniejącym sklepie

Panel: `/admin/gallery-shop` → Prodigi — produkty, ceny PLN i import.

1. Odczytaj SKU z API. API nie udostępnia tutaj listy całego katalogu — SKU wskazuje administrator.
2. Wybierz wariant z dostawą do Polski i wymaganym polem `default`. Złożone produkty wymagające wielu pól nie są importowane.
3. Wybierz ilość i metodę dostawy; pobierz rzeczywistą wycenę sandbox. Odczyt produktów i wyceny nie tworzą zamówień.
4. Koszty dostawcy pozostają w jego walucie. Kwoty PLN przeliczane są według NBP z zapisaną datą, tabelą i kursem. Brak aktualnego kursu blokuje import.
5. Kalkulator korzysta z jednej wspólnej opłaty kuriera skonfigurowanej w sklepie. Zmiana opłaty w kalkulatorze zmienia ten sam formularz; przed importem należy zapisać ustawienia sklepu.
6. Podaj docelową marżę całego przychodu (produkty oraz dostawa), opcjonalną prowizję procentową i koszt stały. Minimalna cena jednostkowa jest zaokrąglana w górę do grosza. Opłata klienta jest doliczana raz za koszyk.
7. Zatwierdź cenę PLN przyciskiem i nadaj nazwę. Import tworzy ukryty szkic. Opis, media, cenę i podgląd klienta edytuje istniejący CMS poniżej.

Wzór: cena sztuki = ceil_grosz(((koszt dostawcy PLN + stała opłata) / (1 − marża − prowizja procentowa) − opłata klienta za dostawę) / liczba sztuk). Marża nie obejmuje pozostałych, niewpisanych kosztów działalności. Wycena dotyczy rzeczywistej ilości wskazanej w API; nie zakłada liniowego kosztu wysyłki.

Import jest transakcyjny i idempotentny według SKU oraz atrybutów wariantu. Ponowienie zachowuje ręcznie zmienione ceny, zdjęcia, opisy i archiwum. Dane dostawcy są zapisane w `Setting: prodigi_product_v1_ID`. Każdy wariant to osobny `GalleryProduct`.

Sandbox nie kwalifikuje produktu do rzeczywistej sprzedaży: `environment=sandbox`, `ordersEnabled=false`, `liveQualified=false`, typ `prodigi_sandbox`. Samo ustawienie widoczności nie może odblokować płatnego checkoutu. Wymagane są osobna kwalifikacja live, klucz środowiska live i weryfikacja kosztów oraz realizacji. Na tym etapie dostępny jest tylko klucz sandbox. Nie wykonano importu do produkcyjnej bazy ani płatnego zamówienia.

Ceny zapisane w PLN i historyczne zamówienia nie zmieniają się wraz ze zmianą kursu. Dostępność i koszt sandbox nie stanowią gwarancji oferty produkcyjnej.

## Kwalifikacja live

Kod zawiera osobny etap „kwalifikacja produktu do sprzedaży live”. Administrator wybiera zapisany szkic z ceną, opisem i zdjęciem. Serwer pobiera produkt, dokładny wariant, pełny koszt jednej sztuki z dostawą i aktualny kurs. Administrator widzi podsumowanie i jawnie zatwierdza. Przed zapisem dane i koszt są pobierane ponownie; zmiana produktu, kursu lub kosztu wymaga ponownej akceptacji. Transakcja sprawdza również równoczesną edycję produktu.

Udana kwalifikacja ustawia `environment=live`, `liveQualified=true`, `ordersEnabled=true` oraz typ `prodigi_live`, ale pozostawia `is_active=false`. Publikacja następuje oddzielnie przez istniejący CMS. Globalna blokada składania zamówień produkcyjnych nadal należy do adaptera realizacji. Bez `PRODIGI_API_KEY` kwalifikacja zwraca czytelny błąd 503 i niczego nie zmienia. Nie przetestowano rzeczywistej kwalifikacji live, ponieważ dostępny jest tylko klucz sandbox.

Import standardowej ceny produktu oraz przycisk przeniesienia sugestii ceny wymagają wyceny jednej sztuki. Wycena większej ilości służy analizie zestawu; nie tworzy automatycznie progu ilościowego i nie może zaniżyć standardowej ceny dla zakupu jednej sztuki.
