# Standard pracy nad Wlasniewski.pl

## Cel biznesowy

Zmiany w serwisie mają prowadzić do większej liczby wartościowych wejść, zapytań, rezerwacji i przychodu. Nie rozbudowuj projektu dla samej liczby funkcji ani liczby podstron.

## Obowiązkowy standard modułowego CMS

Każda nowa lub istotnie przebudowywana strona widoczna dla klienta, w szczególności strona oferty, landing page, cennik i część lejka sprzedażowego, musi być zarządzana z panelu administratora. Nie wolno uznać strony za ukończoną, jeżeli jej treść biznesowa jest dostępna do zmiany wyłącznie w kodzie.

Panel administratora powinien umożliwiać, odpowiednio do rodzaju strony:

- zmianę wszystkich tekstów, nagłówków, opisów, etykiet i komunikatów dla klienta;
- zmianę nazw pakietów, cen, prefiksów cenowych, zakresów, terminów realizacji i oznaczeń typu „najczęściej wybierany”;
- wybór, dodawanie, wymianę i usuwanie zdjęć lub filmów wraz z tekstem alternatywnym i ustawieniem kadru na komputerze oraz telefonie;
- edycję CTA: treści przycisku, adresu docelowego, widoczności i źródła wejścia do lejka;
- dodawanie, ukrywanie, usuwanie, duplikowanie i zmianę kolejności modułów bez modyfikowania kodu;
- edycję FAQ, obszaru działania, danych oferty oraz wymaganych informacji dla klienta;
- edycję SEO: meta title, meta description, canonical, dane Open Graph oraz treści wykorzystywanych w structured data;
- wybór kontrolowanych wariantów wyglądu: zatwierdzonych fontów, kolorów, tonów tła i układów zgodnych z identyfikacją Wlasniewski.pl.

Nie twórz dowolnego edytora CSS. Udostępniaj bezpieczne warianty i tokeny systemu projektu, aby zmiana w panelu nie mogła zepsuć czytelności, responsywności ani spójności marki.

## Jedno źródło danych

Cena, nazwa, zakres i dostępność pakietu muszą pochodzić z jednego źródła danych wykorzystywanego jednocześnie przez:

- stronę oferty;
- formularz rezerwacji lub zamówienia;
- podsumowanie i wiadomości transakcyjne;
- analitykę;
- schema.org i pozostałe dane SEO.

Nie kopiuj tych samych wartości do kilku komponentów. Zmiana w adminie ma aktualizować cały lejek i nie może powodować różnicy między ceną na stronie a ceną w rezerwacji.

## Zasada dla istniejących stron

Podczas istotnej zmiany istniejącej strony nie dodawaj kolejnych treści biznesowych na stałe w kodzie. Jeżeli edytowany obszar nie jest jeszcze podpięty do CMS, włącz jego podpięcie do zakresu zmiany albo jasno opisz techniczną przeszkodę przed wdrożeniem.

Migracja nie może usuwać obecnych treści. Zapewnij bezpieczne wartości startowe i zachowanie strony w razie chwilowej niedostępności bazy lub CMS.

## Dozwolone elementy techniczne w kodzie

W kodzie mogą pozostać stabilne elementy techniczne, między innymi identyfikatory zdarzeń analitycznych, nazwy tras, typy danych, reguły walidacji, zabezpieczenia, integracje oraz teksty wymagane technicznie lub prawnie. Nie dotyczy to treści marketingowych, cen, zdjęć, FAQ ani elementów oferty widocznych dla klienta.

## Definicja ukończenia strony

Przed zgłoszeniem strony do scalenia trzeba potwierdzić:

1. administrator może zmienić treści, ceny, media, CTA i SEO bez zmiany kodu;
2. administrator może zmienić kolejność, widoczność oraz zestaw obsługiwanych modułów;
3. oferta i rezerwacja odczytują te same dane;
4. structured data odczytuje aktualne dane oferty;
5. zapis w panelu jest autoryzowany, walidowany i bezpieczny;
6. po zapisie zmiany są widoczne na stronie oraz w podglądzie mobilnym;
7. wartości domyślne i istniejące dane nie zostały utracone;
8. test obejmuje co najmniej zapis w adminie, ponowny odczyt i render strony klienta;
9. analityka mierzy przejście od wejścia na ofertę do rozpoczęcia oraz wysłania rezerwacji;
10. strona pozostaje spójna wizualnie i prowadzi klienta do jednego głównego działania.

Jeżeli którykolwiek z punktów odnoszących się do danej strony nie jest spełniony, zmiana pozostaje draftem i nie jest gotowa do produkcji.
