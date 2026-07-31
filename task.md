# Aktualny plan prac

## 2026-07-31 — Panel Klienta „Przygotowanie”

### Zakończone

- [x] Chroniona zakładka „Przygotowanie” w Panelu Klienta.
- [x] Karta wejściowa na ekranie „Przegląd”.
- [x] 15 ilustrowanych porad „Jak się ubrać”, w tym sesja miejska.
- [x] 30 ilustrowanych kart pozowania.
- [x] Zamknięcie publicznych dróg dostępu do kategorii `pose`.
- [x] Testy API, autoryzacji, responsywności 320 px i powiększenia 200%.
- [x] Lokalne fonty i niezależny od sieci build.
- [x] Lokalny, wieloplatformowy generator Prisma.

### Weryfikacja

- [x] `npm run build` — PASS, 230/230 stron.
- [x] `npm run test:preparation-guide` — 19/19 PASS.
- [x] Targetowany ESLint — PASS.
- [x] Produkcyjny smoke test `/logowanie` i `/konto` — HTTP 200.
- [x] Niezależny QA — GO.

### Publikacja

- [x] Właściciel zaakceptował commit i push.
- [x] Wszystkie fonty, obrazy WebP, testy, helpery i skrypt Prisma dodano do zakresu.
- [ ] Publikacja na GitHub `main` i weryfikacja buildu Netlify.

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
