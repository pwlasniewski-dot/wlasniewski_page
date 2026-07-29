# Specyfikacja funkcjonalna platformy wlasniewski.pl

Wersja: 3.0

Stan: 2026-07-29

Źródło techniczne: `ARCHITECTURE.md`

Raport jakości: `docs/AUDIT_2026-07-29.md`

## 1. Reguły utrzymania specyfikacji

Ten plik jest obowiązkowym punktem wejścia i wyjścia każdej zmiany funkcjonalnej.

Statusy wymagań:

- **WDROŻONE** — kod istnieje i zachowanie zostało potwierdzone;
- **CZĘŚCIOWE** — funkcja działa, ale ma wymienione ograniczenie;
- **PLANOWANE** — zaakceptowany kierunek, bez gwarancji terminu;
- **BLOKER** — ryzyko uniemożliwiające uczciwe uznanie funkcji za ukończoną.

Zmiana jest zakończona dopiero, gdy specyfikacja, architektura, historia, testy i sposób wdrożenia są zgodne z kodem.

## 2. Role

### 2.1. Gość

- przegląda ofertę, portfolio, blog i strony lokalne;
- wysyła zapytanie;
- rezerwuje usługę, kupuje produkt lub kartę;
- może dobrowolnie zapisać się do newslettera;
- nie musi tworzyć konta, jeśli proces tego nie wymaga.

### 2.2. Klient

- loguje się do konta;
- widzi własne rezerwacje, zamówienia, galerie, oferty i umowy zgodnie z uprawnieniami;
- aktualizuje dane i hasło;
- zarządza zgodą newsletterową.

### 2.3. Fotograf/współpracownik

- korzysta z przydzielonych funkcji i danych;
- nie otrzymuje automatycznie uprawnień administratora.

### 2.4. Administrator

- zarządza treścią, sprzedażą, klientami, galeriami, płatnościami i konfiguracją;
- kwalifikuje leady;
- odpowiada za legalność treści i wykorzystania danych;
- ma dostęp wyłącznie po autoryzacji serwera.

## 3. Publiczna prezentacja usług

### 3.1. Serwis B2C — WDROŻONE

Serwis przedstawia ofertę fotograficzną, autora, portfolio, ceny/pakiety, dostępne terminy, opinie, treści poradnikowe i wezwania do działania.

Kryteria:

- jasny opis wartości i regionu działania;
- widoczne CTA do rezerwacji lub kontaktu;
- czytelność na telefonie;
- jeden główny H1 na stronę indeksowalną;
- brak wymuszania konta lub newslettera do wysłania zapytania.

### 3.2. Strony lokalne — WDROŻONE

Obsługiwane są landing pages miast, m.in. Toruń, Grudziądz, Chełmno, Wąbrzeźno, Bydgoszcz, Świecie, Lisewo i Płużnica.

Formularz przyjmuje:

- imię;
- rodzaj sesji;
- telefon lub e-mail;
- opcjonalną wiadomość;
- opcjonalną, oddzielną zgodę newsletterową, dostępną po wpisaniu e-maila.

Źródło leada zawiera miasto i kampanię.

### 3.3. Serwis B2B — CZĘŚCIOWE

`aeroanaliza.pl` prezentuje usługi dronowe, termowizję, monitoring i inspekcje. Host jest obsługiwany przez wspólny runtime.

Ograniczenie: część treści B2B ma historyczne odpowiedniki/slug na domenie B2C. Bieżąca sitemap B2C je wyklucza, ale potrzebny jest końcowy audyt canonicali i hostów.

### 3.4. Blog — WDROŻONE W GAŁĘZI

- lista i wpis są renderowane po stronie serwera;
- publikowane są tylko wpisy ze statusem `published` i datą nie późniejszą niż teraz;
- wpis ma title, description, canonical, Open Graph i `BlogPosting` JSON-LD;
- tytuł wpisu jest jedynym H1;
- obraz wyróżniający korzysta z optymalizacji Next Image;
- CTA prowadzi do pakietów i wolnych terminów.

Ograniczenie: dwa stare slugi wymagają kontrolowanej migracji z przekierowaniem 301.

### 3.5. Portfolio i galerie publiczne — WDROŻONE/CZĘŚCIOWE

Sesje portfolio są publikowane z bazy i trafiają do sitemapy. Dynamiczne segmenty adresu są kodowane. Pozostaje ujednolicenie kategorii do trwałych slugów małymi literami.

## 4. Lejek kontaktowy i CRM

