## Zatwierdzony katalog testowy — 2026-09-14

Najnowszy stan: użytkownik zatwierdził zapis GALLERY_QA_DATABASE_URL w Netlify helpful-axolotl-cc1cbb, tylko dla fix/admin-unification-audit-20260914, Builds i Functions, bez wartości w innych kontekstach. Po wznowieniu przeglądarka miała jedną pustą kartę; wejście w ustawienia projektu pokazało logowanie. Nie zapisano sekretu, nie wykonano redeployu ani zamówienia. Użytkownik następnie połączył integrację Netlify i potwierdzono ten stan; jej operacje nie pojawiły się jednak w bieżącej sesji. Dalsza praca wymaga dostępu, a nie kolejnej zgody na ten sam zakres. Starszy opis odrzucenia poniżej zachowano jako historię.

Po jednoznacznym zatwierdzeniu użytkownika wykonano transakcję wyłącznie na gałęzi Neon audit-admin-unification-20260914 (br-dawn-scene-aeokidlt): aktywne produkty 6–9 z pełnymi opisami i rzeczywistymi materiałami; stare 1/3/4/5 ukryte; wspólna oferta i galeria 26 mają aktualne ceny użytkownika 2,50/1,50 zł oraz dostawę 17/25 zł. Pierwszy rekord ustawień ma publiczny POS PayU 300746 w sandbox oraz callback do preview75. Produkcja została sprawdzona odczytowo: 6–9 nadal nieaktywne. Nie wykonano płatności ani nadania.

Snapshot odczytu docs/NPHOTO_QA_CATALOG.json i scripts/verify-nphoto-qa-catalog.cjs: PASS. Wykonano wspólny loader, projekcję publiczną, wycenę serwerową i interaktywny render React. Pięć ofert, dwa formaty klienta, minimum zdjęć 12/20/16/1, Canvas tylko kurier. Sumy pojedynczych produktów z właściwą dostawą: 58,54 / 274,70 / 157,59 / 144,24 zł. Dziesięć odbitek z Paczkomatem 42 zł; koszyk mieszany 609,07 zł. Test używa zapisanych danych, ale nie wywołuje dostawców i nie tworzy zamówień.

Automatyczny przegląd ponownie odrzucił konkretną czynność: przekazanie uprzywilejowanego adresu połączenia tej bazy do Netlify, żądając osobnej zgody na ujawnienie tego połączenia i dokładny zakres gałęzi. Formularz anulowano bez zapisu. Wymagany zakres: Netlify helpful-axolotl-cc1cbb, sekret GALLERY_QA_DATABASE_URL, tylko fix/admin-unification-audit-20260914, Builds i Functions; puste wartości pozostałych kontekstów. Żaden sekret nie został zapisany w repozytorium. Preview nadal korzysta ze zwykłej bazy; nie można jeszcze wykonywać na nim testowej sprzedaży.

## Odbiór preview — 2026-09-14

Odbiór live commitu 78cd694: Netlify Complete. W przeglądarce potwierdzono odbitki 15×21 za 2,50 zł i realne zdjęcie; cztery produkty nPhoto nadal są szkicami. Użytkownik ustawił też 10×15 za 1,50 zł (format nie należy do wyboru publicznego). Tych cen nie nadpisano. Nieodpłatny test OAuth PayU: dostęp produkcyjny potwierdzony. Preview: brak INPOST_API_TOKEN i INPOST_ORGANIZATION_ID oraz tokenu mapy. Nie potwierdza to stanu InPost w kontekście production. Dalsza poprawka przenosi sekcję zdjęć przed karty, dodaje odnośnik z etykietą CMS oraz naprawia rozpoznawanie preview za proxy i komunikat braku mapy. Regresje: 16 grup storefront i 6 grup readiness PASS.

Wyniki domknięcia: test:gallery-shop PASS (także realny React z progami po zmianie ilości i publikacja); test:admin PASS; jednostkowe 328 + osobny test izolacji PASS. Transport dostawców i baza w testach są podstawione. Build końcowy i preview sprawdzane osobno.

## 2026-09-14 — odbiór widoczności, cen i integracji

Potwierdzono SELECT i przeglądem strony preview: oba przełączniki były włączone, ale wszystkie cztery wybrane produkty pozostały szkicami; odbitki miały 0 zł i były nieaktywne. Dwa wcześniejsze aktywne produkty nie należały do publicznego wyboru. Stąd pusty katalog i mylący status w nagłówku. Naprawę komunikatu oraz atomową publikację sprawdza tests/qa/shop-launch-readiness.cjs.

Odbiór po wdrożeniu preview: otworzyć wspólną ofertę, sprawdzić komunikat pustego katalogu i przycisk aktywacji. Nie klikać publikacji w preview połączonym z produkcyjną bazą bez uzgodnionego uruchomienia oferty. Nowe progi sprawdzić na 2, 3, 5, 6 i 100 odbitkach, także z różnych zdjęć. Sprawdzić panel połączeń oraz wybór punktu przed płatnością.

