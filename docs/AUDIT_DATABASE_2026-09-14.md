# Audyt panelu i spójności danych — 2026-09-14

Status: poprawki kodu i testy przygotowane do przeglądu. Ten dokument nie oznacza odbioru całego sklepu ani produkcyjnej płatności i wysyłki. Szczegółów klientów, identyfikatorów płatności i danych kont nie umieszczamy w repozytorium.

## Naprawione błędy kodu

- Rezerwacje → Zamówienia to wspólna lista kart podarunkowych, zakupów zdjęć i produktów z dostawą. Usunięto osobne menu i drugi ekran realizacji w galerii. Stary adres przekierowuje; galeria przekazuje filtr do istniejącej listy.
- Mapper rozpoznaje gallery_merchandise, zachowuje snapshot cen i dostawy, wybór zdjęć oraz odbiorcę. Zapis etapu aktualizuje także listę i ponownie otwierane szczegóły. Odświeżenie zachowuje filtry; statusy paid/completed są wspólnie traktowane jako opłacone.
- Panel dopuszcza tylko bieżący i kolejny etap. Nieopłacone zamówienie nie udostępnia produkcji ani nadania. InPost przekazuje numer do formularza realizacji; zakup etykiety nie oznacza automatycznie wysłanej paczki.
- Wspólna sesja rozróżnia 401/403 od awarii 5xx/offline, odrzuca spóźnione odpowiedzi i pozwala ponowić sprawdzenie. Wylogowanie usuwa HttpOnly cookie administratora, zachowując sesję klienta.
- Menu ma jeden kalendarz oraz jeden aktywny cel wybrany po pełnym segmencie ścieżki. Wszystkie jego adresy są objęte testem istnienia i unikatowości.
- Zmiana galerii w trakcie ładowania nie pozwala poprzedniej odpowiedzi nadpisać nowej konfiguracji.
- Konta administratorów: walidacja danych, brak samousunięcia/degradacji, ochrona ostatniego administratora pod wspólną blokadą i ponowne sprawdzenie aktora w transakcji. Nie można tworzyć galerii klienta z wiersza konta administratora. Klienci pozostają w CRM.

## Audyt struktury bazy

Produkcję sprawdzano wyłącznie zapytaniami SELECT. Zmapowano 98 modeli Prisma, 1365 pól skalarnych oraz 83 relacje FK. Nie znaleziono brakujących kolumn ani osieroconych rekordów w sprawdzonych relacjach. Nie wykryto ujemnych kwot, zwrotów większych od wpłat, powtórzonych identyfikatorów płatności w PhotoOrder, obcych/brakujących zdjęć zamówień ani niedokończonych migracji.

Porównanie typów bazowych i wymagalności wykazało 13 różnic NOT NULL: outfit_sets (is_featured,is_active,display_order,created_at,updated_at), style_guide_tips (te same pięć), style_guide_faqs (display_order,is_active,created_at). Obecne rekordy nie mają pustych wartości w tych polach. Dziesięć pól UUID jest zgodnych z @db.Uuid, nie stanowi różnicy.

scripts/repair-style-guide-constraints.sql zaostrza wyłącznie wymagalność tych pól, bez tworzenia zastępczych danych. Zastosowano i sprawdzono 5+5+3 ograniczenia na osobnej gałęzi audytowej Neon. Nie zmieniono schematu produkcji. Skrypt nie jest automatyczną migracją podczas deployu. Pełne porównanie precyzji typów, triggerów i wartości domyślnych pozostaje poza tą kontrolą.

## Rozbieżności danych do odbioru