### 4.1. Wysłanie zapytania — WDROŻONE

Minimalne dane:

- imię;
- wiadomość;
- telefon lub poprawny e-mail.

Proces:

1. limit prób;
2. walidacja długości i formatu;
3. utworzenie `Inquiry`;
4. opcjonalny zapis zgody newsletterowej;
5. próba powiadomienia e-mail administratora;
6. komunikat sukcesu także wtedy, gdy lead jest zapisany, ale SMTP nie zadziałał.

SMTP nie jest źródłem prawdy. Źródłem prawdy jest baza.

### 4.2. Dane leada — WDROŻONE

CRM przechowuje:

- imię, e-mail, telefon i treść;
- typ usługi;
- źródło i kampanię;
- notatki/kontekst B2B;
- status i czas utworzenia.

### 4.3. Kwalifikacja — WDROŻONE

Administrator ustawia: nowe, skontaktowano, zakwalifikowane, pozyskane lub utracone. API przyjmuje tylko zamkniętą listę statusów.

### 4.4. Widok mobilny — WDROŻONE

Karta leada umożliwia kliknięcie telefonu/e-maila, pokazuje źródło, wiadomość, usługę i stan newslettera.

### 4.5. Mierzenie skuteczności — CZĘŚCIOWE

Zdarzenia konwersji i źródła są rejestrowane, ale brakuje jednego raportu łączącego lead z ofertą, zamówieniem i przychodem.

Docelowe KPI:

- liczba leadów według źródła;
- czas pierwszego kontaktu;
- udział leadów zakwalifikowanych;
- konwersja lead → zamówienie;
- koszt pozyskania;
- przychód według kampanii;
- rezygnacje z newslettera.

Dzisiejsze zamówienie jest pozytywnym sygnałem działania lejka i powinno zostać przypisane do źródła, jeśli dane kampanii są dostępne.

## 5. Newsletter i zgoda

### 5.1. Udzielenie zgody — WDROŻONE W GAŁĘZI

Zgoda:

- jest pusta domyślnie;
- jest dobrowolna i niezależna od regulaminu, kontaktu oraz zakupu;
- opisuje e-mailowe inspiracje, oferty i wolne terminy;
- prowadzi do polityki prywatności;
- wymaga adresu e-mail;
- zapisuje wersję, źródło, czas i dowód techniczny.

Punkty udzielenia: formularz główny, lokalny, B2B, rejestracja, checkout, ustawienia konta i endpoint newslettera.

### 5.2. Wycofanie — WDROŻONE W GAŁĘZI

- odznaczenie w ustawieniach konta;
- indywidualny token i `/newsletter/wypisz`;
- odpowiedź endpointu nie ujawnia, czy token lub adres figuruje w bazie;
- wycofanie nie blokuje wiadomości transakcyjnych.

### 5.3. Wysyłka kampanii — CZĘŚCIOWE

Do kampanii można kwalifikować wyłącznie rekordy `EmailSubscriber.is_active = true`.

BLOKER przed masową wysyłką:

- każdy szablon musi zawierać działający link z `unsubscribe_token`;
- należy dodać rejestr kampanii, błędów i odbić;
- trzeba sprawdzić konfigurację domeny nadawczej oraz reputację.

### 5.4. Informacja prawna — WDROŻONE W GAŁĘZI

Polityka prywatności wyjaśnia zakres, cel, podstawę, czas przetwarzania, wycofanie i rozdzielenie wiadomości marketingowych od transakcyjnych. Sekcja jest widoczna również wtedy, gdy treść główna pochodzi z CMS.

## 6. Rezerwacje, koszyk i płatności

### 6.1. Rezerwacja — WDROŻONE

Klient wybiera usługę/pakiet, datę i opcje. Serwer ponownie sprawdza pakiet, cenę, promocję, kartę i voucher. Nie ufa cenie z przeglądarki.

### 6.2. Koszyk — WDROŻONE

Koszyk łączy wspierane produkty i tworzy unikatowe ID transakcji. Konto klienta jest opcjonalne tam, gdzie dopuszcza to proces.

### 6.3. Płatność dzielona — WDROŻONE

Dostępna dla pojedynczej rezerwacji, jeśli funkcja jest aktywna w ustawieniach. Kwoty są liczone po stronie serwera.

### 6.4. PayU — WDROŻONE/CZĘŚCIOWE

PayU jest aktywnym torem checkout. Status opłacony może pochodzić tylko z poprawnie obsłużonego potwierdzenia. Pola i zależności legacy P24/Stripe nie są dowodem aktywnego wykorzystania.

