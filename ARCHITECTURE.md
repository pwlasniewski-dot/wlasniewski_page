# Architektura platformy wlasniewski.pl

Stan dokumentu: 2026-07-29

Właściciel biznesowy: FOTO-DRON Przemysław Właśniewski

Gałąź bazowa audytu: `main` / `c0fd4e5`

Powiązane dokumenty: `FUNCTIONAL_SPECIFICATION.md`, `docs/AUDIT_2026-07-29.md`, `PROJECT_HISTORIA.md`, `task.md`

## 1. Kontrakt dokumentacyjny — wejście i wyjście każdej zmiany

Te dokumenty są częścią produktu, a nie opisem dodatkowym.

Przed rozpoczęciem zmiany należy:

1. przeczytać `ARCHITECTURE.md` i `FUNCTIONAL_SPECIFICATION.md`;
2. sprawdzić `task.md`, ostatni wpis w `PROJECT_HISTORIA.md` i właściwy raport audytu;
3. wskazać dotknięte domeny, modele, endpointy, integracje, SEO, CRM, wydajność i prywatność;
4. ustalić sposób wdrożenia, migracji, testu i wycofania.

Przed zakończeniem zmiany należy:

1. zaktualizować architekturę, jeżeli zmieniły się zależności, dane, bezpieczeństwo lub wdrożenie;
2. zaktualizować specyfikację, jeżeli zmieniło się zachowanie użytkownika lub administratora;
3. dopisać wykonane testy, migracje, ryzyka i wynik wdrożenia do historii oraz `task.md`;
4. przejść checklistę `.github/pull_request_template.md`;
5. nie używać określeń „bezpieczne”, „100%” ani „production-ready” bez aktualnego dowodu.

Każdy wpis zmiany powinien podać: datę, zakres, pliki, modele, endpointy, testy, wpływ na SEO/CRM/wydajność, migrację, wdrożenie i rollback.

## 2. Cel i granice systemu

Jedno repozytorium obsługuje:

- serwis B2C fotografa na `wlasniewski.pl`;
- serwis B2B na `aeroanaliza.pl`;
- publiczny lejek sprzedażowy i rezerwacje;
- konto oraz portal klienta;
- panel administracyjny i CRM;
- galerie, oferty, umowy, płatności, produkty i kampanie;
- treści CMS, blog, portfolio oraz strony lokalnego SEO.

System nie jest obecnie bezwarunkowo „w pełni zoptymalizowany”. Audyt wykazał działający szeroki produkt, ale także dług typów, zależności, cache, uwierzytelniania i wielkości modułów. Szczegóły są w raporcie audytu.

## 3. Stos technologiczny

- Next.js 15.5, App Router, React 18, TypeScript.
- Tailwind CSS, Framer Motion i komponenty React.
- PostgreSQL, Prisma 5.22; schemat ma 81 modeli.
- Netlify i `@netlify/plugin-nextjs`.
- AWS S3 dla mediów.
- PayU jako aktywny tor płatności w checkout; w schemacie pozostają pola legacy P24/Stripe.
- SMTP/Nodemailer dla wiadomości.
- Google Analytics, Google Tag Manager i Meta Pixel konfigurowane z panelu.
- Playwright dla E2E; pełna bramka testowa nie obejmuje jeszcze wszystkich ścieżek.

Wymagany runtime: Node.js 20 lub nowszy.

## 4. Topologia i routing domen

```text
Internet
  ├─ wlasniewski.pl ─┐
  └─ aeroanaliza.pl ─┴─ Netlify → Next.js App Router
                                   ├─ Server Components / HTML
                                   ├─ Route Handlers / API
                                   ├─ Prisma → PostgreSQL
                                   ├─ AWS S3
                                   ├─ PayU
                                   └─ SMTP / analityka
```

Root `middleware.ts` rozpoznaje host:

- ruch `aeroanaliza.pl` przepisuje wewnętrznie do `/b2b`;
- panel, API i galerie są wyłączone z tego przepisywania;
- `wlasniewski.pl` korzysta ze standardowego drzewa B2C;
- middleware nie uwierzytelnia panelu ani API.

Bezpieczeństwo tras jest egzekwowane w handlerach API przez `withAuth`, `requireAuth`, weryfikację JWT lub dedykowany mechanizm portalu. Nie wolno opisywać `localStorage` jako mechanizmu ochrony serwera.

## 5. Warstwy aplikacji

### 5.1. Prezentacja

- `src/app`: około 170 stron App Router.
- `src/components`: 114 komponentów.
- `PageRenderer` renderuje treść CMS.
- Publiczne strony powinny preferować Server Components i `next/image`.
- Interakcje, formularze i rozbudowane edytory pozostają Client Components.

### 5.2. API

- `src/app/api`: około 300 handlerów.
- Największe domeny: admin, galerie, foto-wyzwanie, Foto-Match, klient, karty podarunkowe i płatności.
- Publiczne wejścia muszą mieć walidację, limit prób i neutralne komunikaty błędów.
- Operacja biznesowa ma najpierw utrwalić dane krytyczne, a dopiero potem wykonywać zawodne skutki uboczne, np. SMTP.

