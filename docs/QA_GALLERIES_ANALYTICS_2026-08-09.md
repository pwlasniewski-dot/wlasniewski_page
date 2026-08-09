# Raport QA — galerie, oferta/umowa oraz Analytics/SEO

Data: 2026-08-09
Zakres: PR #21, #23, #32 i #33 oraz gałąź integracyjna `qa/gallery-analytics-release`.

## Decyzja

**NO-GO dla produkcji.** Poprawki zamykają najgroźniejsze podatności i porządkują raport finansowy, ale pełny proces sprzedażowy oraz obsługa dużych i grupowych galerii wymagają jeszcze prac opisanych w bramce poniżej.

## Usunięte blokery krytyczne

1. Cena zaakceptowanej oferty jest liczona po stronie serwera; klient nie może zapisać `totalPrice=0`.
2. Podgląd, zamówienie i pobranie indywidualnej galerii mają jeden guard właściciela/administratora/hasła.
3. Pełne JPG są osobnymi prywatnymi obiektami S3. Pobranie nie wykonuje dowolnego `fetch()` adresu z bazy, co usuwa ścieżkę SSRF.
4. Aktualizacja i usuwanie zdjęcia w adminie sprawdzają przynależność do galerii; obsługiwany jest wywoływany przez UI `PATCH`.
5. Galeria jest tworzona jako szkic i nie może zostać wysłana klientowi bez kompletnych źródeł oraz zgodnej liczby zdjęć pakietowych.
6. Analytics V2 wymaga zgody, pomija prywatne trasy i nie zapisuje query, tokenów, pełnego href ani tekstu klienta.
7. Endpoint analityki ma allowlistę zdarzeń/pól, limity danych, walidację origin i czasu aktywności oraz zapis wsadowy.
8. Raport rozdziela wartość rezerwacji od wpłat, zwrotów i wpłat netto; nie przedstawia nieistniejącej ewidencji kosztów jako dochodu.
9. Zaakceptowana oferta jest niezmienna: prośba klienta nie odblokowuje reakceptacji, a zmiana warunków wymaga nowej wersji wysłanej przez administratora.
10. Galeria powiązana z ofertą nie używa cichego fallbacku 10 zdjęć / 20 zł. Brak jawnej liczby zdjęć lub ceny dodatku blokuje utworzenie galerii.
11. Płatności warsztatowe są wysyłane do PayU w groszach; pełna wpłata ręczna odejmuje wcześniej zarejestrowaną zaliczkę.
12. Etykieta źródła ruchu nie jest przyjmowana wprost z metadanych klienta — endpoint wylicza ją z oczyszczonych sygnałów kampanii i referrera.

## Pozostałe blokery wdrożenia

| Priorytet | Obszar | Warunek zamknięcia |
|---|---|---|
| P0 | Duże galerie | Test 100/300/500 JPG na stagingu z prawdziwym S3; jeżeli 500 zdjęć przekroczy limit zadania Netlify, przeniesienie generatora do dłużej działającego workera. |
| P0 | Jakość kompilacji | `npm run typecheck` bez błędów; obecny build pomija walidację typów. |
| P0 | Odbiór staging | Migracja na kopii produkcji oraz E2E oferta → umowa → galeria → PayU → pobranie. |
| P1 | Proces sprzedaży | Snapshot zaakceptowanej oferty, blokadę reakceptacji i zakaz cichego fallbacku dodano; pozostał pełny E2E przez umowę, rezerwację i uprawnienia galerii. |
| P1 | Wybór klienta | Klient wybiera zdjęcia zawarte w pakiecie, a dopiero nadwyżkę kupuje; administrator nie klasyfikuje ręcznie finalnego wyboru. |
| P1 | Galerie grupowe | Gość nie może pobierać, źródła i ZIP są prywatne; trzeba formalnie zatwierdzić, czy zalogowany rodzic ma prawo do całej galerii, czy wyłącznie swoich wyborów. |
| P1 | SEO | Google Search Console: kliknięcia, wyświetlenia, CTR, pozycja, query/page/device/country i porównania okresów dla obu domen. |
| P1 | Finanse | Uzgodnienie i backfill kanonicznego rejestru płatności oraz deduplikacja starszych pól; osobna księga kosztów. Dopiero wtedy wolno raportować dochód. |
| P1 | Integralność analityki | Migracja współdzielonego limitera i krótki test obciążenia na realnym Neon/Netlify; monitoring odrzuconych paczek jest już widoczny w panelu. |

## Raporty docelowe

- Codziennie o 08:00 Europe/Warsaw: poprzedni dzień kalendarzowy, ruch, lejek, wpłaty i alerty jakości.
- Co tydzień: GSC, organiczne landing pages i sprzedaż z SEO.
- Pierwszego dnia miesiąca: zamknięty miesiąc, wpłaty netto, trend 12 miesięcy i średnia z sześciu pełnych miesięcy.
- Dedykowani odbiorcy: `ANALYTICS_REPORT_RECIPIENTS`; jedna wysyłka na okres z zapisem statusu.

## Weryfikacja wykonana

- `npm run test:unit`: 31/31 PASS, w tym współdzielony limiter oraz ZIP 10/50/100/300.
- `npx prisma validate`: PASS.
- `git diff --check`: PASS.
- `npm run build`: PASS; bez lokalnego `DATABASE_URL` użyto istniejących fallbacków. Ostrzeżenie importu `archiver` usunięto przez powrót do kompatybilnej wersji 7.
- `npm run typecheck`: FAIL z istniejącymi błędami obejmującymi m.in. dokumenty PDF, część admina i galerie grupowe; nie wolno ukrywać tego wyniku w decyzji wdrożeniowej.

Niezależny agent QA potwierdził wynik **NO-GO dla produkcji** oraz brak nowych błędów TypeScript w zmienionych ścieżkach. Zakres nadaje się do draft PR i środowiska stagingowego.

## Bramka końcowa

Po zamknięciu P0 wymagane są: migracja na kopii produkcji, E2E oferta→umowa→galeria→płatność→pobranie, test izolacji uczestników, ZIP 100/300/500 na prawdziwym S3 z pomiarem czasu i pamięci, test obciążenia limitera, testy zgody i redakcji tokenów, uzgodnienie wpłat z PayU przez 14 dni oraz niezależna akceptacja QA.
