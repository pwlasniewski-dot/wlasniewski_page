# Podgląd konta klienta przez administratora

Wejście: karta klienta → Zobacz jako klient. Osobna zakładka, ten sam komponent konta, jawny baner i powrót do karty klienta. Klucz podglądu jest wyłącznie w pamięci strony; nie podmienia cookies ani localStorage klienta/admina.

Zakres pierwszej wersji: zakładki konta, lista galerii, dokumentów, rezerwacji, zamówień i poradnik. Zewnętrzne przejścia (w tym wejście do osobnej galerii i dokumentu), zakup, podpis, notatki i zmiany ustawień są zablokowane w UI. To nie jest pełne przejęcie sesji klienta.

Serwer: wydanie klucza wymaga autoryzowanego admina, aktywnego konta CLIENT i zakończonego ustawienia hasła. Klucz wygasa po 10 minutach. Zwykłe verifyToken go odrzuca; wyłącznie jawna lista GET może odczytać go przez verifyClientReadToken. Każdy taki odczyt ponownie sprawdza rolę admina. Dotychczasowe filtry własności klientów pozostają aktywne. Checkout nie akceptuje klucza podglądu.

Weryfikacja lokalna: tests/qa/client-preview.cjs obejmuje odmowę zwykłego uwierzytelniania, czas ważności, odmowę metod zapisu i nieobsługiwanych ścieżek, odebranie roli admina, autoryzację wydania, blokadę nieaktywnego konta/ustawienia hasła i prawdziwy render konta z przełączeniem do zamówień bez zdarzeń aktywności klienta. Baza i autoryzacja admina w testach są zastąpione kontrolowanymi atrapami. Testy zamówień i dziewięć grup zapisu sklepu również przechodzą po wygenerowaniu Prisma Client.

Status: draft. Wymaga kontroli mobilnej i sprawdzenia wszystkich zakładek na odizolowanym podglądzie z klientami o różnych uprawnieniach. Nie testowano transakcji ani wysyłki wiadomości na produkcji. Pełny tsc zgłasza istniejące problemy poza zmienionymi modułami.

Zgłoszenie edycji/usuwania produktów #1 i #3 pozostaje otwarte: odczyt produkcji potwierdził wspólny katalog oraz nieaktywność obu produktów. Niezapisane zmiany blokują usuwanie w UI. Brakuje odpowiedzi API z nieudanego zapisu użytkownika; ostrzeżenia preload fontów nie wskazują jego przyczyny. Nie zmieniano produkcyjnych rekordów.