Testy smoke po każdym wdrożeniu:

- utworzenie zamówienia;
- poprawny redirect;
- potwierdzenie webhooka;
- brak podwójnego zaksięgowania;
- poprawny status w CRM.

### 6.5. Zgoda w checkout — WDROŻONE W GAŁĘZI

Checkbox marketingowy jest przesyłany do API i synchronizowany z CRM. Wcześniej był tylko elementem UI i jego stan był tracony — to anomalia usunięta.

## 7. Konto i portal klienta

### 7.1. Konto — WDROŻONE

Klient widzi przypisane dane, rezerwacje, oferty, umowy, galerie, zamówienia zdjęć i karty w zależności od uprawnień.

### 7.2. Ustawienia — WDROŻONE W GAŁĘZI

Klient:

- zmienia imię, telefon i e-mail;
- zmienia hasło po potwierdzeniu aktualnego;
- udziela lub wycofuje zgodę newsletterową;
- widzi informację, że rezygnacja nie wpływa na obsługę zamówienia.

Zmiana e-maila synchronizuje powiązane oferty i galerie oraz przenosi aktywną zgodę na nowy adres.

### 7.3. Łatwość użycia — CZĘŚCIOWE

Panel ma mobilny interfejs i pogrupowane funkcje. Do profesjonalnego standardu wymagane są:

- pełne testy klawiatury, etykiet i kontrastu;
- spójne stany pusty/ładowanie/błąd;
- testy na realnym telefonie;
- jasny pasek postępu klienta: zapytanie → oferta → umowa → płatność → sesja → galeria.

## 8. Panel administracyjny

### 8.1. CMS — WDROŻONE/CZĘŚCIOWE

Administrator edytuje strony i sekcje przez Page Builder/Page Renderer, media, blog, portfolio, strony B2B oraz ustawienia.

Ograniczenia:

- największe moduły mają ponad 100–350 KB źródła;
- część typów komponentów edytora jest niespójna;
- kopie `.bak/backup` pozostają w `src`;
- build ignoruje błędy typów i ESLint.

### 8.2. CRM i klient — WDROŻONE

Panel obejmuje zapytania, klientów, oferty, umowy, rezerwacje, galerie i zamówienia. Autoryzacja musi zawsze działać w API, niezależnie od ukrycia elementu UI.

### 8.3. Newsletter — CZĘŚCIOWE

CRM pokazuje zgodę przy leadzie. Planowane są:

- filtr aktywnych subskrybentów;
- eksport zgodny z minimalizacją danych;
- historia kampanii i rezygnacji;
- statystyka dostarczeń bez ujawniania nadmiarowych danych.

## 9. SEO — wymagania i stan

### 9.1. Techniczne — WDROŻONE/CZĘŚCIOWE

- canonical i metadane na kluczowych stronach;
- sitemap rozdzielana według domeny;
- robots;
- JSON-LD na wpisach bloga;
- kodowanie dynamicznych segmentów;
- AVIF/WebP i `next/image` w poprawianych obszarach.

### 9.2. Anomalie

- Ahrefs: Health Score 86; 21 błędów, 91 ostrzeżeń, 216 uwag;
- historyczne slugi bloga z utraconymi polskimi znakami;
- część stron ma tylko jeden link wewnętrzny;
- dynamiczny layout ogranicza cache publicznego HTML;
- surowe `<img>` pozostaje w około 68 plikach;
- możliwe duplikaty B2B/B2C wymagają ręcznej weryfikacji.

### 9.3. Kryteria publikacji indeksowalnej strony

1. intencja i unikalna wartość;
2. jeden H1;
3. title zwykle do około 60 znaków;
4. konkretny opis około 140–160 znaków;
5. canonical;
6. poprawny status 200;
7. minimum dwa sensowne linki wewnętrzne, gdy temat na to pozwala;
8. obrazy z alt i wymiarami;
9. obecność w sitemap wyłącznie dla wersji kanonicznej;
10. brak danych prywatnych.

Nie wolno „naprawiać” raportu przez indeksowanie stron konta, rezygnacji lub panelu.

## 10. Wydajność

### 10.1. Budżety docelowe

Na 75. percentylu urządzeń mobilnych:

- LCP ≤ 2,5 s;
- INP ≤ 200 ms;
- CLS ≤ 0,1;
- TTFB publicznego cache hit ≤ 800 ms;
- brak zimnej odpowiedzi > 4 s w krytycznym lejku;
- brak nieuzasadnionych 5xx.

