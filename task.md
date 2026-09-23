## 2026-09-23 — analityka wizyt i rezerwacji

- [x] Potwierdzić brak szczegółów w projekcji V3 i ogólne nazwy przycisków.
- [x] Uzgodnić zakres: wizyty na górze, mobilne karty, wybory i stany pól bez prywatnych wartości.
- [x] Dodać bezpieczną projekcję sesji oraz testy sortowania, chronologii, filtracji danych i błędów.
- [x] Ukończyć i zweryfikować instrumentację formularza oraz interakcje panelu.
- [ ] Obejrzeć mobilny render na podglądzie HTTPS.
- [x] Niezależny odbiór QA, 59 testów regresji, 10 grup DOM i build.
- [ ] Przygotować PR i sprawdzić wdrożenie kontrolne.
- [ ] Opublikować i potwierdzić produkcję po decyzji właściciela.

## 2026-09-19 — strona ślubna i podgląd linku

- [x] Ustalić przyczynę rodzinnego zdjęcia w podglądzie strony ślubnej.
- [x] Powiązać Open Graph/Twitter z obrazem strony zarządzanym w CMS.
- [x] Usunąć ze strony ślubnej ofertę filmu i poprawić opis fotografii.
- [x] Dodać regresje, uruchomić testy celowane, typecheck i pełny build.
- [ ] Opublikować zmianę i potwierdzić HTML oraz podgląd `/slub` na produkcji.

## 2026-09-16 — naprawa SEO

- [x] Potwierdzić soft 404 na produkcji i sprawdzić metadane oraz podział domen.
- [x] Przygotować poprawkę i bramkę testów SEO.
- [ ] Potwierdzić komplet testów, build i odpowiedzi HTTP na preview.
- [ ] Zweryfikować zapis/odczyt SEO w panelu oraz publiczny HTML.
- [ ] Wdrożyć i zweryfikować produkcję; nie deklarować publikacji bez dowodu.

## 2026-09-14 — poprawka zdarzeń panelu i wyboru odbitek po wdrożeniu

- [x] Odczytać przyczyny 403 w kodzie i rozbieżne formaty/ceny dostawy w bazie.
- [x] Przygotować ograniczoną poprawkę origin i zatrzymanie reportera po odmowie dostępu.
- [x] Dodać regresje wykonywane przed każdym buildem oraz snapshot korekty konfiguracji.
- [ ] Potwierdzić build preview i test:portal-events.
- [ ] Wykonać i odczytać kontrolowaną korektę formatów/dostawy galerii 26.
- [ ] Wdrożyć hotfix produkcyjny i potwierdzić dokładny commit w Netlify.

## 2026-09-14 — decyzja o wdrożeniu produkcyjnym

Użytkownik odmówił przekazania połączenia bazy QA do Netlify, a następnie wyraźnie polecił wdrożyć PR75 na produkcję i zapowiedział własne testy. Odmowa nadal obowiązuje: nie przekazywać GALLERY_QA_DATABASE_URL ani nie traktować wdrożenia jako zgody na ten transfer. Wcześniejsze wpisy o zgodzie na sekret są historyczne i nie obowiązują.

- [x] Potwierdzić zgodę na produkcyjne wdrożenie i odmowę transferu sekretu QA.
- [x] Potwierdzić brak konfliktu z main oraz poprawny deploy preview c74ac0a.
- [ ] Scalić PR75 i potwierdzić publikację właściwego commitu w Netlify.
- [ ] Sprawdzić publiczny sklep, Points i konfigurację mapy po wdrożeniu.
- [ ] Odbiór właściciela: zapis widoczności, zakup, płatność i obsługa wysyłki.

## 2026-09-14 — Netlify po logowaniu

- [x] Potwierdzić autoryzację CLI oraz tożsamość projektu.
- [x] Zapisać i odczytać niesekretny znacznik QA tylko we właściwej gałęzi (Builds/Functions).
- [x] Zdiagnozować produkcję na podstawie odpowiedzi HTTP, metadanych Netlify i dokładnego kodu wdrożenia: stara nazwa tokenu mapy i brak Authorization w Points.
- [ ] Rozstrzygnąć odrzucenie transferu GALLERY_QA_DATABASE_URL przez automatyczny przegląd; nie ponawiano operacji innym sposobem.
- [ ] Po zapisaniu sekretu wdrożyć preview i potwierdzić izolację oraz PayU sandbox.
- [ ] Pełny odbiór zamówienia i testowego InPost; produkcja nadal nie została wdrożona w tym odbiorze.

## 2026-09-14 — zapis widoczności produktów

- [x] Usunąć rozdzielenie zapisu produktu i ustawień; jeden zapis wszystkich szkiców.
- [x] Atomowa walidacja i zapis, kontrola własności, konflikty, zachowanie dziedziczenia.
- [x] Siedem regresji React → API → odczyt → klient oraz dotychczasowe 44 grupy PASS.
- [x] Końcowy build Node 22: PASS, 261/261 tras.
- [x] Zapisać poprawkę w PR75 (119887c), potwierdzić sukces preview i zmianę stanu zapisu w zalogowanej przeglądarce.
- [ ] Po autoryzacji CLI skonfigurować zatwierdzone QA i wykonać odbiór live.

