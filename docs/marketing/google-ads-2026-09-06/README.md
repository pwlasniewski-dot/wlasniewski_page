# Google Ads — sesje rodzinne w Toruniu

Stan: 6 września 2026. Materiały przygotowane, kampania nie jest zapisana w Google Ads. Nie podano budżetu ani nie uruchomiono wydatków.

## Zawartość

- `podglad-reklamy.html` — czytelny podgląd dwóch reklam oraz ustawień.
- `kampania.json` — pełna specyfikacja kampanii, konwersji, lokalizacji i warunków startu.
- `reklamy.csv` — dwie reklamy elastyczne w statusie Paused, do importu w Google Ads Editor po przygotowaniu wstrzymanej kampanii.
- `slowa-kluczowe.csv` — 10 pozycji, dopasowanie ścisłe i do wyrażenia.
- `wykluczenia.csv` — 15 wykluczeń na poziomie kampanii.

CSV nie tworzą kompletnego konta ani ustawień lokalizacji i rozliczeń. Najpierw przygotować kampanię według JSON; przy imporcie sprawdzić mapowanie kolumn. Kampania, grupa i reklamy mają pozostać wstrzymane do zatwierdzenia budżetu.

## Połączenie i uruchomienie

Zgodnie z decyzją właściciela nie używamy Adspirer. Przygotowane pliki można zaimportować w Google Ads Editor. Dostęp do konta jest potrzebny do potwierdzenia identyfikatora konta, strefy czasowej, konwersji, danych słów kluczowych oraz zapisania szkicu. Nie zakładać, że zalogowanie do Google Firma oznacza dostęp do Google Ads.

Docelowy formularz zbiera zapytanie o sesję. Cel główny: jeden kontakt zapisany w bazie, identyfikowany przez inquiryId. Kliknięcie telefonu i otwarcie kontaktu nie są potwierdzonymi zleceniami. W Google Ads ustawić zliczanie „Jedna”; nie dodawać drugiej głównej konwersji GA4 dla tego samego formularza.

Przygotowany kod usuwa błędną konwersję przy otwarciu /kontakt i przekazuje stabilny identyfikator przy wysłaniu formularza. Wymaga aktualnej zgody na pomiar. Zmiana nie jest jeszcze wdrożona — właściciel zatwierdził wysłanie i utworzono draft PR #67; podgląd jest sprawdzany przed wdrożeniem.

Po wdrożeniu sprawdzić zapis zapytania w panelu, wynik konwersji w narzędziu diagnostycznym Google, brak konwersji przy samej wizycie i po odmowie zgody. Nie wysyłać testowych kontaktów z danymi prawdziwych klientów.

## Ceny i reklama

W rezerwacji potwierdzono: Rodzinny Start 600 zł zamiast 750 zł, Komfort 780 zł zamiast 980 zł. Koniec promocji odpowiednio 1 października 2026 o 21:19 i 21:27 czasu polskiego. Kampania nie zawiera tych czasowych kwot w nagłówkach, dzięki czemu nie reklamuje nieaktualnej ceny po zakończeniu obniżki. Strona docelowa ma używać aktualnego źródła cen rezerwacji.

## Ocena skuteczności

Przed uruchomieniem ustalić średni budżet dzienny oraz limit CPC po sprawdzeniu danych konta. Średni budżet dzienny Google nie jest sztywnym limitem wydatku pojedynczego dnia. Nie wpisano żadnej kwoty do zatwierdzenia z góry.

Po 3 dniach sprawdzić emisję i nietrafne frazy; po 7 dniach rzeczywiste zapytania; po 14 dniach dopracować reklamę; po miesiącu policzyć potwierdzone zlecenia, koszt ich pozyskania oraz przychód. Bez danych o budżecie, CPC i zamykaniu kontaktów nie da się rzetelnie podać liczby dodatkowych zleceń.

## Oficjalne źródła

- Limity i działanie reklam elastycznych: https://support.google.com/google-ads/answer/7684791?hl=pl
- Pomiar konwersji: https://support.google.com/google-ads/answer/1722054?hl=pl
- Kierowanie na lokalizacje: https://support.google.com/google-ads/answer/2453995?hl=en
- Średni budżet dzienny i limity wydatków: https://support.google.com/google-ads/answer/1704443?hl=pl