### 10.2. Stan — BLOKER DLA DEKLARACJI „W PEŁNI ZOPTYMALIZOWANE”

Produkcja zwraca publiczny HTML jako `no-store`, a zimne odpowiedzi w próbie audytowej miały około 4–10 s. Wystąpiły przejściowe 502. Źródłem architektonicznym jest m.in. użycie `headers()` w root layout i analityce.

Zmiana cache wymaga osobnego wdrożenia i pomiaru, aby nie cachować kont ani danych prywatnych.

### 10.3. Media

Nowe publiczne funkcje powinny używać Next Image lub uzasadnionego mechanizmu responsywnego. Oryginał zdjęcia nie powinien być pobierany do małej miniatury.

## 11. Bezpieczeństwo i prywatność

Wymagania:

- autoryzacja po stronie serwera;
- minimalne uprawnienia i filtr po właścicielu rekordu;
- walidacja oraz limit prób;
- brak sekretów w kliencie i logach;
- ochrona uploadu, podpisów płatniczych i tokenów;
- szyfrowany transport i nagłówki bezpieczeństwa;
- migracje bez utraty danych;
- dowód zgody i łatwe wycofanie.

Otwarte zadania:

- migracja z `localStorage` do sesji HttpOnly;
- polityka CSP;
- aktualizacja podatnych zależności;
- usunięcie ignorowania błędów kompilacji;
- test autoryzacji wszystkich mutacji.

## 12. Dostępność i UX

Każda nowa funkcja:

- działa klawiaturą;
- ma widoczne etykiety;
- ma minimalny obszar dotyku około 44 px;
- nie komunikuje statusu wyłącznie kolorem;
- ma komunikat błędu i możliwość ponowienia;
- nie stosuje manipulacyjnej zgody ani zaznaczenia domyślnego;
- na mobile zachowuje czytelne CTA i kontakt.

## 13. Powiadomienia

Wiadomości transakcyjne i marketingowe są rozdzielone.

- transakcyjne: realizacja zapytania, rezerwacji, płatności, umowy lub galerii;
- marketingowe: tylko aktywna zgoda;
- awaria powiadomienia nie może cofać prawidłowo zapisanego leada;
- dane odbiorcy i treść muszą być bezpiecznie escapowane;
- błędy są logowane bez haseł, tokenów i pełnych sekretów.

## 14. Testy akceptacyjne bieżącej zmiany

Przed wdrożeniem:

1. migracja na kopii bazy;
2. zapis formularza bez newslettera;
3. zapis formularza z newsletterem;
4. formularz lokalny z samym telefonem;
5. rejestracja i checkout z/bez zgody;
6. widoczność zgody w CRM;
7. włączenie/wyłączenie w koncie;
8. rezygnacja tokenem;
9. brak enumeracji tokenów;
10. blog bez JavaScript zawiera treść, H1 i JSON-LD;
11. sitemap nie zawiera spacji ani stron B2B domeny B2C;
12. build, smoke test i podgląd mobilny.

## 15. Priorytety

### P0 — przed pełnym uznaniem wdrożenia

- wykonać migrację newslettera;
- uruchomić build i Deploy Preview;
- przetestować krytyczne ścieżki;
- potwierdzić produkcyjne formularze i brak 5xx.

### P1 — najbliższy pakiet

- publiczny cache/TTFB bez naruszenia prywatności;
- aktualizacja podatnych zależności;
- zielony typecheck i ESLint;
- cookie-only auth;
- migracja slugów bloga i canonical B2B.

### P2

- podział największych komponentów;
- migracja pozostałych `<img>`;
- usunięcie kopii źródeł i `any`;
- raport lejka z przychodem;
- automatyczne testy dostępności i SEO.

## 16. Rejestr zmiany 2026-07-29

Dodano pełny tor zgody newsletterowej, synchronizację CRM/konta/checkout, dowód zgody i rezygnację. Blog przeniesiono na rendering serwerowy, poprawiono obrazy, strukturę H1, JSON-LD i sitemap. Pełny audyt oraz otwarte ryzyka zapisano w `docs/AUDIT_2026-07-29.md`.

Stan końcowy gałęzi przed wdrożeniem: funkcje zaimplementowane; Prisma schema i build PASS; migracja produkcyjna, preview i smoke test oczekują. Build użył atrapy adresu bazy i zakończył się z wcześniejszymi ostrzeżeniami `archiver`. Pełny typecheck nadal FAIL z powodu długu istniejącego przed tą zmianą.