Automatyczna kontrola odrzuciła otwarcie edytora produkcyjnego DATABASE_URL oraz osobną transakcję konfigurującą testową bazę i publiczny POS sandbox PayU. Nie wykonano tych zapisów. Nie wykonano rzeczywistej płatności, utworzenia etykiety ani zamówienia w nPhoto. Docelowe ustawienia są zapisane do przeglądu w docs/NPHOTO_LAUNCH_PRESET.json; nie wykonują się automatycznie.

## Uzupełnienie audytu 2026-09-14

tests/qa/admin-document-purchase.cjs: sześć scenariuszy wykonujących rzeczywiste endpointy — podpis bez nazwy klienta, pierwszeństwo oryginalnego PDF, odmowa obcej umowy/szkicu, bezpieczny tytuł, asynchroniczny parametr zakupu i wycena z ustawień, odmowa obcego uczestnika. Netlify wdrożyło pierwszy commit PR #75. Po osobnym logowaniu sprawdzono w przeglądarce: jedną pozycję Zamówienia, przekierowanie starego adresu, zachowanie filtrów po odświeżeniu, kontekst galerii 26, szczegóły historycznego zakupu z 21/21 wczytanymi miniaturami, jeden kalendarz oraz blokadę samousunięcia konta. Nie zapisywano danych klientów podczas tego przeglądu.

Dalszy audyt wykrył realne błędy wykonania: GET wyborów rodzica odwoływał się do niezdefiniowanego participant_id, POST ZIP-a do correlationId zadeklarowanego tylko w GET, a null w dniu warsztatu przerywał kalendarz. Poprawiono zakresy zmiennych i walidację dni. tests/qa/gallery-operating-regressions.cjs wykonuje te endpointy (odczyt wyborów, utworzenie/reuse ZIP-a, brak HQ, uszkodzony harmonogram); wszystkie scenariusze przeszły.

## 2026-09-14 — wspólna obsługa administratora

1. npm run test:unit — cały zestaw regresji, w tym aktualne kontrakty wspólnych cen, blokad i dostępu do galerii.
2. npm run test:admin — menu, odrzucenie dostępu, cookie, awaria i ponowienie sesji, spóźnione odpowiedzi, konta, wspólna lista, zapis i ponowne otwarcie etapu, filtr galerii i zmiana galerii podczas ładowania.
3. npm run test:gallery-shop — admin zapis/odczyt → koszyk klienta → szczegóły realizacji, wycena, PayU/ShipX z mockami, niepewna płatność i nadanie.
4. Preview: sprawdzić jeden wpis Zamówienia, link z galerii, filtry, zdjęcia, brak przycisków realizacji przed płatnością. Preview korzystający z bazy produkcji służy wyłącznie do odczytu.
5. Audyt DB: docs/AUDIT_DATABASE_2026-09-14.md. Poprawka 13 NOT NULL w scripts/repair-style-guide-constraints.sql, wyłącznie test na osobnej gałęzi audytowej. Nie jest automatyczną migracją wdrożenia.

Nie przeprowadzono płatnej wysyłki ani zewnętrznego testu PayU/ShipX w tej rundzie.

## 2026-09-14 — jedno miejsce obsługi zamówień

Weryfikacja: node tests/qa/unified-merchandise-orders.cjs i node tests/qa/unified-merchandise-ui.cjs. Sprawdzić przekierowanie gallery-orders, jedną pozycję menu, karty i stare zakupy oraz zamówienie fizyczne z sumą dostawy. Następnie w preview: filtr produktów, szczegóły, zapis etapu, pliki i InPost. Wdrożenie produkcyjne jeszcze nie wykonane.

# Weryfikacja multimediów produktów — 2026-09-14

1. Admin: edytuj film MP4 i rozkładówki, zapisz produkt, odśwież.
2. Podgląd klienta: film pojawia się dopiero po wyborze, bez autoplay; po przejściu na zdjęcia znika.
3. Wnętrze: granice poprzednia/następna, podpis przykładowej realizacji, gest poziomy.
4. Testy: npm run test:gallery-shop. Zapis API sprawdza uprawnienia i błędne adresy.
5. Publiczna oferta i galerie korzystają z identycznych pól bez zmiany koszyka i cen.

Na produkcji zweryfikowano zapis zdjęć Lite i Canvas; wdrożenie kodu pozostaje do potwierdzenia.

Media: tworzenie folderu używa pola tekstowego w panelu zamiast systemowego prompt; folder zostaje utrwalony po dodaniu plików.

Admin udostępnia też kontrolę podglądu o szerokości 390 px; przełącznik jest niedostępny w interfejsie klienta.