## 2026-09-14 — podłączenie przez Netlify CLI

- [x] Potwierdzić źródło 15/20 zł w lokalnej konfiguracji galerii 26 i 17/25 zł w przygotowanej bazie QA.
- [x] Odtworzyć Points 503 oraz brak mapy w preview; usunąć mylące odesłanie do mapy i wykonać 6 regresji.
- [x] Ponowić build po ENOTEMPTY w wygenerowanym .next/export.

- [x] Zainstalować CLI i sprawdzić dostęp; wymaga osobnego logowania do konta.
- [x] Utworzyć natywny link autoryzacji CLI dla użytkownika.
- [x] Naprawić obsługę jawnego kontekstu Functions i wykonać dwie regresje izolacji.
- [ ] Dokończyć autoryzację CLI, zapisać zatwierdzony sekret oraz niesekretny GALLERY_QA_CONTEXT wyłącznie dla gałęzi odbioru, zakresy Builds i Functions.
- [ ] Redeploy i potwierdzenie izolacji w runtime; następnie testowa płatność i obsługa zamówienia.

## Zatwierdzony katalog testowy — 2026-09-14

- [x] Zatwierdzona konfiguracja osobnej bazy i publicznego POS sandbox PayU.
- [x] Odczyt i wykonanie loadera, wyceny oraz podglądu na faktycznie zapisanym katalogu.
- [x] Osobna zgoda na sekret GALLERY_QA_DATABASE_URL w Netlify helpful-axolotl-cc1cbb, tylko fix/admin-unification-audit-20260914, Builds i Functions; pozostałe konteksty puste.
- [ ] Zapisać zatwierdzony sekret i ponownie wdrożyć preview — sesja Netlify wygasła; integracja jest już połączona, ale jej operacje nie pojawiły się jeszcze w bieżącej sesji.
- [ ] Rzeczywista transakcja sandbox i obsługa wysyłki po podłączeniu.

## Odbiór preview — 2026-09-14

- [x] Odbiór przeglądarkowy PR75: aktywne odbitki 15×21 za 2,50 zł, dostęp OAuth PayU, ujawnione braki InPost w preview.
- [x] Ułatwić znalezienie oferty przed kartami i zachować nowe ceny wpisane przez użytkownika.
- [x] Naprawić komunikaty wspólnej bazy za proxy Netlify i braku tokenu mapy; regresje PASS.

## 2026-09-14 — domknięcie sklepu i dostawy

- [x] Zdiagnozować pusty katalog mimo włączonych przełączników.
- [x] Dodać czytelną informację o pustej ofercie i atomową publikację przygotowanych produktów w istniejącym CMS.
- [x] Wspólne progi cen odbitek: admin, sklep, koszyk, wycena, historyczny snapshot.
- [x] Aktualne autoryzowane API Points i zgodność z nazwą istniejącego tokenu mapy.
- [x] Sprawdzenie połączeń InPost/PayU bez zamówień i opłat w istniejącej sekcji dostawy.
- [x] Przygotować konkretne opisy, realne media, ceny i dostawę 17/25 zł do przeglądu.
- [x] Wykonać zatwierdzony izolowany zapis konfiguracji katalogu i publicznego POS sandbox PayU.
- [ ] Test transakcji sandbox PayU/ShipX — po podłączeniu zatwierdzonej bazy do preview i skonfigurowaniu testowego InPost.
- [ ] Uruchomić katalog na produkcji po odbiorze procesu.

- [x] Naprawić i przetestować błędy odczytu wyborów rodzica, ZIP-a i kalendarza warsztatów.

## 2026-09-14 — audyt i unifikacja admina

- [x] Zapisać stałą zasadę unifikacji w AGENTS.md.
- [x] Usunąć drugi widok zamówień w galerii i zachować filtr we wspólnej liście.
- [x] Naprawić wspólną sesję, menu, odświeżanie i stan realizacji.
- [x] Zabezpieczyć zarządzanie kontami administratorów przed utratą dostępu.
- [x] Sprawdzić produkcyjne relacje, strukturę i historyczne potwierdzenia płatności wyłącznie SELECT.
- [x] Przygotować naprawę NOT NULL na oddzielnej gałęzi Neon.
- [x] Pierwsza runda: 326 testów jednostkowych, regresje admin/sklep, build 261/261 oraz wdrożenie preview PR #75.
- [x] Naprawić i przetestować parametr zakupu odbitek oraz generator podpisanej umowy.
- [x] Build po naprawie dokumentów/zakupu i przegląd zalogowanego preview wspólnych ekranów.
- [ ] Odbiór wszystkich pozostałych formularzy, pełny typecheck oraz izolowana sprzedaż przed produkcją.
- [ ] Osobny odbiór pełnej sprzedaży PayU/ShipX przed uruchomieniem oferty.

## 2026-09-14 — jedno miejsce obsługi zamówień

