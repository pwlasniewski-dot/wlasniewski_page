# QA sklepu prywatnej galerii — 11.09.2026

**Wynik: 34 grup sprawdzeń PASS (8 domena + 11 interfejs + 15 serwer). Trzy odrębne rundy klient/admin wykonane na prawdziwych komponentach React. Zmiana pozostaje draftem; nie jest to odbiór produkcyjny ani test Safari.**

## Metoda

`GalleryShoppingPanel` i `GalleryShopAdmin` montowano przez ReactDOM w JSDOM. Testy wykonują rzeczywiste zdarzenia click/input/change/keydown i weryfikują DOM. Adapter HTTP zapisuje/odczytuje konfigurację, wywołuje prawdziwe `priceShopCart`, przechowuje zamówienia i kontroluje sumy. W rundach przed realizacją w adminie adapter jawnie symuluje otrzymanie potwierdzenia płatności.

Osobny test wywołuje prawdziwe `authorizeShop`, `postShopOrder`, `getShopOrder`, `handleMerchandisePayment` oraz handlery API administratora. Prisma, zewnętrzne PayU, mailer i funkcje uwierzytelniania są kontrolowanymi atrapami. Test potwierdza obsługę wyniku autoryzacji i przypisanie zasobów; **nie weryfikuje prawdziwego JWT, sesji, sygnatury webhooka, transakcji PostgreSQL ani sieci**. Moduł płatności jest testowany po punkcie weryfikacji podpisu.

## Wykonane trzy rundy

| Runda | Administrator | Klient | Wynik |
|---|---|---|---|
| 1 | Zmiana ceny 3,50 → 4,25 PLN, zapis i odczyt; odczyt zamówienia i etap realizacji | Cztery zdjęcia po 2 szt.; album; powrót do galerii; dwa zdjęcia w innym formacie; zamknięcie sklepu i powrót; dostawa i zamówienie | PASS: 7 pozycji, 180,00 PLN z dostawą |
| 2 | Zmiana opisu, zapis/odczyt; odczyt kolejnego zamówienia | Usunięcie odbitki, cofnięcie usunięcia, zmiana ilości; dodanie/usunięcie/ponowne dodanie albumu; kolejna odbitka; przerwany wybór produktu, powrót do szkicu, anulowanie wyboru; zamówienie | PASS: 4 pozycje, 135,25 PLN |
| 3 | Ukrycie produktu, zapis, brak produktu u klienta; ponowna publikacja; odczyt zamówienia | Granice ilości 0→1, 1000→99, 1,5→1; usunięcie odbitki; ponowne dodanie w innym formacie; album; zamówienie | PASS: 2 pozycje, 146,00 PLN |

Dodatkowe rzeczywiste interakcje: odtworzenie koszyka po ponownym montażu z sessionStorage; Escape zamyka podgląd bez zamykania zakupów; zmiana ceny podczas zakupów powoduje 409 i świadome ponowienie z nową sumą; synchroniczny podwójny click dodania nie duplikuje zdjęć; powrót z płatności pending zachowuje koszyk i blokuje ponowne zamówienie, cancelled zachowuje pozycje, paid usuwa opłacony snapshot. Ponowny render tego samego komponentu z galerii A do B i z powrotem zachowuje odrębne koszyki; uszkodzony zapis produktu z obcą okładką jest pomijany. Cały test interfejsu wykonał 44 żądania do adaptera, 7 prób POST i utworzył 6 testowych zamówień.

## Domena i serwer

- Autorytatywne ceny, wiele zdjęć oraz jeden kadr w różnych formatach; odrzucenie ilości ujemnej, zera, ułamka, ogromnej i niefinitywnej.
- Zakres zdjęć i okładki, niedostępny format/produkt/sklep/dostawa, niepotwierdzony lub błędny kadr, puste pozycje i duplikaty ID, minimum/maksimum zdjęć, wymagane dane dostawy.
- Prywatna galeria bez dostępu i obcy uczestnik odrzuceni; dodatkowe nieopłacone zdjęcie w galerii indywidualnej odrzucone.
- Zmieniona suma: 409 bez utworzenia zamówienia. Replay tego samego klucza: jedna inicjalizacja PayU; inna treść pod tym samym kluczem oraz `failed_init`: 409 bez ponownej płatności. Fingerprint obejmuje ilość, galerię i uczestnika.
- Odczyt zamówienia ograniczony do zakresu oraz rodzaju merchandise. Klucz prywatnego zamówienia przekazany zgodnie z kontraktem.
- Prawdziwy admin PUT: odrzucenie braku autoryzacji i niepoprawnej konfiguracji; zapis oraz GET odczyt. PATCH produktu z innej galerii: 404.
- Prawdziwy admin PATCH realizacji: blokada braku autoryzacji, nieopłaconego zamówienia, pominięcia i cofania etapów; wysłane bez numeru przesyłki odrzucone. Kolejne etapy z numerem zapisują się.
- Płatności: zła kwota/waluta/identyfikator dostawcy odrzucone; obcy typ nieobsługiwany; anulowanie i odrzucenie zapisują stan. Powtórzone COMPLETED daje jeden wpis księgi i jedno wysłanie pary potwierdzeń do atrap. Późniejsze CANCELED nie cofa paid.

