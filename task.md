# Aktualny plan prac

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
