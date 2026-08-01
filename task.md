# Aktualny plan prac

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
