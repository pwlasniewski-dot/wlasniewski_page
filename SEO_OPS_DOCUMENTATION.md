# SEO Ops — Dokumentacja modułu SEO

## Spis treści

1. [Przegląd systemu](#1-przegląd-systemu)
2. [Architektura plików](#2-architektura-plików)
3. [API Backend — seo-ops/route.ts](#3-api-backend)
   - 3.1 [GET — Pełny raport audytowy](#31-get-pełny-raport-audytowy)
   - 3.2 [POST — Wieloakcyjny handler](#32-post-wieloakcyjny-handler)
4. [Panel Admin — seo/page.tsx](#4-panel-admin)
   - 4.1 [Metryki główne](#41-metryki-główne)
   - 4.2 [PageSpeed Insights](#42-pagespeed-insights)
   - 4.3 [Agent AI SEO](#43-agent-ai-seo)
   - 4.4 [Analityka słów kluczowych B2C/B2B](#44-analityka-słów-kluczowych)
   - 4.5 [Diagnostyka aeroanaliza.pl](#45-diagnostyka-aeroanaliza)
   - 4.6 [Symulator "co się zmieni gdy..."](#46-symulator)
   - 4.7 [Checklista SEO](#47-checklista-seo)
   - 4.8 [IndexNow](#48-indexnow)
   - 4.9 [Narzędzia darmowe](#49-narzędzia-darmowe)
5. [Infrastruktura SEO](#5-infrastruktura-seo)
   - 5.1 [Sitemap (B2C + B2B)](#51-sitemap)
   - 5.2 [Robots.ts (dynamiczny)](#52-robots)
   - 5.3 [Schema.org (B2C + B2B)](#53-schema)
6. [Jak korzystać — instrukcja krok po kroku](#6-instrukcja)
7. [Przykłady użycia API](#7-przykłady-api)
8. [FAQ](#8-faq)

---

## 1. Przegląd systemu

SEO Ops to wbudowany system zarządzania SEO w panelu administracyjnym strony wlasniewski.pl. Składa się z:

- **Backend API** (`/api/admin/seo-ops`) — generuje pełny raport audytowy z bazy danych, analizuje słowa kluczowe, uruchamia agenta AI, integruje PageSpeed Insights i IndexNow
- **Panel admin UI** (`/admin/seo`) — interaktywny dashboard z metrykami, symulacją, checklistą, narzędziami
- **Infrastruktura SEO** — dynamiczny sitemap, robots.ts, schema.org dla obu domen

### Obsługiwane domeny
| Domena | Typ | Opis |
|--------|-----|------|
| wlasniewski.pl | B2C | Fotografia rodzinna, ślubna, portretowa |
| aeroanaliza.pl | B2B | Usługi dronowe, inspekcje, termowizja |

---

## 2. Architektura plików

```
src/
├── app/
│   ├── api/admin/seo-ops/
│   │   └── route.ts          # API backend (GET + POST)
│   ├── admin/seo/
│   │   └── page.tsx           # Panel admin UI
│   ├── sitemap.ts             # Dynamiczny sitemap B2C + B2B
│   └── robots.ts              # Dynamiczny robots.txt
├── lib/
│   └── seo-schema.ts          # Schema.org generators (B2C + B2B)
└── components/admin/
    └── Sidebar.tsx             # Link "SEO Ops" w nawigacji
```

---

## 3. API Backend

### 3.1 GET — Pełny raport audytowy

**Endpoint:** `GET /api/admin/seo-ops`
**Auth:** Wymaga tokenu JWT w nagłówku `Authorization: Bearer <token>`

**Co robi:**
1. Pobiera równolegle z bazy: ustawienia, strony, sesje portfolio, wpisy bloga, zdarzenia analytics (60 dni)
2. Oblicza diagnostykę: brakujące meta title/description, thin pages, konfiguracja GA4/GTM/GSC
3. Analizuje trend ruchu: porównuje 30d obecne vs 30d poprzednie, wyodrębnia organic vs total
4. Wyodrębnia słowa kluczowe osobno dla B2C i B2B (tokenizacja + bigrams + stop words)
5. Uruchamia agenta AI — analizuje każdą stronę pod kątem meta, treści, struktury, lokalizacji
6. Generuje diagnostykę B2B (aeroanaliza.pl)
7. Zwraca: summary, diagnostics, trend, checklist, tools, keywordAnalytics, aiRecommendations, b2bDiagnostics, competitorAudit, roadmap90Days

**Odpowiedź (skrócona):**
```json
{
  "success": true,
  "summary": {
    "score": 58,
    "rankBand": "21-40",
    "pageCount": 47,
    "completionPercent": 30,
    "unresolvedCritical": 5,
    "organicShare": 34,
    "currentOrganicVisits30d": 120,
    "organicDeltaPercent": 15.5,
    "trafficDeltaPercent": 8.2
  },
  "keywordAnalytics": {
    "b2c": [
      { "keyword": "fotograf toruń", "count": 18, "density": 2.1, "pages": ["fotograf-torun", "o-mnie"] }
    ],
    "b2b": [
      { "keyword": "inspekcje dronem", "count": 5, "density": 1.8, "pages": ["b2b"] }
    ]
  },
  "aiRecommendations": [
    {
      "page": "/fotograf-torun",
      "severity": "critical",
      "category": "Meta",
      "finding": "Meta title za krótki (12 znaków)",
      "recommendation": "Ustaw meta title 50-60 znaków z główną frazą..."
    }
  ]
}
```

### 3.2 POST — Wieloakcyjny handler

**Endpoint:** `POST /api/admin/seo-ops`
**Auth:** JWT
**Body:** `{ "action": "save-checklist" | "pagespeed" | "indexnow" | "ai-analyze", ... }`

#### Akcja: save-checklist
Zapisuje stan checklisty do bazy.
```json
{
  "action": "save-checklist",
  "checklist": [
    { "id": "gsc-verify", "done": true, "note": "Zrobione 2026-03-20" }
  ]
}
```

#### Akcja: pagespeed
Uruchamia test PageSpeed Insights (darmowe API Google, bez klucza).
```json
{
  "action": "pagespeed",
  "url": "https://wlasniewski.pl"
}
```
**Odpowiedź:**
```json
{
  "success": true,
  "url": "https://wlasniewski.pl",
  "scores": {
    "performance": 78,
    "seo": 92,
    "accessibility": 85,
    "bestPractices": 90
  }
}
```

#### Akcja: indexnow
Wysyła URL-e do IndexNow API (Bing/Yandex) — indeksacja w minuty.
```json
{
  "action": "indexnow",
  "urls": [
    "https://wlasniewski.pl/",
    "https://wlasniewski.pl/blog/nowy-wpis"
  ]
}
```
**Zabezpieczenie:** Tylko URL-e z wlasniewski.pl i aeroanaliza.pl, max 100 sztuk.

#### Akcja: ai-analyze
Uruchamia agenta AI na żądanie — skanuje wszystkie strony i zwraca rekomendacje.
```json
{ "action": "ai-analyze" }
```

---

## 4. Panel Admin

### 4.1 Metryki główne
5 kart na górze dashboardu:
- **SEO Score** — od 10 do 96, obliczany z: braki meta, thin pages, konfiguracja analytics, trend organic, pokrycie checklisty
- **Aktualny ranking** — estymacja pozycji: TOP 10, 11-20, 21-40, 41-70, 70+
- **Organic 30d** — ilość wizyt z wyszukiwarek w ostatnich 30 dniach vs poprzednie 30 dni
- **Krytyczne luki** — braki title + description + thin pages
- **AI rekomendacje** — liczba wykrytych problemów, w tym krytycznych

### 4.2 PageSpeed Insights
- Wybierz URL z listy rozwijającej (strona główna, rezerwacja, portfolio, blog, aeroanaliza.pl)
- Kliknij "Uruchom test" — odpytuje darmowe API Google PageSpeed
- Wyświetla 4 wyniki: Performance, SEO, Accessibility, Best Practices
- Kolor: zielony ≥90, pomarańczowy ≥50, czerwony <50

### 4.3 Agent AI SEO
- Automatycznie skanuje WSZYSTKIE strony w bazie (Page, PortfolioSession, BlogPost)
- Wykrywa problemy w kategoriach: Meta, Content, Structure, Local SEO
- 3 poziomy: KRYTYCZNE (must-fix), OSTRZEŻENIE (should-fix), INFO (nice-to-have)
- Filtry: Wszystkie / Krytyczne / Ostrzeżenia / Info
- Każda rekomendacja zawiera:
  - Stronę, której dotyczy (np. `/fotograf-torun`)
  - Opis problemu (np. "Meta title za krótki")
  - Konkretną instrukcję naprawy z przykładem

**Reguły AI:**
| Reguła | Severity | Warunek |
|--------|----------|---------|
| Meta title za krótki | critical | < 20 znaków |
| Meta title za długi | warning | > 60 znaków |
| Meta description za krótki | critical | < 90 znaków |
| Meta description za długi | warning | > 160 znaków |
| Rzadka treść | warning | < 300 słów |
| Brak lokalizacji | info | Brak "Toruń" w treści > 100 słów |
| Brak nagłówków H2/H3 | warning | Brak tagów H2/H3 w HTML |
| Brak meta w portfolio | warning | Pusty meta_title/description |
| Słaby excerpt bloga | info | < 90 znaków |

### 4.4 Analityka słów kluczowych
- **Dwie zakładki:** B2C (wlasniewski.pl) i B2B (aeroanaliza.pl)
- Tabela z kolumnami: pozycja, słowo/fraza, wystąpienia, gęstość %, strony
- Wyodrębnia zarówno pojedyncze słowa jak i bigramy (2-słowne frazy)
- Filtruje polskie stop words (i, w, na, z, do, nie, jest, się...)
- Kolor gęstości: zielony 1-3%, czerwony >3% (keyword stuffing)
- Dane pobierane z: title, meta_title, meta_description, content (z usunięciem HTML)

### 4.5 Diagnostyka aeroanaliza.pl
- Wyświetla wykryte problemy domeny B2B:
  - Brak wpisów w sitemap
  - Brak osobnego robots.txt/schema
  - Brak dedykowanych stron B2B w bazie
- Rekomendacje naprawcze z konkretnymi krokami
- Status: KRYTYCZNY (brak stron) lub CZĘŚCIOWY (częściowa konfiguracja)

### 4.6 Symulator "co się zmieni gdy..."
- Zaznaczasz zadania z checklisty, które planujesz wdrożyć
- Symulator oblicza nowy SEO Score i estymowany ranking
- Formuła: `score + (sum_impact * 0.9)`, clamped 10-99

### 4.7 Checklista SEO
14 zadań z kategoriami: Technical, Content, Authority, Conversion, Automation
- Każde z: checkbox, notatka, effort (S/M/L), impact points
- Link do rekomendowanego narzędzia
- Persystencja: zapisywane w bazie (Setting.seo_ops_state)

### 4.8 IndexNow
- Przycisk "IndexNow" w nagłówku
- Wysyła 5 głównych URL-i do API IndexNow
- Bing i Yandex indeksują zmiany w minuty zamiast dni
- Zabezpieczenie: tylko własne domeny

### 4.9 Narzędzia darmowe
Sekcja z 16 darmowymi narzędziami SEO z linkami:
- Google Search Console, Google Analytics 4, PageSpeed Insights
- Microsoft Clarity (heatmapy), Ubersuggest, AnswerThePublic
- Google Trends, Ahrefs Webmaster Tools, Bing Webmaster Tools
- Rich Results Test, Schema Validator, IndexNow
- Screaming Frog (500 URL free), Looker Studio, Canva, TinyPNG

---

## 5. Infrastruktura SEO

### 5.1 Sitemap
**Plik:** `src/app/sitemap.ts`

Generuje sitemap XML z URL-ami dla **obu domen**:
- `https://wlasniewski.pl/` — strony statyczne, dynamiczne (fotograf-*), portfolio, blog
- `https://aeroanaliza.pl/` — strony B2B statyczne + dynamiczne z prefiksem `b2b`

**Priorytety:**
| Typ strony | Priorytet |
|------------|-----------|
| Strona główna | 1.0 |
| Strony lokalizacji (fotograf-*) | 0.9 |
| Strony statyczne | 0.8 |
| Blog | 0.7 |
| Strony B2B | 0.7-0.8 |
| Portfolio sesje | 0.6 |

### 5.2 Robots
**Plik:** `src/app/robots.ts` (zastępuje statyczny `public/robots.txt`)

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /galeria/*/

Sitemap: https://wlasniewski.pl/sitemap.xml
Sitemap: https://aeroanaliza.pl/sitemap.xml
```

### 5.3 Schema.org
**Plik:** `src/lib/seo-schema.ts`

| Generator | Typ schema.org | Domena |
|-----------|---------------|---------|
| `generateLocalBusinessSchema()` | LocalBusiness + PhotographyBusiness | wlasniewski.pl |
| `generatePersonSchema()` | Person | wlasniewski.pl |
| `generateWebsiteSchema()` | WebSite | wlasniewski.pl |
| `generateBreadcrumbSchema()` | BreadcrumbList | obie |
| `generateServiceSchema()` | Service | wlasniewski.pl |
| `generateB2BDroneBusinessSchema()` | ProfessionalService | aeroanaliza.pl |

**B2B Schema zawiera:**
- 4 usługi: inspekcje termowizyjne, ortofotomapy, monitoring budów, filmowanie z drona
- Lokalizacja: Toruń, kujawsko-pomorskie
- Zasięg: województwo + Polska

---

## 6. Instrukcja krok po kroku

### Pierwszy raz po uruchomieniu:

1. **Wejdź na `/admin/seo`** — raport się załaduje automatycznie
2. **Sprawdź SEO Score** — jeśli <50, zacznij od zadań "critical"
3. **Uruchom PageSpeed** — przetestuj stronę główną i rezerwację
4. **Przejrzyj AI rekomendacje** — przefiltruj na "Krytyczne" i napraw najważniejsze
5. **Sprawdź słowa kluczowe B2C** — upewnij się, że "fotograf toruń", "sesja rodzinna" itp. mają dobrą widoczność
6. **Przejrzyj diagnostykę B2B** — zaplanuj naprawę SEO aeroanaliza.pl
7. **Kliknij IndexNow** — wyślij główne strony do natychmiastowej indeksacji
8. **Zacznij checklistę** — od zadań z highest impact

### Codzienny workflow:
- **Poniedziałek:** Otwórz SEO Ops, sprawdź metryki, zaplanuj zadania na tydzień
- **Wtorek/Czwartek:** Wdrażaj zadania z checklisty, naprawiaj meta
- **Piątek:** Uruchom PageSpeed, sprawdź AI rekomendacje, IndexNow nowe strony

---

## 7. Przykłady użycia API

### Pobranie raportu z curl:
```bash
curl -H "Authorization: Bearer TWOJ_TOKEN" https://wlasniewski.pl/api/admin/seo-ops
```

### Test PageSpeed programowo:
```bash
curl -X POST \
  -H "Authorization: Bearer TWOJ_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"pagespeed","url":"https://wlasniewski.pl"}' \
  https://wlasniewski.pl/api/admin/seo-ops
```

### Natychmiastowa indeksacja:
```bash
curl -X POST \
  -H "Authorization: Bearer TWOJ_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"indexnow","urls":["https://wlasniewski.pl/blog/nowy-wpis"]}' \
  https://wlasniewski.pl/api/admin/seo-ops
```

### Uruchomienie agenta AI:
```bash
curl -X POST \
  -H "Authorization: Bearer TWOJ_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"ai-analyze"}' \
  https://wlasniewski.pl/api/admin/seo-ops
```

---

## 8. FAQ

**Q: Czy PageSpeed Insights wymaga klucza API?**
A: Nie. Używamy publicznego API Google PageSpeed v5, które jest darmowe do 25 000 zapytań/dzień.

**Q: Jak często powinienem uruchamiać audyt?**
A: Panel ładuje dane w czasie rzeczywistym z bazy przy każdym wejściu. Zalecamy przegląd raz w tygodniu.

**Q: Czy IndexNow działa z Google?**
A: Nie bezpośrednio. IndexNow obsługuje Bing, Yandex i inne wyszukiwarki. Dla Google używaj Search Console → "Prośba o indeksowanie".

**Q: Skąd Agent AI bierze rekomendacje?**
A: Z analizy reguł (rule-based) — skanuje meta title/description, długość treści, nagłówki H2/H3, wzmiankę o lokalizacji. Nie używa zewnętrznego LLM.

**Q: Dlaczego aeroanaliza.pl ma status KRYTYCZNY?**
A: Domena B2B nie miała wpisów w sitemap, robots.txt ani dedykowanego schema.org. Zostało to naprawione — sitemap i robots.ts teraz zawierają URL-e aeroanaliza.pl.

**Q: Czy dane checklisty są persystowane?**
A: Tak. Stan checklisty (zaznaczenia + notatki) zapisywany jest w tabeli `settings` pod kluczem `seo_ops_state` jako JSON.

**Q: Co robi SEO Score i jak jest obliczany?**
A: Score (10-96) = `62 - kary_za_braki_meta - kary_za_thin_pages ± bonus_analytics ± bonus_GSC ± trend_organic + bonus_checklist`. Wyższy score = lepsza kondycja SEO.

---

*Ostatnia aktualizacja: SEO Ops v2.0 — wersja z AI Agent, B2C/B2B keyword analytics, PageSpeed, IndexNow, diagnostyką B2B.*