- [x] Scalić obsługę zamówień z istniejącą listą i usunąć osobny wpis menu.
- [x] Dodać testy mapowania starego/nowego formatu i obsługi realizacji.
- [ ] Sprawdzić build oraz preview w przeglądarce przed produkcją.

## 2026-09-14 — multimedia nPhoto

- [x] Podpiąć brakujące zdjęcia Lite i Canvas na produkcji i sprawdzić po odświeżeniu.
- [x] Dodać edycję filmu i rozkładówek oraz wspólny odczyt.
- [x] Testy domeny, API i React obejmujące zapis i ponowny render.
- [ ] Wdrożyć i sprawdzić prezentację w przeglądarce.
- [ ] Dokończyć import do Mediów, koszty wariantów i uruchomienie katalogu.

## 2026-09-09 — Mobilne oglądanie zdjęć

W toku: mobilne hero/portfolio, wspólny lightbox, FB po zdjęciach i streaming home. Następne bramki: niezależny QA, build, podgląd wdrożenia i kontrola. Bez migracji DB i nowych płatnych usług.

## 2026-09-08 — nawigacja portfolio

- [x] Potwierdzić niejednoznaczny powrót i brak sesji niewyróżnionych w kategorii.
- [x] Dodać jawny powrót do listy portfolio oraz osobny link do kategorii.
- [x] Pokazać wszystkie opublikowane sesje i ich tytuły z CMS.
- [x] Testy renderu obu układów, nazw i adresów: 7/7.
- [x] Build: 255/255; typecheck: zero błędów w zmienionym zakresie, 126 w pozostałych plikach.
- [ ] Opublikować zmianę i sprawdzić podgląd.

## 2026-09-06 — opinie, promocje, Google Ads

- [x] Odczytać 7 aktualnych publicznych opinii Google.
- [x] Przetestować import w osobnej gałęzi Neon, sprawdzić idempotencję.
- [x] Dodać 6 opinii i uaktualnić jedną na produkcji, zachować 3 Facebook.
- [x] Sprawdzić API, stronę główną, rezerwację i 8 stron miast.
- [x] Przygotować kod wspólnych promocji/opinii oraz prawidłowych konwersji.
- [x] Testy cen, dat, renderu informacji cenowych, opinii i konwersji: 18 przechodzi. Typecheck: 126 błędów istniejących też na main; brak nowych błędów.
- [x] Przygotować 2 reklamy, 20 nagłówków, 8 opisów, 10 słów, 15 wykluczeń, linki i ustawienia pomiaru.
- [ ] Uzyskać zgodę wymaganą przez auto-review na push do publicznego repozytorium pwlasniewski-dot/wlasniewski_page.
- [ ] Utworzyć draft PR i podgląd wdrożenia; sprawdzić CMS save/read/render, dane oferty, mobilny wygląd i konwersję. Bez tego nie scalać.
- [ ] Wdrożyć kod i potwierdzić na produkcji cenę 600 zł na /fotograf-torun, licznik Google 7 oraz brak konwersji z samej wizyty na /kontakt.
- [ ] Połączyć Google Ads, zweryfikować konto i zapisać kampanię wstrzymaną.
- [ ] Budżet i limit CPC zatwierdza użytkownik na końcu. Bez zatwierdzenia nie uruchamiać wydatków.

# Aktualny plan prac

## 2026-08-29 — produkcyjny błąd 413 przy zdjęciach galerii

- [x] Potwierdzono, że żądania binarne są odrzucane przez Netlify przed wejściem do API galerii.
- [x] Zastąpiono transport zdjęcia dwuetapowym uploadem: bezpośredni PUT do S3 oraz autoryzowana finalizacja JSON.
- [ ] Deploy Preview i produkcyjny smoke test na rzeczywistym pliku powyżej 4,5 MB.

## 2026-08-29 — Studio voucherów prezentowych

- [x] Audyt istniejących kart, wydruku, e-maila, panelu, API i modelu Prisma.
- [x] Czytelne wejście `Vouchery / prezenty → Studio voucherów` oraz wzory szybkiego startu.
- [x] Opcjonalny e-mail, edycja odbiorcy/nadawcy/treści/ważności i przełącznik ceny.
- [x] Spójny podgląd, zapis przed drukiem, natywny druk lub PDF oraz bezpieczna wysyłka e-mail.
- [x] Addytywna migracja `GiftCard.show_price` i zgodność publicznego widoku odbiorcy.
- [x] Testy celowane generatora i kontraktu Studio voucherów.
- [x] Pastelowy redesign wydruku i podglądu: firmowe logo, bez przycisku i adresu rezerwacji na voucherze.
- [x] Build produkcyjny 253/253; testy celowane 5/5; pełny zestaw 234/235 z jednym zastanym testem wymagającym `DATABASE_URL`.
- [ ] Deploy Preview, migracja produkcyjna, scalenie oraz smoke test produkcji.

## 2026-08-28 — naprawa przerwanego crawla SEO

