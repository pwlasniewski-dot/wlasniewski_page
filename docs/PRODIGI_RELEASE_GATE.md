# Prodigi: kontrola gotowości do realizacji

Etap 24.09.2026. Kontynuacja `PRODIGI_STAGE_2026_09_24.md` i aneksu B2B v8.

## Granica zakresu

Nowy moduł jest czystą funkcją kontroli danych, a nie endpointem ani automatem
zamawiania. Nie zapisuje zatwierdzeń, nie wysyła zdjęć i nie wykonuje płatności.
`ordersEnabled:false` pozostaje bez zmian. Pozytywna odpowiedź preflight nie jest
tokenem uprawnienia i nie może być użyta przez klienta jako zgoda na druk.

Nie zmieniamy istniejącego eksportu ZIP:
`src/app/api/admin/galleries/[id]/shop/orders/[orderId]/production/route.ts`.
To odrębny proces ręcznej realizacji, nie adapter Prodigi.

## Docelowe wpięcie — jeszcze niewykonane

1. Dane wejściowe buduje serwer z zamówienia, wersji specyfikacji, przypisanych
   plików, zapisanych akceptacji, rozliczenia oraz wyceny dostawcy. Nie bierze
   stanu zapłaty ani zatwierdzenia z JSON przysłanego przez przeglądarkę.
2. Serwer weryfikuje uprawnienia klienta/admina, własność galerii i pliku,
   uprawnienia do reprodukcji, jakość pliku oraz kwalifikację SKU i usługi dostawy.
3. Wszystkie ceny zamówienia są historycznym snapshotem. Koszt dostawcy nie
   nadpisuje ceny klienta. Zmiana wariantu/ceny wymaga odrębnej akceptacji i
   rozliczenia, także gdy stara wpłata wystarczyłaby na nową cenę.
4. W transakcji porównujemy rewizję zamówienia i zapisujemy jedno trwałe zadanie
   realizacji. Ocena gotowości poza transakcją nie chroni przed równoległą edycją.
5. Worker ponownie odczytuje stan, używa trwałego klucza idempotencji oraz blokady
   realizacji. Timeout po wysłaniu oznacza UNKNOWN i uzgodnienie z dostawcą,
   a nie nowe zlecenie. Cofnięcie/anulowanie wymaga osobnego procesu.
6. Podpisane zdarzenia lub odczyt statusów aktualizują istniejące zamówienie
   i jego paczki. Nie powstaje drugi rejestr `/commerce`.

Do tego potrzebne są uzgodnione relacje i trwałe rekordy wersji/akceptacji/outbox.
Na tym etapie nie ma migracji ani powiązania nowej funkcji z bazą/API.

## Rozdzielenie produktów i usług

Zlecenie może zawierać sesję, spacer i montaż, ale do druku trafiają tylko pozycje
fizyczne z zatwierdzoną specyfikacją. Zgoda na publikację spaceru nie jest zgodą
na druk. Sesja bez produktu nie generuje pustego zamówienia do laboratorium.
Drugi korpus aparatu ani opis posiadania pliku HQ nie są dowodem jakości obrazu.

## Odbiór produkcyjny — nadal NOT RUN

- zapis akceptacji przez uprawnionego klienta i ponowny odczyt w adminie;
- próba dostępu obcego klienta, zmiany ceny, pliku i wariantu po akceptacji;
- dwa równoległe żądania i timeout dostawcy bez podwójnego zamówienia;
- rzeczywisty sandbox z poprawnym SKU, specyfikacją i adresem;
- kontrola UI telefonu, klawiatury, zoomu i dostępności;
- faktura, śledzenie wielu paczek, anulowanie, refund, reklamacja i reprint.

Testy czystej funkcji nie zastępują żadnego z powyższych odbiorów.

## Wyniki lokalnego odbioru

- `npm run test:prodigi-release`: 33 PASS, 0 FAIL; 20 grup autora i 13 przypadków
  niezależnego QA. Końcowe trzy rundy po doprecyzowaniu kontraktu: każda 33 PASS.
  Nie sumujemy powtórzeń jako 99 odrębnych testów.
- `npm run test:prodigi-foundation`: ponownie 83 testy/grupy PASS.
- `npm run test:gallery-shop`: PASS, regresja istniejącego procesu galerii.
- Ścisłe `tsc` nowego modułu i dwóch testów: PASS. Pełnego typecheck/build repo
  nie powtarzano; wcześniejsze globalne błędy nadal nie mają odbioru.
- Node 24.19.0; repo wymaga Node 22, odbiór na tej wersji pozostaje do wykonania.
- `POD-QA-F01` (P2): doprecyzowano znaczenie `amountGrosze` jako line total,
  a nie unit price. Poprawka w komentarzu kontraktu, retest PASS.
- Polityka pierwszej wersji: wymagana pełna wpłata za całe zamówienie z usługami
  i dostawą, nie tylko koszt druku. Płatności etapowe B2B i kredyt są poza zakresem.
  Produkty mają dodatnią wartość; darmowe próbki nie przechodzą tego kontraktu.

Dowody: `docs/qa/prodigi-release-gate-review.md`,
`docs/qa/prodigi-release-round-{1,2,3}.log` i oba pliki testów.
W PDF v9 dopisano strony 96–98; zachowano wcześniejsze 95 stron.
`B2B-02` pozostaje OPEN: zaimplementowano wyłącznie część logiki, bez adaptera
serwerowego, trwałego zapisu proof i integracji z realizacją.