### 5.3. Dane

Kluczowe grupy modeli:

- tożsamość: `AdminUser`, `User`, role i uprawnienia;
- sprzedaż: `Inquiry`, `Booking`, `Offer`, `Contract`, `Cart`, zamówienia;
- marketing: `EmailSubscriber`, `AnalyticsEvent`, kody promocyjne;
- treści: `Page`, `BlogPost`, `PortfolioSession`, biblioteka mediów;
- galerie i zdjęcia: galerie klienta/grupowe, zdjęcia i zamówienia;
- produkty: karty podarunkowe, albumy NPhoto;
- programy: Foto-Wyzwanie i Foto-Match;
- konfiguracja i audyt: `Setting`, logi systemowe.

Zmiany produkcyjnego schematu wykonuje się wyłącznie migracją Prisma:

```bash
npx prisma migrate deploy
```

`prisma db push` jest zarezerwowane dla świadomego użycia lokalnego. Migracja musi zostać wykonana przed uruchomieniem kodu zależnego od nowych kolumn.

## 6. Lejek sprzedażowy i CRM

### 6.1. Wejścia

- formularz główny B2C;
- formularze lokalnych stron miast;
- formularz B2B;
- checkout i rejestracja;
- kampanie oraz parametry źródła.

`POST /api/contact`:

1. ogranicza częstotliwość;
2. waliduje imię, wiadomość oraz telefon lub e-mail;
3. zapisuje `Inquiry` w bazie;
4. zapisuje zgodę newsletterową tylko po jawnym zaznaczeniu;
5. próbuje wysłać powiadomienie administratorowi;
6. nie usuwa leada, gdy SMTP zawiedzie.

CRM `/admin/inquiries` pokazuje kontakt, źródło, usługę, wiadomość, status procesu i aktywność zgody newsletterowej. Statusy: `new`, `contacted`, `qualified`, `won`, `lost`.

Dowodem skuteczności lejka są konwersje i zamówienia, ale pojedyncze zamówienie nie jest jeszcze statystycznym potwierdzeniem. Należy mierzyć: źródło → lead → kontakt → oferta → zamówienie → przychód.

## 7. Newsletter, zgoda i prywatność

Newsletter jest opcjonalny i niezależny od realizacji zapytania lub umowy.

Jedynym źródłem stanu wysyłkowego jest `EmailSubscriber.is_active`. Model przechowuje:

- znormalizowany e-mail;
- źródło i wersję zgody;
- czas udzielenia oraz wycofania;
- skrócony adres IP i user-agent jako dowód techniczny;
- losowy token rezygnacji;
- czas aktualizacji.

`User.marketing_consent_at` odzwierciedla stan zgody na koncie klienta. Helper `src/lib/newsletter.ts` synchronizuje oba modele.

Punkty zapisu:

- formularze kontaktowe;
- rejestracja;
- checkout;
- ustawienia konta;
- `POST /api/newsletter/subscribe`.

Wycofanie:

- ustawienia konta;
- `POST /api/newsletter/unsubscribe`;
- publiczna, nieindeksowana strona `/newsletter/wypisz?token=...`.

Każdy przyszły szablon newslettera musi dodawać indywidualny link rezygnacji. Wiadomości transakcyjne dotyczące zamówień, rezerwacji i umów nie zależą od zgody marketingowej.

## 8. Uwierzytelnianie i autoryzacja

Istnieją oddzielne konteksty administratora, klienta i fotografa. Serwer zawsze sprawdza token/cookie i powiązanie rekordu z użytkownikiem.

Aktualny dług:

- część interfejsów przechowuje token JWT w `localStorage`;
- zwiększa to skutek ewentualnego XSS;
- docelowo interfejs powinien używać krótkiej sesji w `HttpOnly`, `Secure`, `SameSite` cookie oraz ochrony CSRF dla mutacji;
- migracja musi objąć wszystkie klienty API i testy regresji, dlatego jest osobnym zadaniem P1.

Wszystkie endpointy administracyjne zostały objęte audytem heurystycznym. Eksport `/api/admin/seo/headings` prowadzi do chronionego handlera; nie jest publicznym wyjątkiem.

## 9. SEO

### 9.1. Zasady

- każda indeksowalna strona ma jeden H1, unikalny title, opis i canonical;
- sitemap zawiera wyłącznie kanoniczne, indeksowalne adresy;
- segmenty ścieżek pochodzące z bazy muszą być kodowane;
- strony prywatne, konto, rezygnacja i narzędzia administracyjne są `noindex`;
- B2B i B2C nie powinny tworzyć indeksowalnych duplikatów między domenami;
- obrazy publiczne powinny używać `next/image`, właściwego `alt`, rozmiarów i nowoczesnego formatu.

Blog listy i wpisu jest renderowany serwerowo. Wpis zawiera canonical, Open Graph, jeden H1 oraz JSON-LD `BlogPosting`.