- [x] Potwierdzono, że produkcyjne `robots.txt`, sitemap i homepage zwracają `200`, lecz odpowiedź trwa 5–9 sekund.
- [x] Zastąpiono dynamiczną trasę statycznym `robots.txt` niezależnym od Next.js, bazy i CMS.
- [x] Zachowano osobny statyczny plik oraz sitemapę dla Aero Analiza.
- [x] Dodano całodobowy cache CDN i tygodniowe podawanie poprzedniej poprawnej wersji podczas odświeżenia.
- [x] Testy celowane: 10/10; pełny zestaw: 229/230 (jedyny zastany test galerii wymaga `DATABASE_URL`); `git diff --check`: PASS; build: 253/253.
- [x] Opublikowano PR #51 i potwierdzono `200`, statyczną odpowiedź, cache CDN oraz osobne sitemapy obu domen na produkcji.
- [ ] Ponowić zewnętrzny crawl po propagacji wersji.

## 2026-08-27 — PR #50: grafik usług i rezerwacje do 02:00

- [x] Rozdzielono dostępność sesji, ślubów, przyjęć, urodzin i drona na siedem dni tygodnia.
- [x] Dodano edytor grafiku i wyjątków daty w `/admin/rezerwacja`; zapis jest autoryzowany i walidowany.
- [x] Zastąpiono 24 przyciski jednym mobilnym wyborem wyłącznie wolnych godzin z jawnym zakończeniem następnego dnia.
- [x] Checkout waliduje grafik serwerowo, obsługuje przejście przez północ i blokuje oba dni nocnej rezerwacji.
- [x] Teksty nowego wyboru godziny podpięto do istniejącego CMS lejka.
- [x] Dodano addytywną migrację, testy domeny godzin nocnych oraz zgodność ICS/e-mail/kalendarza administratora.
- [x] Build produkcyjny: 254/254 stron. Testy celowane: 29/29; pełny zestaw: 226/227, jedyna porażka to zastany test galerii wymagający `DATABASE_URL`.
- [x] Zaktualizowano PR #50, odebrano Deploy Preview i sprawdzono mobilnie sesję oraz wydarzenie kończące się po północy.
- [x] Zastosowano migracje produkcyjne, scalono PR #50 i wykonano kontrolę publicznego formularza.

## 2026-08-27 — PR #50: poprawka kalendarza Deploy Preview

- [x] Zidentyfikowano rozjazd: kalendarz pozwalał wybrać 29 sierpnia, a endpoint godzin poprawnie wymagał daty od 3 września przy siedmiodniowym wyprzedzeniu.
- [x] Ograniczono zapytania dostępności do pól potrzebnych przy konflikcie, bez zależności od nowych kolumn atrybucji przed migracją.
- [x] Dodano walidację odpowiedzi, blokadę kalendarza podczas ładowania i awarii, czyszczenie wyboru oraz przycisk ponowienia.
- [x] Test regresji lejka rezerwacji: 15/15; brak błędów TypeScript w zmienionych plikach.
- [x] Zaktualizowano gałąź PR #50, odebrano nowy Deploy Preview i sprawdzono wyszarzenie dat przed terminem minimalnym.
- [x] Po pozytywnym podglądzie zastosowano migracje, wykonano smoke test i scalono PR.

## 2026-08-24 — FotoDron: CRM, galerie grupowe i widoczność administratora

- [x] Formalny model galerii komunijnej: pełne pobranie dla uwierzytelnionego rodzica, wybory tylko do odbitek, płatne dodatki osobno, zgoda publikacyjna niezależnie, Adobe pozostaje.
- [x] Read-only audyt produkcyjnego Neon dla ofert Damian Liszaj / Smykowska oraz wszystkich galerii grupowych #16, #19 i #20.
- [x] Rozpoznanie anomalii 49 różnych ZIP-ów dla 3 rodziców, częściowych paczek oznaczonych sukcesem i braku telemetrii.
- [x] Cofnięcie roboczych ograniczeń UI/API, które uzależniały cyfrowe pobieranie od wyborów lub płatności.
- [x] Projekt transakcyjnego wyboru odbitek, statusu `DRAFT/SUBMITTED`, niezmiennego snapshotu i dziennika aktywności galerii.
- [x] Kod atomowego, współdzielonego per hash manifestu generatora ZIP; jeden artefakt, osobny audyt żądań rodziców i poprawne `READY/FAILED`.
- [x] Audytowane wydanie linku Adobe oraz telemetry `REQUESTED/CREATED/REUSED/BUILD_STARTED/READY/FAILED/LINK_ISSUED`.
- [ ] Jeden background eksport manifestu drukarni z zatwierdzonych wyborów i opłaconych dodatków zamiast serii paczek per rodzic.
- [x] Usunięcie adminowej pętli paczek per rodzic; pozostawienie jednego eksportu wszystkich manifestów i osobnego eksportu pojedynczego profilu.
- [x] Panel incydentów i codzienny raport administratora: logowanie, rejestracja, wybory, ZIP, brak HQ i osobne metryki Adobe/internal.
- [x] Inwentaryzacja pustych tabel i wskazanie kandydatów legacy bez usuwania danych; raport w `docs/FOTODRON_PRODUCTION_AUDIT_2026-08-24.md`.
- [ ] Bezpieczna naprawa danych #20 i #16 po backupie, kopii produkcji, uzgodnieniu nazw/profili/płatności i akceptacji właściciela.
- [x] Migracje danych na Neon staging: świeży reset z produkcyjnego `main`, 11 brakujących migracji zastosowanych atomowo, historia Prisma 18/18 poprawna, liczby rekordów before/after bez zmian, zero osieroconych relacji.
- [x] Backfill galerii na stagingu: 46 kompletnych historycznych zestawów `LEGACY_REVIEW_REQUIRED`, 18 częściowych/pustych `DRAFT`, bez utraty 244 wyborów.
- [x] QA kodu: test kontraktu galerii 5/5 i CRM 53/53, kontrola składni oraz produkcyjny build Netlify przechodzą.
- [x] Wdrożenie kontrolne zakończone: PR #48 scalony do `main`, produkcja Netlify opublikowana, chronione trasy i publiczne ekrany wejściowe przeszły smoke test.
- [x] Produkcyjny Neon: backup `predeploy-backup-crm-20260826`, 11 migracji zastosowanych atomowo, historia Prisma 18/18 poprawna, liczby rekordów bez zmian i zero wykrytych osieroconych relacji.
- [x] Oferty #67 i #75 oznaczone jako zastąpione odpowiednio przez kanoniczne #68 i #78; korekty zachowane w audycie CRM bez kasowania historii.
- [ ] Pozostały QA operacyjny: pełne E2E na rzeczywistym koncie klienta, test prawdziwego S3/ZIP 100/300/500, eksport odbitek i kontrolowany test alarmu e-mail.

