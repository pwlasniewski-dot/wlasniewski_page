# Własne zdjęcie, realizacja i opłacalność — 3 października 2026

Stan: implementacja na PR #99, draft. Nie jest to potwierdzenie wdrożenia produkcyjnego ani zaliczonego pełnego E2E infrastruktury.

## Ścieżka klienta

`/sklep/personalizacja` korzysta z tego samego katalogu, koszyka, PayU i rejestru PhotoOrder co istniejący sklep. CMS wspólnej oferty steruje widocznością oraz tytułem, opisem i przyciskiem. Domyślnie wyłączone. Aktywne konto klienta jest wymagane.

JPEG/PNG do 20 MB, łącznie 50 MB i 100 zdjęć. Serwer nadaje prywatne klucze S3, sprawdza rzeczywiste bajty, hash, format i rozdzielczość, normalizuje orientację i usuwa EXIF. Podgląd jest polem druku z dopasowaniem całego zdjęcia `fitPrintArea`, bez przycinania ani domyślnego obracania. Nie jest fotorealistycznym mockupem ramy lub zawinięcia płótna. Niska albo niepotwierdzona rozdzielczość blokuje koszyk i płatność. Po opłaceniu plik HQ przechodzi osobny preflight i akceptację operatora przed zleceniem produkcji.

Obsługa pojedynczego zdjęcia jest jawnie ograniczona do rozpoznanych rodzin GLOBAL-FAP i GLOBAL-CAN z wymiarami. Książki, kalendarze, nieznane SKU i produkty wielopolowe nie przechodzą kwalifikacji tylko dlatego, że mają pole `default`. Publiczna inwentaryzacja zawiera 699 SKU i nie jest kompletnym katalogiem API. Oddzielny audyt sandbox wszystkich 699 pozycji potwierdził 564 SKU z co najmniej jednym wariantem do Polski (4086 wariantów), 131 bez wariantu PL i 4 odpowiedzi HTTP 404. Z tego 10 publicznych SKU spełnia obecne ograniczenia adaptera FAP/CAN. Wynik: `docs/data/prodigi-sandbox-catalog-audit.json`. Nie jest to kwalifikacja live ani opublikowana oferta.

## Wyniki i granice testów

- Rzeczywista obróbka obrazów Sharp: PNG/JPEG, orientacja i usunięcie EXIF, hash, niepoprawne bajty i rozdzielczość.
- Backend z atrapami DB/S3: właściciel, odmowa dostępu innemu klientowi, limity i rezerwacje równoczesne, CAS zakończenia uploadu, powtórzenie bez drugiego zdjęcia, wyłączenie w CMS.
- React/JSDOM: upload → konfiguracja → podgląd → koszyk → wywołanie zakupu; powrót do koszyka, zmiana ilości, błędy pliku/sieci oraz symulowana płatność. To nie jest rzeczywista transakcja PayU.
- Callback: losowy token przypisany do zamówienia, w bazie tylko hash; fałszywe body ignorowane, aktualny stan odczytywany z Prodigi i powiązany przez ID/referencję/idempotency key. CAS chroni równoczesne zmiany.
- Powiadomienia: zapis podglądu zamiast wysyłki w sandboxie, kodowanie HTML, deduplikacja, nieznany wynik SMTP blokuje automatyczne ponowienie. Zakończenie produkcji/wysyłka nie są oznaczane jako doręczenie.
- `test:prodigi-shop` i `test:gallery-shop` przechodzą. Typecheck nadal ma wcześniejsze błędy całego repozytorium; log przed dodaniem callbacku pozostał identyczny z bazowym (149 linii).

Nowy rzeczywisty test API Prodigi: **ord_1176535**, Created → ponowienie AlreadyExists z tym samym ID → InProgress → Cancelled. Wyłącznie publiczny obraz testowy Prodigi i fikcyjny adres. Wynik: `docs/data/prodigi-sandbox-smoke-20261003.json`; skrypt odtwarzalny `scripts/prodigi-sandbox-smoke.py`, klucz wyłącznie w środowisku. Sandbox nie produkuje ani fizycznie nie dostarcza paczki.

