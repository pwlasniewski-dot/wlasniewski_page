# Niezależny QA — preflight wydania do Prodigi

Data: 2026-09-24. Zakres: czysta funkcja `evaluateProdigiRelease`, bez połączenia z bazą, API dostawcy i panelem produkcyjnym.

## Werdykt

**PASS w granicach zadeklarowanego kontraktu; NIE jest to zgoda na wdrożenie produkcyjne.** Nie stwierdzono otwartych błędów P0/P1 w badanej funkcji. Pozostałe wymagania integracyjne poniżej są bramkami przyszłego wdrożenia, nie wynikami zaliczonych testów E2E.

## Powtarzalne wykonanie

```sh
node --import tsx --test tests/unit/prodigi-release-gate.test.ts tests/unit/prodigi-release-gate-adversarial.test.ts
```

- 20 grup scenariuszy autora + 13 testów niezależnego recenzenta = **33 PASS, 0 FAIL, 0 SKIP**.
- Dwa kolejne wspólne uruchomienia: ten sam wynik. Dodatkowo niezależny zestaw 13 testów uruchomiony osobno: 13 PASS.
- Środowisko recenzenta: Node v24.19.0. Repozytorium deklaruje Node >=22 <23: powtórzenie w docelowym Node 22 pozostaje wymagane przed wdrożeniem.
- Testy są lokalne, na syntetycznych rekordach; nie wysłano zamówień, płatności, faktur ani wiadomości.

## Macierz kontroli

| Obszar | Próba i oczekiwany wynik | Wynik |
|---|---|---|
| Bufor po płatności | Sesja oczekująca blokuje także opłacony i zaakceptowany druk | PASS, POD-R02 |
| Zgoda klienta | Brak proof blokuje; zgoda na publikację nie zastępuje proof | PASS, POD-R04 / QA-12 |
| Tożsamość i wersja | Cudzy klient/zamówienie oraz skopiowane proof innej pozycji blokują | PASS, POD-R06/R08 / QA-01/02 |
| Plik produkcyjny | Preview, brak pliku, pending/failed preflight blokują | PASS, POD-R05/R06 / QA-11 |
| Zmiana zamówienia | SKU, ramka, kadr, ilość, kwota, ID/hash pliku unieważniają proof i quote | PASS, POD-R07 / QA-03/04 |
| Dostawa | Zmiana adresu/usługi unieważnia quote, nie sam proof zdjęcia | PASS, POD-R09 / QA-05 |
| Czas | Quote wygasłe dokładnie w nowMs, błędna chronologia i przyszłe proof blokują | PASS, POD-R10/R11 / QA-08/09 |
| Rozliczenie | Niedopłata, refund powodujący brak pokrycia i spór blokują | PASS, POD-R12 / QA-06 |
| Kwoty | Wymagana suma to pozycje plus dostawa; błędne zwroty, ułamki, NaN, overflow odrzucane | PASS, POD-R13/R14/R15 |
| Powtórne wysłanie | submitting/submitted/unknown oraz anulowanie blokują | PASS, POD-R03 / QA-07 |
| Pozycje | Usługi nie trafiają do listy druku; duplikaty ID blokują; każda odbitka wymaga proof | PASS, POD-R01/R16/R17 / QA-00/10 |
| Stabilność | Kolejność kluczy nie zmienia hash; brak mutacji i danych wrażliwych w wyniku | PASS, POD-R18/R19 |
| Ograniczenia zakresu | Nieprawidłowa ilość/kadr/hash/obszar druku i darmowy druk odrzucane | PASS, POD-R20 |

## Zgłoszenie i pętla poprawki

**POD-QA-F01 — P2, niejednoznaczna semantyka amountGrosze. ZAMKNIĘTE.**

1. Recenzent wskazał ryzyko potraktowania pola jako ceny jednostkowej, mimo że sumowanie nie mnoży go przez quantity.
2. Autor dopisał jawny kontrakt: utrwalona wartość całej pozycji, po uwzględnieniu ilości i uzgodnionych rabatów. Nie cena jednej sztuki.
3. Autor doprecyzował pełne pokrycie całego zamówienia oraz wykluczenie darmowych próbek z tej wersji.
4. Recenzent ponownie przeczytał finalny kontrakt i wykonał oba zestawy: 33 PASS.

## Obowiązkowe ograniczenia i bramki przed produkcją

- **AUTH/DB:** adapter musi pobrać autoryzowane rekordy klienta/zamówienia, rzeczywiste rozliczenia oraz niezmienne zgody ze źródła serwerowego. Hash nie jest podpisem, autoryzacją ani dowodem kliknięcia klienta. Dane z przeglądarki nie mogą samodzielnie tworzyć gotowości.
- **RACE/OUTBOX:** ponowna kontrola i przejście stanu muszą nastąpić atomowo przed wysłaniem. Lokalna funkcja nie rozwiązuje dwóch równoległych zleceń, idempotencji, wyścigu z refundem ani odpowiedzi timeout. `unknown` wymaga uzgodnienia z dostawcą, nie ślepego retry.
- **PROVIDER:** dostawca/SKU/atrybuty/obszar druku, wymiary, plik, wysyłka i koszt wymagają rzeczywistej kwalifikacji oraz odpowiedzi API. Ta funkcja nie dowodzi istnienia produktu ani obsługi InPost. `expiresAtMs` jest oknem operacyjnym adaptera, nie gwarancją ceny od Prodigi.
- **PAYMENT:** wyłącznie PLN i pełne pokrycie pozycji wraz z dostawą, po zwrotach. Zaliczki, płatności etapowe B2B i odroczone terminy nie są obsługiwane. Koszt dostawcy nie jest należnością klienta. Brak oceny rentowności/marży w tym module.
- **ASSET:** stan preflight musi wynikać z faktycznego sprawdzenia pliku oraz jego hash; nie z deklaracji klienta. Nie przetestowano tu rozdzielczości, profilu koloru, fizycznego wydruku ani wizualizacji kadru.
- **UI/E2E:** brak nowego widoku, API zamówienia, utrwalania approval, prawdziwych płatności, faktur/KSeF, wysyłek, reklamacji i testów mobilnych. Usługi pozostają w istniejącym zamówieniu, ale nie są produktami kierowanymi do Prodigi.
- **ENV:** testy docelowego Node 22, pełny build oraz regresja aplikacji pozostają osobnymi wymaganiami. Wynik 33 PASS nie zastępuje ich i nie oznacza usunięcia wcześniejszych błędów repozytorium.

Recenzent nie modyfikował implementacji. Dodał jedynie niezależne testy i niniejszy raport na polecenie koordynatora. Publikowanie zmian i aktualizacja dokumentacji wdrożeniowej należą do koordynatora.
