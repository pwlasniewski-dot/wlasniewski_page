## Uzupełnienie audytu 2026-09-14

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