## 2026-08-21 — profesjonalna przebudowa Aero Analiza

- [x] Osobny publiczny shell, menu, stopka, manifest, metadata i schema bez elementów fotografii.
- [x] Formularz RFQ z jednym kontraktem/API, zapisem do `Inquiry`, kwalifikacją zlecenia i jedynym adresem `pwlasniewski@gmail.com`.
- [x] Kanoniczne strony termowizji, PV, dachów, monitoringu i kujawsko-pomorskiego oraz allowlista sitemap.
- [x] Naprawa `robots.txt`, canonical hosta `www`, przekierowań historycznych i botów wyszukiwania Google/Bing/OpenAI.
- [x] Dostępne porównania RGB/termowizja bez fałszywego HUD; status zgodności pary edytowalny w CMS.
- [x] Kontrolowana migracja treści v2 w Pages CMS: podgląd zmian, jawne potwierdzenie, pełny snapshot rekordu i zachowanie istniejącej pary termicznej.
- [x] Walidacja publikacji Aero po stronie serwera: allowlista modułów, jeden H1, jeden formularz, bezpieczne CTA i jawny status zgodności par termicznych.
- [x] Formularz odporny na podwójne wysłanie: unikalny identyfikator żądania, zapis przed powiadomieniem e-mail i obsługa powtórzeń.
- [x] Osobna polityka prywatności i cookies oraz analityka lejka Aero działająca wyłącznie po zgodzie, bez wysyłania danych z formularza.
- [x] Usunięcie jawnych connection stringów z bieżących skryptów.
- [x] Osobny jasny renderer i pełny system wizualny Aero: hero, karty, proces, formularz, header, footer, cookies, polityka prywatności i porównania termiczne bez dominującego czarnego motywu.
- [x] Pełny zestaw testów jednostkowych: 125/125.
- [x] Oddzielny lejek Aero w Analityce V3: sesje/CTA/start/wysłanie tylko dla `aeroanaliza.pl` oraz kanoniczna liczba zapisanych zapytań z `Inquiry`.
- [x] `git diff --check` i skan bieżącego drzewa pod kątem jawnych connection stringów oraz starych adresów kontaktowych: bez trafień.
- [ ] Rotacja ujawnionych danych bazy, secret scan historii Git i sprawdzenie aliasów `b2b.`/`dron.` w DNS/Netlify.
- [ ] Ręczne przypisanie i weryfikacja prawdziwych par RGB/termowizja w Media Library.
- [x] Lokalny build bez bazy: PASS, 247 tras; oczekiwane fallbacki CMS i ostrzeżenia Prisma nie przerwały generowania.
- [ ] Podgląd wdrożeniowy z bazą/SMTP w obsługiwanym Node.js 22 oraz `prisma migrate deploy` przed promocją wersji.
- [ ] Aktualizacja zależności po `npm audit` (22 podatności produkcyjnych, w tym 17 wysokich) przed decyzją o wdrożeniu.
- [x] Niezależny QA kodu zakończony werdyktem NO-GO dla produkcji do czasu wykonania zadań oznaczonych wyżej jako niewykonane.

## 2026-08-09 — bramka wdrożeniowa galerie + Analytics/SEO