- Lokalne ustawienia galerii mogą nadpisywać wspólny cennik, dostawę i widoczność oferty. Ujawniono takie wyjątki. Zmiana katalogu wspólnego nie może automatycznie zmieniać historycznych zamówień ani usuwać indywidualnych ofert.
- Część nowych produktów jest nadal szkicami, podczas gdy stare produkty pozostają aktywne, także z brakującymi/zastępczymi mediami. Wymaga to osobnego uporządkowania publikacji oferty.
- Historyczne opłacone zamówienia bez wpisu PaymentLedger mają zgodne identyfikatory, kwoty i walutę w logach COMPLETED PayU. Właściwą ścieżką uzgodnienia jest istniejący scripts/backfill-payment-ledger.ts z trybem dry-run. Nie dodano drugiego rejestru ani nie tworzono księgowań w produkcji. Historyczny log nie jest nowym sprawdzeniem stanu w API PayU.
- Preview współdzielący produkcyjną bazę nie jest miejscem testowych zakupów. Pełny odbiór PayU/ShipX wymaga izolowanej konfiguracji testowej.

## Testy i granice weryfikacji

Zinwentaryzowano 90 tras stron admina i 124 endpointy /api/admin. Alias SEO/headings re-eksportuje chroniony endpoint. Inwentaryzacja nie oznacza ręcznego odbioru każdego formularza.

Pełne testy jednostkowe: 326/326. Testy test:admin oraz test:gallery-shop przechodzą i obejmują zapis/odczyt/render, filtry, wyścig odczytu, dostęp, niepewną płatność/nadanie i realizację. Zewnętrzne usługi są mockowane; nie zakupiono etykiet i nie wykonano rzeczywistej płatności.

Cztery zastane błędy testów wynikały z przestarzałych kontraktów SQL/cen oraz brakującego mocka aktywnego klienta. Dostosowano testy do wspólnych helperów i dodano odmowę dla nieaktywnego oraz obcego klienta. Nie osłabiono zabezpieczeń.

Pełny typecheck nadal zgłasza zastane problemy m.in. w edytorze strony głównej, ofertach PDF i starszych trasach Next.js. Nie są traktowane jako zaliczony test. Build i przegląd nowego preview są odrębnymi bramkami przed wdrożeniem.

## Błędy wykonania ujawnione przez typecheck

Dalszy audyt wykrył realne błędy wykonania: GET wyborów rodzica odwoływał się do niezdefiniowanego participant_id, POST ZIP-a do correlationId zadeklarowanego tylko w GET, a null w dniu warsztatu przerywał kalendarz. Poprawiono zakresy zmiennych i walidację dni. tests/qa/gallery-operating-regressions.cjs wykonuje te endpointy (odczyt wyborów, utworzenie/reuse ZIP-a, brak HQ, uszkodzony harmonogram); wszystkie scenariusze przeszły.

## Dodatkowe regresje dokumentów i zakupów

Podpisana umowa dołącza sekcję potwierdzenia niezależnie od obecności nazwy klienta; przechowywany podpisany PDF nadal ma pierwszeństwo. Dodatkowe odbitki rodzica odczytują asynchroniczny parametr uczestnika i wycenę z zapisanych ustawień. Błędny lub obcy identyfikator nie tworzy zamówienia.

tests/qa/admin-document-purchase.cjs: sześć scenariuszy wykonujących rzeczywiste endpointy — podpis bez nazwy klienta, pierwszeństwo oryginalnego PDF, odmowa obcej umowy/szkicu, bezpieczny tytuł, asynchroniczny parametr zakupu i wycena z ustawień, odmowa obcego uczestnika. Netlify wdrożyło pierwszy commit PR #75. Zalogowany preview przeszedł kontrolę jednej nawigacji Zamówienia, starego przekierowania, filtrów i kontekstu galerii, istniejących szczegółów ze zdjęciami oraz blokady samousunięcia konta. Nie wykonywano zakupów ani zmian danych klienta w tej weryfikacji.

Podczas przeglądu znaleziono błędny skrót pulpitu: Zarządzaj terminami prowadził do kodów rabatowych. Poprawiono cel na wspólny kalendarz. Końcowy typecheck zgłasza 106 diagnostyk w 28 plikach (obejmuje także wygenerowane typy tras i testy). Nie oznacza to 106 potwierdzonych awarii wykonania. Pełny typecheck nadal nie przechodzi; raport i PR pozostają jawne co do niezweryfikowanych pozostałych formularzy.