## Co blokuje pełny test infrastruktury

1. Prywatność istniejącego magazynu S3 musi zostać potwierdzona na rzeczywistym obiekcie (anonymous GET 403), wraz z CORS dla uploadu. Sam brak public ACL nie wystarcza przy publicznej polityce bucketu. Dopiero potem `SHOP_UPLOADS_PRIVATE_STORAGE_CONFIRMED=true`.
2. Neon odrzucił utworzenie nowej gałęzi: limit 10. Istniejąca gałąź `dev-prodigi-paid-buffer-20260911` jest oddzielona od main, ale połączenie Prisma do jej endpointu na porcie 5432 z wykonawcy było niedostępne. Nie zapisano testowych zamówień do produkcji ani nie usunięto backupów.
3. Nie potwierdzono konfiguracji PayU sandbox. Klucz Prodigi nie uwierzytelnia płatności PayU. Nie wolno włączać rzeczywistych opłat w celu obejścia testu.
4. Potrzebny zintegrowany test na odizolowanym deployu z dostępem do DB/S3 i PayU sandbox. SMTP należy w nim przechwycić; podgląd wiadomości nie dowodzi dostarczenia e-maila.

## Szacowana nadwyżka na zamówieniu

Świeże wyceny sandbox Budget do Polski, jedna sztuka. Kurs NBP 4,3745 PLN/EUR, tabela 192/A/NBP/2026 z 2026-10-02. Koszt Prodigi obejmuje jego `totalCost` (produkt, dostawa i wykazany podatek). Nie dodajemy `totalTax` drugi raz.

Przykładowe ceny do analizy, **nie zapisane ceny oferty**. Założenia: dostawa klienta 14,99 zł raz na koszyk, prowizja 1,5% wpływu + 0,30 zł, bufor kursowy 2% kosztu dostawcy, rezerwa reklamacyjna 3% wpływu. To założenia, a nie potwierdzone stawki umowy PayU.

| Pozycja | Fine Art GLOBAL-FAP-10X10 | Canvas GLOBAL-CAN-10X10 |
|---|---:|---:|
| Cena produktu klienta | 79,00 zł | 229,00 zł |
| Dostawa klienta | 14,99 zł | 14,99 zł |
| Łączny wpływ | 93,99 zł | 243,99 zł |
| Prodigi totalCost | 11,70 EUR / 51,18 zł | 37,99 EUR / 166,19 zł |
| Założona płatność | 1,71 zł | 3,96 zł |
| Bufor kursowy | 1,02 zł | 3,32 zł |
| Rezerwa reklamacyjna | 2,82 zł | 7,32 zł |
| Nadwyżka przed reklamą, pracą i własnymi podatkami | **37,26 zł** | **63,20 zł** |
| Po przykładowym pozyskaniu klienta za 20 zł | **17,26 zł** | **43,20 zł** |

Przy tych założeniach Fine Art ma niski zapas na płatną reklamę, a Canvas większy kwotowo. Przesunięcie części dostawy do ceny produktu nie obniża kosztu dostawcy; działa tylko przy utrzymaniu wystarczającego łącznego wpływu. Kalkulacja nie jest zyskiem netto: wymaga rozliczenia własnego VAT, faktycznego kursu i prowizji, czasu obsługi, kosztów pozyskania oraz faktury live. Wyceny sandbox nie gwarantują cen live.

Preflight zapisuje w zamówieniu oryginalną kwotę i walutę wyceny, źródło/datę kursu, przeliczenie PLN, wpływ i dostawę klienta. Historyczne wartości pozostają przy zamówieniu; nie są aktualizowane nowym kursem po fakcie.

Źródła: https://www.prodigi.com/print-api/docs/reference/ ; https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json ; wynik rzeczywistego wywołania sandbox zapisany powyżej.