- [x] Audyt PR #21, #23, #32 i #33: bezpieczeństwo, UX klienta/admina, spójność oferty i galerii, analityka oraz raport finansowy.
- [x] Serwerowe przeliczanie zaakceptowanej oferty i naprawa indeksów dodatków.
- [x] Wspólna autoryzacja podglądu, zamówień i pobrań galerii indywidualnej.
- [x] Prywatne pełne JPG w S3, kontrolowany odczyt obiektu i blokada publikacji niegotowej galerii.
- [x] Consent-first Analytics V2, redakcja prywatnych adresów i jawne zdarzenia początku/utworzenia rezerwacji.
- [x] Raport: wartość rezerwacji, kanoniczny PaymentLedger, wpłaty, zwroty, dwie średnie sześciu pełnych miesięcy i organiczne strony wejścia.
- [x] Unit testy nowych reguł 31/31, Prisma validate oraz build produkcyjny PASS z ostrzeżeniami środowiskowymi.
- [x] Trwałe zadanie ZIP w tle z postępem, retry, prywatnym artefaktem S3 i linkiem TTL; testy syntetyczne 10/50/100/300 PASS.
- [ ] Testy ZIP 100/300/500 na stagingu z prawdziwym S3 oraz formalny model uprawnień pobrań galerii grupowych.
- [x] Trwały snapshot zaakceptowanej oferty i blokada ręcznej zmiany warunków galerii.
- [ ] Pełny E2E snapshotu przez umowę/rezerwację oraz wybór zdjęć przez klienta w ramach limitu.
- [ ] Integracja Google Search Console i księga kosztów/przychodów; do tego czasu raport nie może nazywać wpłat „dochodem”, a historia sprzed PaymentLedger jest częściowa.
- [ ] Usunięcie istniejących błędów typechecku i niezależny odbiór QA przed wdrożeniem.
- [x] Niezależny odbiór QA zmian: zakres dopuszczony wyłącznie do draft PR/staging, produkcja NO-GO.

## 2026-08-04 — odbiór strony `/sesja`

- [x] Jasny, redakcyjny wygląd dla `/sesja` oraz `/sesja-rodzinna`, bez zmiany pozostałych stron Pages.
- [x] Wybór kadru desktop/mobile i `Cover`/`Contain` dla Hero oraz bloku „Zdjęcie i tekst”.
- [x] Jasne/piaskowe/ciemne tło w edytorze bloku „Zdjęcie i tekst”.
- [ ] Niezależna kontrola jakości i odbiór właściciela w lokalnym podglądzie.
- [ ] Testy lint oraz build przed decyzją o commicie.

## 2026-08-04 — wzorzec sprzedażowej strony usługi: sesja rodzinna

- [x] Ustalony model jednej kanonicznej strony `/sesja-rodzinna`, bez mnożenia podobnych adresów.
- [x] Szablon Pages „Sesja rodzinna — Toruń” z hero, przygotowaniem, galerią, tekstem lokalnym i CTA.
- [x] Widoczny H1 tylko w pierwszym hero szablonu; pozostałe nagłówki pozostają H2.
- [x] Lint projektu bez błędów blokujących; pełny build rozpoczęty po generacji Prisma, końcowy wynik wymaga potwierdzenia z powodu przerwanego logu środowiska.
- [ ] Odbiór QA i właściciela przed commitem.
- [ ] Po publikacji strony: własne zdjęcia z ALT, Title/Description, FAQ i linki z Portfolio/strony głównej.

## 2026-08-04 — rozdzielenie Wlasniewski.pl i Aeroanaliza.pl

- [x] Inwentaryzacja historycznych adresów B2B, Foto-Match i pustej Historii.
- [x] Trwałe przekierowania dronowe oraz catch-all `/b2b/*` z domeny fotograficznej do Aeroanaliza.pl.
- [x] Noindex dla Foto-Match i Historii; usunięcie ich z mapy strony fotograficznej.
- [x] Canonicale oraz sitemap Aeroanaliza dla stron dynamicznych i usług B2B.
- [x] Lint zmienionych plików bez błędów.
- [ ] Odbiór właściciela i deploy przed przesłaniem odświeżonej mapy strony do Google Search Console.

## 2026-08-03 — dwa warianty Portfolio zarządzane z admina

- [x] Wariant 01 „Edytorskie rozdziały” spójny z nową stroną główną.
- [x] Wariant 02 „Kontakt filmowy” dla dynamicznego reportażu.
- [x] Globalny przełącznik wyglądu w `/admin/portfolio`, bez duplikacji zdjęć S3.
- [x] Połączenie kart usług strony głównej z Portfolio i zachowanie linków sprzedażowych.
- [x] Ochrona szkiców, poprawne kategorie, canonical i metadata sesji.
- [x] Natychmiastowe odświeżanie cache po zmianach sesji i wyglądu.
- [x] Lint zmienionych ekranów oraz pełny build produkcyjny PASS.
- [ ] Niezależny odbiór QA i akceptacja właściciela przed commitem.

## 2026-08-03 — pełny redesign strony głównej

