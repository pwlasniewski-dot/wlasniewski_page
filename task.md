# Aktualny plan prac

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