## Wykryte i poprawione w tej iteracji

1. Ułamkowe ilości dochodziły do koszyka — poprawione, test granic PASS.
2. Zmiana ceny mogła prowadzić do powtarzania błędu bez odświeżenia oferty — odświeżenie i ponowne potwierdzenie PASS.
3. Każdy 409 resetował idempotency, także błąd inicjalizacji płatności — kontrakt rozdzielono; klucz zmieniany tylko dla aktualizacji ceny.
4. Refresh tracił koszyk, Escape zamykał cały sklep, podwójne dodanie mogło duplikować pozycje — poprawione i przetestowane.

## Jak powtórzyć

Repo wymaga zainstalowanych zależności (`npm ci`). Dodano `jsdom` jako zależność developerską oraz wspólny skrypt:

```bash
npm run test:gallery-shop
```

Ostatnie wspólne uruchomienie wszystkich trzech komend: exit 0 dla każdej. Harness nie kontaktuje się z prawdziwą bazą, PayU ani skrzynką.

## Ograniczenia i nieuruchomione próby

- Nie uruchomiono Safari/iPhone ani wizualnych testów przeglądarkowych. BrowserCloud nie przyjmuje lokalnego adresu; nie obchodzono ograniczenia. JSDOM nie potwierdza CSS, szerokości ekranu, gestów slidera, scrollowania, wydajności 600+ zdjęć ani zachowania przeglądarki mobilnej.
- Anulowanie zdjęcia/wyboru oraz powrót po anulowanej płatności zostały przetestowane. **Nie ma samoobsługowego anulowania opłaconego zamówienia, zwrotu ani realnej anulacji u PayU**; nie oznaczono ich jako PASS.
- Brak próby produkcyjnego checkoutu, webhooka z podpisem, migracji bazy, realnej księgi, doręczeń maili, InPost i importu nPhoto. Nie inicjowano rzeczywistych zamówień.
- Pełny `npm run typecheck` zwrócił exit 2: wcześniejsze błędy w repo oraz znalezione podczas pracy dwa błędy JSON w nowym endpointcie produktów, zgłoszone autorowi i poprawione przez autora. Końcowy wynik kontroli całego repo dokumentuje prowadzący zmianę; sam PASS testów nie oznacza zielonego buildu.
- Nie twierdzimy, że przetestowano dosłownie wszystkie możliwe kombinacje. Wykonano powyższą macierz i sprawdzenia ryzyk. Odbiór wizualny na telefonie oraz kontrolne środowisko z prawdziwą bazą/PayU sandbox pozostają przed wdrożeniem produkcyjnym.

## Końcowa kontrola repozytorium

`npm run typecheck`: exit 2, 126 diagnostyk w niezmienionych plikach; brak diagnostyk w plikach tej zmiany. `npm run test:unit`: 292 testy, 288 PASS i 4 FAIL. Niepowodzenia dotyczą istniejących testów booking-conversion-funnel, gallery-offer-security (guard wymagający bazy), group-gallery-operating-model (archiwum) i service-growth (SEO). Pliki implementacji sprawdzane przez te cztery niepowodzenia nie były modyfikowane w tej zmianie. Pełny build nie jest potwierdzony. Środowisko wykonywało Node 24.19, projekt deklaruje Node 22; CI/odbiór na Node 22 pozostaje wymagany.

Końcowy `npm run test:gallery-shop`: 8 testów domeny + 11 grup ReactDOM + 15 grup serwera, exit 0. Dodatkowo sprawdzono poprawne zamówienie uczestnika grupowego bez nadania dostępu do plików oraz blokowanie nowego checkoutu po niepewnej płatności (również po zmianie ilości w koszyku).