- [x] Pełne treści z produkcji wplecione w redakcyjny układ przez istniejące, edytowalne bloki CMS.
- [x] Nadrzędność `sections`/`home_sections`; kompletna kopia awaryjna działa wyłącznie bez danych CMS.
- [x] Zdjęcia kopii awaryjnej działają w lokalnym podglądzie mimo lokalnego problemu z certyfikatem optymalizatora.
- [x] Pełnoekranowe, filmowe Hero z redakcyjną typografią oraz odpornym fallbackiem.
- [x] Fotograficzna galeria usług zamiast czarnego bloku cennikowego.
- [x] Spójna paleta, rytm i typografia dla modułów sterowanych z CMS.
- [x] Nowy wygląd poradnika, karty podarunkowej, Local SEO i końcowego CTA.
- [x] Zachowane menu, aktualne ceny, linki, teksty CMS i logika rezerwacji.
- [x] Build produkcyjny PASS; błędy braku lokalnego `DATABASE_URL` obsłużone istniejącymi fallbackami.
- [x] Testy kontraktowe strony głównej, Local SEO i cen: 10/10 PASS.
- [x] Kontrola wizualna: desktop i telefon 390 px, bez poziomego przewijania.
- [x] Zachowanie tekstów Hero z CMS; fallback wyłącznie dla pustych pól.
- [x] Edycja desktop/mobile i kadrowania trzech kafli oferty w panelu strony głównej.
- [x] Edycja kategorii ceny i linku docelowego każdego kafla oferty.
- [x] Rozróżnienie awarii CMS od świadomie pustych sekcji i opinii.
- [x] Mobilny moduł opinii w naturalnej wysokości i z poprawnym kontrastem.
- [ ] Odbiór wizualny właściciela przed commitem i pushem.

## 2026-08-02 — korekta strony głównej po odbiorze właściciela

- [x] Usunięta ciężka czarna karta poradnika i podwójne obramowanie.
- [x] Nowa dedykowana grafika rodzinna, zoptymalizowana do WebP.
- [x] Jasny moduł redakcyjny przeniesiony za sekcje budujące zaufanie.
- [x] Zachowane istniejące teksty, poprawione kadrowanie i wysokość na telefonie.
- [x] Czyste linkowanie do `/jak-sie-ubrac` z obrazu, H2 i CTA.
- [x] Jeden stabilny H1 strony głównej; slajdy używają H2.
- [x] Test strony głównej 8/8, poradnika 9/9, build produkcyjny PASS.
- [ ] Odbiór wizualny i akceptacja właściciela przed commitem.

## 2026-08-02 — Pages, menu i promocja publicznego poradnika

- [x] Jedna karta systemowa publicznego poradnika w Pages; zwykły legacy szkic nie jest dublowany na liście.
- [x] Edycja wszystkich używanych zdjęć, ALT, podpisów i opisów publicznych kart.
- [x] Publikacja, menu i SEO w tym samym edytorze.
- [x] Realistyczne rodzinne karty zamiast wcześniejszych ilustracji bez twarzy na publicznym poradniku.
- [x] Pozycja „Jak się ubrać” w menu oraz wizualny kafel na stronie głównej.
- [x] Dynamiczne Article/OG/Twitter metadata, canonical i pojedynczy wpis sitemap.
- [x] Test poradnika 9/9, test strony głównej 8/8, build produkcyjny PASS.
- [ ] Niezależny recheck QA i akceptacja właściciela przed commitem.

## 2026-08-02 — Finalny recheck przed akceptacją

- [x] Dodane 10 zoptymalizowanych kart naturalnych ustawień rodzinnych.
- [x] Osobne opisy HTML, tekst alternatywny i rozwijanie czterech dodatkowych kart.
- [x] Publiczny poradnik nie przekierowuje do logowania po wygaśnięciu sesji.
- [x] Usunięte widoczne nakładki błędów menu, analityki i ustawienia hero przy niedostępnej bazie.
- [x] Publiczny poradnik: 9/9 testów; strona główna/Local SEO/ceny: 8/8; API przygotowania: 30/30.
- [x] Build produkcyjny PASS bez działającej lokalnej bazy.
- [x] Kontrola w działającej przeglądarce: desktop 1440 px i telefon 390 px.
- [ ] Commit i push dopiero po akceptacji właściciela.

## 2026-08-01 — Nocny przegląd strony głównej

- [x] SSR hero zamiast czarnego ekranu do czasu hydratacji.
- [x] Responsywny obraz LCP, jeden H1 i obsługa ograniczonego ruchu.
- [x] Fallback strony i metadata przy niedostępnym CMS/Prisma.
- [x] Open Graph, Twitter i canonical strony głównej.
- [x] Hero 68svh i mobilne karty usług z widocznym fokusem.
- [x] Usunięcie sztywnych kwot z kart; ceny pozostają w aktualnym procesie rezerwacji.
- [x] Bez zmian cen, ofert, CMS i bazy.
- [x] Testy kontraktowe SSR/fallback/SEO.
- [ ] Commit i push po odbiorze właściciela.

## 2026-08-01 — Profesjonalny poradnik „Jak się ubrać i pozować”