### 9.2. Dane bazowe audytu Ahrefs

Raport z 2026-07-28: Health Score 86, 145 crawlowanych URL, 328 zgłoszeń, w tym 21 błędów. Część zgłoszeń dotyczy stron nieindeksowalnych i nie powinna być naprawiana przez ich indeksowanie.

Naprawiono w bieżącej gałęzi:

- surową spację w adresie portfolio w sitemapie;
- kodowanie segmentów dynamicznych;
- wykluczenie stron B2B z mapy B2C;
- serwerowy rendering bloga i hierarchię H1;
- zdjęcia bloga przez `next/image`.

Pozostaje migracja dwóch historycznie uszkodzonych slugów bloga oraz kontrola linkowania wewnętrznego.

## 10. Wydajność

Statyczne zasoby mają długie cache w Netlify, a obrazy negocjują AVIF/WebP. Ustawienia analityki są cache’owane.

Główna anomalia:

- root layout oraz rozpoznawanie hosta używają `headers()`;
- publiczny HTML jest przez to dynamiczny i produkcja zwraca `private, no-cache, no-store`;
- zimne odpowiedzi z audytu miały około 4–10 s, a dwa adresy zwróciły przejściowe 502;
- samo `revalidate = 3600` nie daje ISR, jeśli nadrzędny layout wymusza dynamiczne renderowanie.

Docelowa zmiana P0/P1:

1. rozdzielić zależność od hosta od publicznego layoutu;
2. wydzielić layouty B2C/B2B albo przekazać kontekst bez dynamicznego odczytu na każdej stronie;
3. mierzyć TTFB, LCP, INP i błędy funkcji przed i po zmianie;
4. nie cache’ować spersonalizowanych paneli i API.

Inny dług: 133 pliki z `force-dynamic`, duże edytory administracyjne, około 68 plików z surowym `<img>`, 12 kopii `.bak/backup`, około 943 użycia `any` i 160 `console.log/debug`.

## 11. Bezpieczeństwo

Aktywne zabezpieczenia:

- TLS/HSTS, `nosniff`, `DENY` dla ramek, polityka referrera i ograniczenia uprawnień;
- walidacja krytycznych wejść;
- rate limiting wybranych publicznych endpointów;
- autoryzacja API po stronie serwera;
- weryfikacja ceny i zasobów checkout po stronie serwera;
- unikatowe tokeny rezygnacji bez ujawniania istnienia subskrybenta.

Otwarte ryzyka:

- 18 podatności produkcyjnych z `npm audit --omit=dev`: 13 high i 5 low, bez critical;
- ignorowanie błędów TypeScript i ESLint w buildzie;
- tokeny w `localStorage`;
- publiczne API bloga wymaga dalszego rozdzielenia widoku publikacji od panelu;
- brak jednolitej CSP;
- kopie źródeł wewnątrz `src` zwiększają powierzchnię utrzymania.

Szczegóły i definicje ukończenia są w `docs/AUDIT_2026-07-29.md`.

## 12. Wdrożenie i rollback

Standard:

1. mała gałąź funkcjonalna;
2. migracja przejrzana osobno;
3. `npm ci`;
4. Prisma validate/generate;
5. typecheck, lint, testy i build;
6. Deploy Preview oraz test krytycznych ścieżek;
7. migracja produkcyjna;
8. wdrożenie aplikacji;
9. smoke test i monitoring;
10. dopisanie wyniku do dokumentacji.

Obecnie typecheck i lint nie są zieloną bramką — jest to jawny blocker jakości, a nie akceptowalny sukces. Do czasu usunięcia długu należy co najmniej porównywać listę błędów i upewniać się, że zmiana nie dodaje nowych.

Rollback aplikacji wykonuje się przez poprzedni artefakt/commit. Migracji danych nie cofa się automatycznie, jeżeli grozi to utratą zapisanych zgód; przygotowuje się migrację naprawczą.

## 13. Rejestr bieżącej zmiany

### 2026-07-29 — pełny audyt, newsletter, CRM i SEO

- modele: rozszerzenie `EmailSubscriber`;
- migracja: `20260729193000_add_newsletter_consent_evidence`;
- API: kontakt, zapytania, newsletter, rejestracja, checkout, profil;
- UI: formularze B2C/B2B/lokalne, CRM, ustawienia konta, polityka prywatności;
- SEO/wydajność: serwerowy blog, JSON-LD, `next/image`, poprawiona sitemap;
- dokumentacja: pełne zastąpienie architektury i specyfikacji, raport audytu, checklista PR;
- walidacja: Prisma schema PASS; pełny TypeScript FAIL przez istniejący dług opisany w audycie;
- walidacja build: PASS (kod 0) z atrapą `DATABASE_URL`; pozostały wcześniejsze ostrzeżenia `archiver` i brak danych z bazy;
- wdrożenie: oczekuje na migrację, preview, smoke test i zatwierdzenie.