- [x] Publiczny poradnik SSR/HTML z pełną strukturą people-first.
- [x] Ubiór, kolory do miasta/natury/domu, rodziny, pary, dzieci i naturalne pozowanie.
- [x] Trzy gotowe scenariusze, checklista, FAQ, autor i data aktualizacji.
- [x] CTA do rezerwacji i zapowiedź pełnego poradnika.
- [x] Bezpieczna strona produktu w statusie „w przygotowaniu”, bez fikcyjnej ceny i checkoutu.
- [x] Metadata, canonical, Open Graph, JSON-LD, sitemap i linkowanie wewnętrzne.
- [x] Publicznie 17 zoptymalizowanych ilustracji, w tym 10 kart inspiracyjnych; bez ujawnienia prywatnych 30 kart.
- [x] Skrót „Przygotowanie klienta” w globalnym Sidebarze admina.
- [x] Testy kontraktowe i renderowe.
- [ ] Commit i push po odbiorze właściciela.

## 2026-08-01 — Edycja „Przygotowania” w Pages

- [x] Systemowa pozycja poradnika na liście `/admin/pages`.
- [x] Edycja 15 porad garderobowych, 7 palet, 3 checklist, 12 FAQ i 30 kart pozowania.
- [x] Wybór obrazów z istniejącej biblioteki Media.
- [x] Usuwanie obrazów porad, palet i póz.
- [x] Pełny katalog i unikalność identyfikatorów wymuszane przez backend.
- [x] Walidowany zapis po stronie serwera bez migracji bazy.
- [x] Odczyt CMS przez chronione API klienta z fallbackiem obecnych treści.
- [x] Testy API 26/26, targetowany lint i build 229/229 PASS.
- [ ] Commit i publikacja po akceptacji właściciela.

## 2026-08-01 — Czytelność mobilna i teksty pozowania

- [x] Widoczne nazwy wszystkich sekcji Panelu Klienta na telefonie.
- [x] Większe kafelki, ikony, kontrast i obszary dotykowe.
- [x] Usunięta sekcja „Gdy pojawia się napięcie”.
- [x] Wszystkie 30 kart przepisane naturalnym językiem.
- [x] Testy 26/26, targetowany lint i build 228/228 PASS.
- [ ] Commit i publikacja po akceptacji właściciela.

## 2026-07-31 — Panel Klienta „Przygotowanie”

### Zakończone

- [x] Chroniona zakładka „Przygotowanie” w Panelu Klienta.
- [x] Karta wejściowa na ekranie „Przegląd”.
- [x] 15 ilustrowanych porad „Jak się ubrać”, w tym sesja miejska.
- [x] Obrazy dopinane również do aktywnych porad pochodzących z CMS.
- [x] Ilustrowane palety uzupełniające częściowy zestaw CMS, w tym kanoniczne „Miasto: cegła, beton i szkło”.
- [x] Wyeksponowane zakładki, większe opisy i próbki kolorów.
- [x] 30 ilustrowanych kart pozowania.
- [x] Zamknięcie publicznych dróg dostępu do kategorii `pose`.
- [x] Testy API, autoryzacji, responsywności 320 px i powiększenia 200%.
- [x] Lokalne fonty i niezależny od sieci build.
- [x] Lokalny, wieloplatformowy generator Prisma.

### Weryfikacja

- [x] `npm run build` — PASS, 228/228 stron.
- [x] `npm run test:preparation-guide` — 24/24 PASS.
- [x] Targetowany ESLint — PASS.
- [x] Produkcyjny smoke test `/logowanie` i `/konto` — HTTP 200.
- [x] Niezależny QA — GO.

### Publikacja

- [x] Właściciel zaakceptował commit i push.
- [x] Wszystkie fonty, obrazy WebP, testy, helpery i skrypt Prisma dodano do zakresu.
- [x] Pierwsza publikacja modułu na GitHub `main` i Netlify.
- [ ] Commit i publikacja poprawek ilustracji, palet oraz czytelności po akceptacji właściciela.

## 2026-07-29

- [x] Trwały zapis formularzy jako leadów.
- [x] Telefon lub e-mail jako kanał kontaktu.
- [x] Rozróżnienie fotografii i B2B.
- [x] Mobilna lista leadów i statusy sprzedażowe.
- [x] Korekta sitemap.xml i robots.txt.
- [x] AVIF/WebP, cache analityki i pojedyncze ładowanie Google Tag.
- [x] Produkcyjny build.
- [ ] Deploy Preview i test formularza po publikacji.
- [ ] Dług TypeScript i konfiguracja ESLint — osobny pakiet.
## 2026-09-22 — stabilizacja SEO i 502

- [x] Potwierdzić statusy, canonicale, robots, sitemap i sporadyczne 502.
- [x] Oddzielić krótkotrwały cache marketingowy od aktualnej ceny checkoutu.
- [x] Usunąć globalne blokowanie metadanych dla każdej przeglądarki.
- [x] Naprawić kolizje sitemap i historyczne adresy 404.
- [x] Uruchomić testy SEO, cen/oferty i pełny build bez produkcyjnego `DATABASE_URL`.
- [ ] Utworzyć PR i sprawdzić deploy preview.
- [ ] Po akceptacji scalić i potwierdzić TTFB/statusy produkcji oraz GSC po 3, 7 i 14 dniach.
