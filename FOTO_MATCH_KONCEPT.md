# 📸 Foto‑Match — platforma kojarzenia osób na wspólne sesje fotograficzne

> **Status:** koncept (do dyskusji, NIE wdrażać)
> **Autor pomysłu:** Przemysław Właśniewski
> **Data:** 2026‑05‑01

---

## 1. Pomysł w jednym zdaniu

**Tinder dla sesji zdjęciowych** — użytkownicy zostawiają swój profil + zdjęcia, zaznaczają, na jaką sesję mają ochotę i z kim, a system kojarzy ich z osobami o podobnych parametrach. Gdy obie strony „lajkują" siebie nawzajem → powstaje **Para na sesję**, a fotograf (Ty) dostaje gotowy lead.

To rozszerzenie obecnego modułu **Foto Wyzwanie** — tam zapraszasz konkretną osobę, którą znasz; tutaj **system znajduje Ci nieznajomego**, który ma podobne pomysły na zdjęcia.

---

## 2. Po co? (cele biznesowe)

| Cel | Jak to spełnia |
|---|---|
| 🔥 Stała pula nowych klientów | Ludzie sami się rejestrują i czekają na siebie — Ty masz tylko inkasować |
| 💰 Wyższy LTV | Sesja w 2 osoby = dzielony koszt = łatwiejsza decyzja zakupowa |
| 🌐 Network effect | Każdy nowy profil zwiększa wartość platformy dla wszystkich |
| 📈 SEO + viral | „znajdź partnera na sesję foto Toruń" — pusty rynek, zero konkurencji |
| 🎨 Wyróżnik portfolio | Sesje par/grup nieznajomych = świeże, naturalne kadry |

---

## 3. Persony

### 3.1. Ania, 27 lat, Toruń
- Chce sesję boudoir / portretową z drugą dziewczyną, ale nie ma ekipy.
- Wstydzi się sama → woli, żeby ktoś też się odsłonił.
- Wrzuca 3 selfie, opis „introwertyczka, lubię klimaty noir, szukam kobiety 25–35 do sesji studyjnej".

### 3.2. Marek + Kasia, para, Bydgoszcz
- Chcą sesji par „double date" z drugą parą.
- Szukają pary o podobnym vibe (alternatywa, tatuaże, plener).

### 3.3. Klub motocyklowy / grupa znajomych
- Chcą zorganizować większą sesję klimatyczną.
- Brakuje im 2 osób → szukają „uzupełnienia" w platformie.

### 3.4. Ty (fotograf)
- Dostajesz powiadomienie: „6 osób stworzyło grupę gotową do sesji w stylu vintage, Toruń, 15.06". → wystawiasz ofertę → klikają „bukujemy" → kasa.

---

## 4. User journey (happy path)

```
1. Rejestracja            → profil + 3 zdjęcia + zgody RODO + wiek/płeć/miasto
2. Tworzenie „intencji"   → "Chcę sesję typu X, z osobą typu Y, w okolicy Z, budżet B"
3. Oczekiwanie            → status „aktywny", system pokazuje matche
4. Przeglądanie kart      → swipe right (chcę z Tobą) / left (nie)
5. Mutual match           → otwiera się czat (anonimowy, bez numerów)
6. Ustalanie szczegółów   → wybierają datę, pakiet, lokalizację
7. Wspólny zakup          → split płatności 50/50 lub jeden płaci
8. Powiadomienie fotografa → Ty zatwierdzasz, kontaktujesz, robisz sesję
9. Po sesji               → galeria współdzielona + oceny wzajemne + zaproszenie do kolejnej sesji
```

---

## 5. Architektura informacji

### 5.1. Profil użytkownika

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `display_name` | string | tak | nick lub imię |
| `birth_year` | int | tak | wyświetlamy wiek, nie datę |
| `gender` | enum (`f`,`m`,`other`,`hidden`) | tak | filtrowanie matchy |
| `city` + `radius_km` | string + int | tak | „Toruń + 50 km" |
| `bio` | text 200 zn. | tak | autoprezentacja |
| `photos[]` | 3–6 obiektów | tak | min. 1 twarz |
| `verified_selfie` | bool | nie | weryfikacja real‑time (anti‑fake) |
| `social_link` | string | nie | IG/FB — opcjonalnie publiczne |
| `interests[]` | tagi | tak | „natura", „plener", „zachody słońca", „rodzina", „urban"… |
| `style_preferences[]` | tagi | tak | „dark mood", „pastel", „filmowo"… |
| `experience` | enum | tak | `nigdy_nie_byłem` / `kilka` / `model_amator` / `pro` |
| `comfort_level` | enum | tak | `tylko_klasyka` / `boudoir_ok` / `akt_ok` |

### 5.2. Intencja sesji (`SessionIntent`)

| Pole | Opis |
|---|---|
| `intent_type` | `partner_search` (1+1) lub `group_search` (np. 4 os.) |
| `desired_partner_count` | ile osób szukam |
| `partner_filters` | wiek od/do, płeć, miasto, styl |
| `session_style` | tagi (boudoir, plener jesienny, urban, retro…) |
| `budget_max` | suma na osobę PLN |
| `available_dates[]` | przedziały kalendarzowe |
| `location_preference` | enum: `plener_naturalny` (domyślnie) / `plener_urban` / `własne_miejsce` / `studio_zewnętrzne` (opcja ukryta — tylko gdy user kliknie „zaawansowane") |
| `package_id` | opcjonalny — jeśli już wybrał konkretny pakiet z oferty |
| `expires_at` | TTL np. 30 dni |

### 5.3. Match (`SessionMatch`)

```
status: suggested → liked_by_a → mutual_match → chat_open → booked → completed → cancelled
participants[]: user_id, role (initiator/joined), liked_at, ready_to_book
chat_thread_id
proposed_session: { date, package_id, location_id, total_price, split_method }
```

---

## 6. Algorytm dopasowywania (v1, prosty)

**Score 0–100** dla każdej pary intencji A↔B:

```
score = 0
+30  jeśli płeć B ∈ partner_filters A   (i odwrotnie)
+20  jeśli wiek B w przedziale A          (i odwrotnie)
+15  miasto w promieniu radius            (geohash)
+10  za każdy wspólny tag stylu (max 30)
+5   za każdy wspólny tag zainteresowań (max 15)
+10  zachodzące przedziały dat
-50  gdy comfort_level rozjeżdża się o >1 stopień
-100 gdy któryś zablokował drugiego
```

Pokazujemy karty z `score >= 50`, sortowane malejąco.

**v2 (później):** model embeddingowy ze zdjęć (CLIP) — wizualne podobieństwo stylu.

---

## 7. Bezpieczeństwo i RODO (KRYTYCZNE)

### 7.1. Zgody przy rejestracji
- [ ] Akceptacja regulaminu „Foto‑Match"
- [ ] Zgoda na przetwarzanie zdjęć (wizerunek)
- [ ] Zgoda na publikację profilu wewnątrz platformy (nie publicznie w Google!)
- [ ] Oświadczenie pełnoletności (18+)
- [ ] Zgoda marketingowa (opcjonalna)

### 7.2. Anti‑abuse / safety
| Ryzyko | Mitygacja |
|---|---|
| Fake profile | Selfie‑weryfikacja (zdjęcie z gestem dnia) |
| Stalking | Brak udostępniania nazwiska/telefonu przed bookingiem |
| Nieodpowiednie zdjęcia | Moderacja AI (NSFW classifier) + ręczna |
| Molestowanie w czacie | Słownik zakazanych fraz + przycisk „zgłoś" |
| Prześladowanie | Block + cooldown + blacklist IP |
| Małoletni | Walidacja wieku + ID check (opcjonalnie KYC dla NSFW) |
| Wyciek galerii | Wszystkie zdjęcia za autoryzacją + watermark + signed URLs |

### 7.3. Prywatność danych
- Zdjęcia hostowane lokalnie (S3 / Netlify Blobs), **nigdy** publiczny URL bez tokena
- Soft‑delete: konto można zamrozić, dane usuwane po 30 dniach
- Twardy „prawo do bycia zapomnianym" → endpoint usuwający wszystko + logi

---

## 8. Model danych (Prisma — szkic)

```prisma
model FotoMatchProfile {
  id                Int      @id @default(autoincrement())
  user_id           Int      @unique
  user              User     @relation(fields: [user_id], references: [id])
  display_name      String
  birth_year        Int
  gender            String
  city              String
  radius_km         Int      @default(50)
  bio               String   @db.Text
  interests         String[] // postgres array
  style_preferences String[]
  experience        String
  comfort_level     String
  verified_at       DateTime?
  is_active         Boolean  @default(true)
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  photos            FotoMatchPhoto[]
  intents           SessionIntent[]
}

model FotoMatchPhoto {
  id          Int      @id @default(autoincrement())
  profile_id  Int
  url         String
  is_primary  Boolean  @default(false)
  moderated   Boolean  @default(false)
  flagged     Boolean  @default(false)
  position    Int      @default(0)
}

model SessionIntent {
  id                      Int      @id @default(autoincrement())
  profile_id              Int
  intent_type             String   // partner_search | group_search
  desired_partner_count   Int      @default(1)
  partner_age_min         Int
  partner_age_max         Int
  partner_gender          String   // any | f | m
  session_style           String[]
  budget_max              Int
  preferred_dates         String   @db.Text  // JSON
  location_preference     String
  package_id              Int?
  status                  String   @default("active")
  expires_at              DateTime
  created_at              DateTime @default(now())
  matches                 SessionMatchParticipant[]
}

model SessionMatch {
  id                 Int      @id @default(autoincrement())
  status             String   // suggested | mutual | chatting | booked | completed | cancelled
  match_score        Int
  proposed_date      DateTime?
  proposed_package_id Int?
  total_price        Int?
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt
  participants       SessionMatchParticipant[]
  messages           MatchMessage[]
}

model SessionMatchParticipant {
  id                Int      @id @default(autoincrement())
  match_id          Int
  intent_id         Int
  profile_id        Int
  role              String   // initiator | joined
  liked_at          DateTime?
  ready_to_book     Boolean  @default(false)
  payment_status    String   @default("pending")
}

model MatchMessage {
  id          Int      @id @default(autoincrement())
  match_id    Int
  sender_id   Int
  body        String   @db.Text
  flagged     Boolean  @default(false)
  created_at  DateTime @default(now())
}

model FotoMatchBlock {
  id          Int @id @default(autoincrement())
  blocker_id  Int
  blocked_id  Int
  reason      String?
  created_at  DateTime @default(now())
  @@unique([blocker_id, blocked_id])
}
```

---

## 9. Mapa stron / endpointów

### Frontend (publiczny)
- `/foto-match` — landing (SEO, jak `/foto-wyzwanie` → SSR)
- `/foto-match/rejestracja` — onboarding 4‑krokowy
- `/foto-match/profil` — edycja własnego profilu
- `/foto-match/intencje` — moje aktywne „chcę sesji"
- `/foto-match/intencje/nowa` — wizard tworzenia intencji
- `/foto-match/odkrywaj` — swipe deck z propozycjami
- `/foto-match/dopasowania` — lista mutual matchy
- `/foto-match/czat/[id]` — rozmowa
- `/foto-match/booking/[id]` — wspólne ustalenie pakietu i płatność

### Admin
- `/admin/foto-match/profile` — moderacja profili + zdjęć
- `/admin/foto-match/zglosenia` — kolejka raportów
- `/admin/foto-match/matche` — przegląd dopasowań + interwencja
- `/admin/foto-match/statystyki` — KPI + funnel

### API (handlers)
- `POST /api/foto-match/profile`
- `POST /api/foto-match/photos` (upload + moderacja AI)
- `POST /api/foto-match/intent`
- `GET  /api/foto-match/discover?intent_id=` → lista kart
- `POST /api/foto-match/like` → tworzy lub aktualizuje match
- `POST /api/foto-match/block`
- `POST /api/foto-match/report`
- `GET  /api/foto-match/matches`
- `POST /api/foto-match/match/[id]/message`
- `POST /api/foto-match/match/[id]/propose-booking`
- `POST /api/foto-match/match/[id]/checkout` → PayU split

---

## 10. Etapy wdrożenia

### MVP (4–6 tyg.)
- ✅ Rejestracja + profil + 3 zdjęcia
- ✅ Tworzenie 1 intencji
- ✅ Prosty algorytm matchy (regułowy, bez AI)
- ✅ Swipe + mutual match
- ✅ Czat (Pusher / Ably / własny WebSocket)
- ✅ Booking → PayU (jeden płaci, drugi zwraca poza systemem)
- ✅ Powiadomienie email do fotografa
- ✅ Moderacja ręczna w admin panel

### v2 (kwartał)
- 🔜 Split płatności PayU (każdy płaci swoją połówkę)
- 🔜 Moderacja AI zdjęć (NSFW + face detection)
- 🔜 Selfie‑verification z gestem dnia
- 🔜 Grupy 3+ osób (group_search)
- 🔜 Integracja kalendarza Google
- 🔜 Push notyfikacje (PWA)

### v3 (pół roku)
- 🔜 Embeddingi CLIP — dopasowanie po stylu wizualnym zdjęć
- 🔜 Aplikacja mobilna (Expo)
- 🔜 Gamifikacja: badges, ranking aktywnych modeli/modelek
- 🔜 Marketplace fotografów (inne miasta — Ty bierzesz prowizję)
- 🔜 „Photo dates” — speed‑dating fotograficzny w plenerze raz/mies. (np. zachody słońca nad Wisłą, jesień w lesie)

---

## 11. Monetyzacja

| Model | Opis | Szacowany udział |
|---|---|---|
| **Prowizja od sesji** | 100% ceny pakietu Twoja (jesteś wykonawcą) | 80% |
| **Boost profilu** | 19 zł/mies. — wyższe miejsce w decku | 10% |
| **Premium membership** | 39 zł/mies. — nielimitowane lajki, widzisz „kto Cię polubił" | 5% |
| **Foto‑match w innych miastach** | Onboardujesz lokalnych fotografów, bierzesz 15% prowizji | 5% |

---

## 12. Ryzyka

| # | Ryzyko | Prawdopodobieństwo | Skutek | Plan B |
|---|---|---|---|---|
| 1 | Niska podaż użytkowników (cold start) | Wysokie | Krytyczne | Seed: zaprosić byłych klientów + IG ads |
| 2 | Nadużycia / zdjęcia 18+ | Średnie | Wysokie | AI moderacja od dnia 1, ręczne review przez 30 dni |
| 3 | Brak zaufania („to randka czy sesja?") | Wysokie | Średnie | Wyraźne komunikaty, regulamin bez tabu, FAQ |
| 4 | Konflikt na sesji (osoby się nie polubiły IRL) | Średnie | Średnie | Krótkie video‑intro przed sesją (opcjonalne) |
| 5 | Koszty hostingu zdjęć | Niskie | Niskie | Compress + WebP + signed URLs, limit 6 zdjęć/profil |
| 6 | RODO + wycieki | Niskie | Krytyczne | Audyt prawny PRZED launchem, polisa OC |

---

## 13. Otwarte pytania (do decyzji przed wdrożeniem)

1. **Czy 18+ tylko, czy 16+ za zgodą rodzica?** (rekomendacja: **18+ tylko**)
2. **Czy dopuszczamy sesje typu boudoir/akt?** Jeśli tak → osobna kategoria z dodatkową weryfikacją.
3. **Czy płatność rozdzielona na 2 osoby (split) czy jedna płaci?** (MVP: jedna płaci, v2: split)
4. **Czy fotograf akceptuje match przed bookingiem, czy po?** (rekomendacja: **po** — nie blokujesz organizacji)
5. **Geo‑zasięg na start:** tylko Toruń+Bydgoszcz, czy cała Polska?
6. **Czy chat 1:1 na platformie, czy od razu Messenger/WhatsApp?** (rekomendacja: **na platformie** ze względu na moderację)
7. **Brand:** osobna domena `foto-match.pl`, czy podstrona `wlasniewski.pl/foto-match`?
8. **Cena za boost / premium** — A/B test po 2 miesiącach.

---

## 14. KPI sukcesu (po 90 dniach od launchu)

- 🎯 **300 zarejestrowanych profili**
- 🎯 **50 mutual matchy**
- 🎯 **15 zrealizowanych sesji**
- 🎯 **15 000 zł GMV**
- 🎯 **NPS ≥ 50** (od osób po sesji)
- 🎯 **Conversion: profil → intencja: 60%**
- 🎯 **Conversion: match → booking: 30%**

---

## 15. Inspiracje / benchmark

- **Bumble BFF / Bumble Bizz** — UX swipe ze ścieżką niemiłosną
- **Meetup.com** — tworzenie wydarzeń przez społeczność
- **Hinge prompts** — pytania pomagające przełamać lody
- **Tandem (nauka języków)** — matching po wspólnych zainteresowaniach
- **Couchsurfing** — zaufanie + weryfikacja przed spotkaniem IRL

---

## 16. 🔐 Pełen audyt bezpieczeństwa platformy (CAŁA STRONA, nie tylko Foto‑Match)

> Cel: **zero wycieków, zero włamów, zero CVE.** Audyt obejmuje istniejący `wlasniewski.pl` + przyszły moduł Foto‑Match.

### 16.1. Warstwa aplikacyjna (OWASP Top 10)

| OWASP | Ryzyko | Co robimy |
|---|---|---|
| **A01 Broken Access Control** | User A widzi dane usera B | Każdy endpoint API: `getServerSession()` + `if (session.user.id !== resource.owner_id) return 403`. Middleware na `/api/admin/**` sprawdza `role === 'admin'`. Testy E2E weryfikują 403 dla cudzych zasobów. |
| **A02 Cryptographic Failures** | Hasła w plain‑text, słabe JWT | `bcrypt` cost=12 dla haseł, JWT podpisane HS256 + `JWT_SECRET` ≥ 64 znaki, rotacja co 90 dni. **PII w bazie szyfrowane (pgcrypto)**: `email_encrypted`, `phone_encrypted`. |
| **A03 Injection** | SQL/NoSQL injection | Tylko Prisma (parametryzowane query), zero `$queryRawUnsafe`. ESLint reguła `no-raw-sql`. |
| **A04 Insecure Design** | Brak rate-limit | Upstash Redis rate‑limit: 5 logowań/min/IP, 60 req/min/IP na publiczne API, 10 uploadów/h/user. |
| **A05 Security Misconfiguration** | Włączony debug w prod, otwarte porty | `next.config.mjs`: `headers()` z CSP, HSTS, X‑Frame‑Options. Wyłączony `x-powered-by`. Brak `console.log` w prod (lint). |
| **A06 Vulnerable Components** | Stare libki | `npm audit` w CI (fail na high/critical), Dependabot weekly, `snyk monitor`. |
| **A07 Auth Failures** | Brute force loginu | Rate‑limit + lockout konta po 10 fail (15 min), 2FA opcjonalne (TOTP). Reset hasła: token jednorazowy ważny 30 min. |
| **A08 Data Integrity** | Niezweryfikowane uploady | Wszystkie pliki: validacja MIME (magic bytes, nie tylko extension), max 10 MB, scan ClamAV przez worker. |
| **A09 Logging Failures** | Nie wiemy o włamie | Logowanie: każdy login (sukces+fail), zmiana hasła, dostęp admina. Sentry + alert e-mail przy >20 fail/min. |
| **A10 SSRF** | Backend pobiera dowolne URL | Whitelist domen dla webhooków/preview, blokada IP prywatnych (10.0.0.0/8 etc.). |

### 16.2. Klucze, sekrety, env

| Co | Gdzie trzymamy | Dostęp |
|---|---|---|
| `JWT_SECRET`, `NEXTAUTH_SECRET` | Netlify env vars (encrypted at rest) | tylko build + runtime |
| Klucze PayU | Netlify env vars | rotacja kwartalna |
| Klucze AWS S3 | Netlify env vars + IAM least-privilege (tylko bucket photos, tylko PutObject/GetObject) | rotacja co 6 mies. |
| Klucze Resend / SMTP | Netlify env vars | – |
| `DATABASE_URL` (Neon) | Netlify env vars + IP allowlist Neon (tylko Netlify ranges) | – |
| Klucze Cloudinary / moderacja AI | Netlify env vars | – |
| Klucze SMS (Twilio / SMSAPI) | Netlify env vars | – |

**Reguły:**
- ❌ **ZERO** sekretów w repo (audyt: `gitleaks` w CI + `git filter-repo` jeśli coś się przedostało)
- ❌ Zero sekretów w `NEXT_PUBLIC_*` (te trafiają do bundla!)
- ✅ `.env.local` w `.gitignore`, weryfikowane przez pre-commit hook
- ✅ Każdy klucz ma własny scope (klucz tylko do S3 bucket photos, nie do całego konta AWS)
- ✅ Plan disaster recovery: dokument „co robić jak wyciekł klucz X" (1 kartka A4)

### 16.3. Nagłówki HTTP (Content Security Policy)

```ts
// next.config.mjs - headers()
{
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https://*.amazonaws.com https://res.cloudinary.com; " +
    "frame-src https://www.google.com https://secure.payu.com; " +
    "connect-src 'self' https://*.amazonaws.com https://api.payu.com;",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self), payment=(self)',
}
```

### 16.4. Bezpieczeństwo kont użytkowników

- **Logowanie:** email + hasło **lub** OAuth (Google/Facebook) **lub** magic link e-mail
- **Hasła:** min. 10 zn., zxcvbn score ≥ 3, lista 10k najpopularniejszych zabroniona
- **2FA:** opcjonalne TOTP (Google Authenticator) — wymagane dla adminów
- **Sesje:** 7 dni rolling, refresh przy każdej akcji, „wyloguj wszystkie urządzenia" w panelu
- **Reset hasła:** token jednorazowy, 30 min, brak ujawniania czy email istnieje („wysłaliśmy jeśli istnieje")
- **Zmiana hasła:** zawsze wymaga aktualnego hasła + e‑mail powiadamiający z linkiem „to nie ja"
- **Konto admina:** wymusza 2FA + dostęp tylko z whitelisted IP (panel admin)

### 16.5. Płatności

- Tylko PayU (PCI-DSS na ich barkach) — **nigdy nie dotykamy danych karty**
- Webhook PayU: weryfikacja sygnatury HMAC, nigdy nie ufamy `status` z URL
- Idempotencja zamówień (UUID po stronie klienta, dedup w DB)
- Logowanie każdej zmiany statusu płatności (audit log immutable)

### 16.6. Backup + recovery

- **DB:** Neon point‑in‑time recovery 30 dni (gratis na planie), full backup raz dziennie do S3 z retencją 90 dni
- **Pliki S3:** versioning ON + Object Lock (30 dni) → odporność na ransomware
- **Test recovery:** raz na kwartał odtwarzamy backup do staging, weryfikujemy integralność
- **RPO ≤ 1h, RTO ≤ 4h**

### 16.7. Monitoring + alerty

- **Sentry** — błędy frontu i API (alert mail/Slack przy >5 błędów tej samej klasy/min)
- **Better Stack / UptimeRobot** — uptime monitoring co 1 min z 3 lokalizacji
- **Plausible / GA4** — anomalie ruchu (nagły spike → DDoS?)
- **Logi Netlify Functions** → CloudWatch z alertami na 5xx > 1% req
- **Cloudflare** przed Netlify (opcja) — WAF + DDoS protection + bot management
- **Cron security check:** raz dziennie skrypt CI sprawdza nagłówki HTTPS, certyfikat SSL (alert jeśli < 14 dni do wygaśnięcia), brak otwartych endpointów admina dla niezalogowanych

### 16.8. RODO compliance

- Strona prywatności + cookie banner (osobne zgody: niezbędne / analityka / marketing)
- DPA z każdym subprocesorem (Netlify, Neon, AWS, PayU, Resend)
- Rejestr czynności przetwarzania (RCP) — dokument PDF
- Endpoint „pobierz moje dane" (GDPR Art. 20) — JSON ze wszystkim co mamy o userze
- Endpoint „usuń mnie" (GDPR Art. 17) — soft-delete + hard-delete po 30 dniach
- Logi dostępów do PII (kto, kiedy, po co) — 12 mies. retencji

### 16.9. Pentest + bug bounty

- **Przed launchem Foto-Match:** zewnętrzny pentest (5–8 tys. zł, np. Securitum / Niebezpiecznik)
- **Bug bounty program:** otwarty, max 500 zł/bug critical, regulamin na `/security`
- **Plik `/.well-known/security.txt`** z kontaktem do reportu

---

## 17. 🧪 Plan testów (z fikcyjnymi kontami)

### 17.1. Środowiska
| Środowisko | URL | Baza | Użytek |
|---|---|---|---|
| **dev** | localhost:3000 | local Postgres | praca codzienna |
| **staging** | staging.wlasniewski.pl | Neon branch | testy przed releasem |
| **prod** | wlasniewski.pl | Neon main | live |

### 17.2. Fikcyjne konta testowe (seed script)

`internal_scripts/seed_foto_match_test_users.ts` — uruchamiany na staging:

| Login | Hasło | Rola | Profil |
|---|---|---|---|
| `test+ania@wlasniewski.pl` | `Test1234!` | user | K, 27, Toruń, szuka K do plenerów urban |
| `test+kasia@wlasniewski.pl` | `Test1234!` | user | K, 30, Bydgoszcz, szuka K do plenerów |
| `test+marek@wlasniewski.pl` | `Test1234!` | user | M, 32, Toruń, szuka M do sesji męskich |
| `test+pawel@wlasniewski.pl` | `Test1234!` | user | M, 35, Bydgoszcz, szuka M do urban |
| `test+couple1@wlasniewski.pl` | `Test1234!` | user | para, szuka pary |
| `test+couple2@wlasniewski.pl` | `Test1234!` | user | para, szuka pary |
| `test+admin@wlasniewski.pl` | `Test1234!` | admin | panel admina |
| `test+banned@wlasniewski.pl` | `Test1234!` | user | konto zbanowane (test edge case) |
| `test+unverified@wlasniewski.pl` | `Test1234!` | user | bez selfie verification |
| `test+minor@wlasniewski.pl` | `Test1234!` | user | rok urodzenia 2010 (test odrzucenia <18) |

E-maile lecą przez `+alias` na 1 prawdziwą skrzynkę → wszystkie powiadomienia dostaję ja.

### 17.3. Scenariusze testowe (manualne — checklist)

```
□ Rejestracja nowego konta → email weryfikacyjny dostarczony
□ Login poprawnym hasłem → przekierowanie na dashboard
□ Login błędnym hasłem 5x → blokada konta + email "ktoś próbował się zalogować"
□ Reset hasła → mail z tokenem → zmiana → stary token nie działa
□ 2FA: włączenie → wylogowanie → login wymaga kodu TOTP
□ Tworzenie profilu Foto-Match → upload 3 zdjęć → zdjęcia widoczne w karcie
□ Tworzenie intencji → pojawia się w "moje intencje"
□ Ania widzi Kasię w decku (matching płeć/wiek/miasto OK)
□ Ania lajkuje Kasię → Kasia widzi "ktoś Cię polubił" w powiadomieniach
□ Kasia lajkuje Anię → mutual match → otwiera się czat
□ Wymiana wiadomości → obie strony widzą real-time
□ Wiadomość z numerem telefonu → blokowana / flagowana
□ Block usera → user znika z decka, czat zamknięty
□ Report usera → trafia do admin queue
□ Wybór pakietu w booking → checkout PayU → mock success → status "booked"
□ Mail do fotografa "nowa sesja Foto-Match" → przychodzi
□ Anulowanie matchu → zwrot środków przez PayU API
□ Próba dostępu do cudzego profilu po URL → 403
□ Próba dostępu do /admin bez roli admin → 403
□ Próba uploadu pliku 50MB → odrzucone
□ Próba uploadu .exe → odrzucone (MIME check)
□ Próba uploadu zdjęcia z EXIF GPS → GPS strippped
□ Wylogowanie → cookie skasowane, /api/me zwraca 401
□ Usunięcie konta → 7 dni cooldown → po 7 dniach dane usunięte
□ Eksport danych RODO → ZIP z JSON-em
```

### 17.4. Testy automatyczne

- **Unit (Vitest):** funkcje matchingu, walidacja form, helpers
- **API (Vitest + supertest):** każdy endpoint — happy path + 401 + 403 + 422
- **E2E (Playwright):** 5 krytycznych ścieżek: rejestracja → login → profil → match → booking
- **Visual regression (Percy / Chromatic):** każda strona, dark/light, mobile/desktop
- **Lighthouse CI:** próg ≥ 90 perf, ≥ 95 SEO, ≥ 95 a11y na main pages

### 17.5. Test SMS + powiadomień (cross-account)

Skrypt `internal_scripts/test_notifications.ts`:
1. Konto A wysyła „lajk" do B → B dostaje mail + push + SMS (jeśli premium)
2. Konto B odpowiada lajkiem → oba dostają mail „masz mutual match"
3. Konto A wysyła wiadomość → B dostaje push („nowa wiadomość")
4. Konto B nie odpowiada 24h → A dostaje delikatny remind („Kasia jeszcze nie odpisała, może spróbuj inaczej?")
5. SMS booking confirmation → oba konta + ja jako admin

Każdy test loguje czas dostarczenia → SLA: mail < 30 s, push < 5 s, SMS < 60 s.

### 17.6. CI/CD pipeline

```
push to main →
  1. lint (ESLint + Prettier check)
  2. typecheck (tsc --noEmit)
  3. unit + api tests
  4. build (next build)
  5. e2e na podglądzie Netlify
  6. lighthouse CI
  7. deploy do prod (jeśli wszystko zielone)
  8. smoke test prod (curl /api/health) → rollback jeśli fail
```

---

## 18. 🗺️ Mapka spotkań (gdzie ludzie się umawiają)

### 18.1. Dwa zastosowania mapy

**A. Mapa lokalizacji sesji** (publiczna, na landingu Foto‑Match)
- Pokazuje pinpointy: Toruń, Bydgoszcz, Grudziądz, Chełmno, Wąbrzeźno, Świecie, Inowrocław…
- Kliknięcie pinpointa → najlepsze plenery w tym mieście, przykładowe zdjęcia, „X sesji już tu zrobiliśmy"
- SEO bonus: każdy pinpoint to landing page typu `/foto-match/torun` z lokalnym contentem

**B. Mapa wewnątrz matchu** (po mutual match)
- Po zaakceptowaniu matchu obie osoby widzą **propozycje plenerów** na mapie:
  - 📅 **Bulwar Filadelfijski / Wisła Toruń** (złota godzina o 19:00, parking obok)
  - 🌲 **Las Bielawy / Bory Tucholskie** (klimat naturalny, mech, wysokie sosny)
  - 🏛️ **Starówka Toruń / Chełmno** (architektura, bramy, cegła)
  - 🌾 **Łąki / pola wokół Płużnicy** (rustykalnie, prywatność)
  - 🌁 **Bydgoszcz — Wyspa Młyńska, Brda** (woda + mosty)
  - ☕ **Kawiarnie partnerskie** (preview meeting przed sesją — neutral ground, bezpiecznie)
  - 🏮 **Stacje benzynowe / parkingi przy plenerach** dla pierwszego spotkania (transparency, bezpieczeństwo)
- Możliwość dodania własnej lokalizacji plenerowej (drag pin → potwierdzenie obu stron + ja muszę zaakceptować że światło tam zadziała)
- Po wyborze: trasa Google Maps („jak dojechać"), share location w dniu sesji
- **Bezpieczeństwo pierwszego spotkania:** zawsze w lokalizacji **z mojego portfolio** (ja tam jestem na sesji) lub w **kawiarni partnerskiej**. Opcja „dowolne miejsce" odblokowuje się po 1 zrealizowanej sesji.
- **Studio (opcja ukryta):** jeśli ktoś koniecznie chce ściany, tło, sztuczne światło — mam kontakt do 2 wynajmowanych studiów w Toruniu i Bydgoszczy. Wybierane z poziomu „ustawienia zaawansowane" w intencji, dodatkowy koszt 150–300 zł wynajmu doliczany do pakietu. **Nie promujemy tego — fotografuję głównie w plenerze.**

### 18.2. Tech stack mapy

| Opcja | Plus | Minus | Rekomendacja |
|---|---|---|---|
| **Google Maps JS API** | Najlepsza UX, znajome | Płatne po 28k load/mies. | ✅ MVP |
| **Mapbox GL JS** | Customizacja stylu, taniej | Setup CSS | v2 |
| **Leaflet + OSM** | Free | Brzydsze defaultowo | nie |
| **MapLibre + Protomaps** | Self-hosted, free, ładne | Większy setup | v3 (skalowanie) |

### 18.3. Komponent

```tsx
// src/components/foto-match/MeetingMap.tsx
'use client';
import { GoogleMap, MarkerF, InfoWindowF } from '@react-google-maps/api';
// ...
<GoogleMap zoom={11} center={center} options={{ styles: customStyles }}>
  {locations.map(loc => (
    <MarkerF key={loc.id} position={loc.coords} icon="/pin.svg" onClick={...} />
  ))}
</GoogleMap>
```

### 18.4. Lokalizacje seed (z mojego portfolio)

Tabela `MeetingLocation` z gotowymi 30 lokalizacjami w promieniu 100 km od Płużnicy: **28 plenerów** (lasy, łąki, woda, starówki, urban) + **2 kawiarnie partnerskie** (neutral ground na pierwsze spotkanie). Admin może dodawać nowe. Studia zewnętrzne są trzymane w osobnej tabeli `ExternalStudio` jako opcja zaawansowana — nie pokazywane domyślnie.

---

## 19. 📱 Plan aplikacji mobilnej

### 19.1. Strategia (3 fazy)

1. **Faza 0 (od dnia 1) — PWA:** strona już działa jako PWA, dodajemy `manifest.json`, service worker, offline cache, ikony ekranu startowego, push notifications. Dla 80% userów to wystarczy.
2. **Faza 1 (3 mies. po launchu) — Expo / React Native:** wspólny code z webem (przez Solito + Tamagui lub Expo Router web), aplikacja w App Store + Google Play
3. **Faza 2 (12+ mies.) — natywne moduły:** kamera / face detection / ARKit jeśli potrzebne (np. „zobacz jak światło padłoby na twój plener o 19:00")

### 19.2. Stack mobile (rekomendacja)

| Warstwa | Technologia |
|---|---|
| Framework | **Expo SDK 51+** (managed workflow) |
| Routing | **Expo Router** (file-based, jak Next.js) |
| UI | **NativeWind** (Tailwind w RN) + **react-native-reanimated** |
| State | **Zustand** + **TanStack Query** |
| Auth | **NextAuth ↔ Expo SecureStore** (JWT shared) |
| Push | **Expo Notifications** + Firebase Cloud Messaging |
| Płatności | **Stripe Mobile / PayU SDK** (lub WebView do checkout) |
| Mapa | **react-native-maps** (Google) |
| Aparat / upload | **expo-image-picker** + crop + compress |
| Build / OTA | **EAS Build + EAS Update** (hot updates bez App Store review) |
| Crash reporting | **Sentry React Native** |

### 19.3. MVP funkcji w apce

- Login / rejestracja
- Profil + upload zdjęć z kamery
- Swipe deck (gestowy, jak Tinder — `react-native-deck-swiper`)
- Powiadomienia push (mutual match, nowa wiadomość)
- Czat
- Booking + Apple Pay / Google Pay
- Mapa spotkań
- Ustawienia + bezpieczeństwo (zmiana hasła, 2FA)

### 19.4. Koszty aplikacji

| Pozycja | Koszt jednorazowy | Koszt roczny |
|---|---|---|
| Apple Developer Program | – | 99 USD/rok |
| Google Play Developer | 25 USD | – |
| EAS Build (hobby) | – | 0–29 USD/mies. |
| Sentry | – | 0–26 USD/mies. |
| Firebase (push) | – | 0 USD (do limitów) |

---

## 20. 🎨 Design system — „mega profesjonalny i zajebisty"

### 20.1. Brand direction

**Mood:** premium, elegant, ciepły, nieoczywisty — coś między Hinge (eleganckie typo, dużo światła) a Airbnb (warm fotografia, zero stocku).

**Inspiracje:**
- [hinge.co](https://hinge.co) — typografia + dużo whitespace
- [feeld.co](https://feeld.co) — odważne kolory + bold display font
- [sttuhk.com](https://sttuhk.com) — minimalizm fotografa

### 20.2. Paleta (rozszerzenie obecnej)

```
Primary    — Złoto „warm gold"     #C8A960  (już używane)
Accent     — Burgund „velvet"      #8B2A3F  (NOWY: dla Foto‑Match, kontrast)
Neutral    — Cream                 #FBF7EF  (już)
Ink        — Charcoal              #1A1816
Soft       — Stone-200             #E7E5E4
Success    — Sage                  #6B8E5A
Warning    — Amber                 #D97706
Danger     — Crimson               #B91C1C

Gradient hero: from #FBF7EF via #F5E8C7 to #E8D4A6
Gradient CTA:  from #C8A960 to #8B2A3F (gold → burgund)
```

### 20.3. Typografia

| Rola | Font | Waga | Użycie |
|---|---|---|---|
| Display (H1, H2) | **Cormorant Garamond** | 600 | nagłówki sekcji |
| Sans (UI, body) | **Inter** | 400/500/700 | przyciski, paragrafy, formularze |
| Handwriting (akcent) | **Caveat** lub **Great Vibes** | 400 | krótkie cytaty, „zobacz tu" |
| Mono (kod, etykiety) | **JetBrains Mono** | 400 | tagi, statusy, ID |

Ratio: 1.25 (major third). Base = 16 px.

### 20.4. Komponenty (Storybook)

`packages/ui/` z komponentami współdzielonymi web ↔ mobile:
- `Button` (primary / secondary / ghost / danger, sizes sm/md/lg/xl, icon-left/right)
- `Card` (default / elevated / glass / gradient)
- `Input` (text / email / phone / password / textarea + states)
- `ProfileCard` (główny komponent decka — zdjęcie + overlay + tagi)
- `MatchBadge` (animowany badge „it's a match!")
- `ChatBubble` (sender / receiver / system)
- `PackagePicker` (slider z pakietami sesji)
- `MapPin` (custom SVG, animacja pulse na hover)
- `OnboardingStep` (progress + form + image)
- `EmptyState` (ilustracja + CTA)
- `Toast` (success / error / info)
- `Modal` / `BottomSheet`

### 20.5. Animacje (framer-motion + reanimated)

- **Swipe** w decku: spring physics, rotacja przy drag, „undo" gestem
- **Match reveal:** confetti + skala karty + haptic feedback (mobile)
- **Page transitions:** fade + slide 200ms
- **Skeleton loading:** shimmer wszystko, zero białych ekranów
- **Micro-interactions:** każdy lajk = haptic + małe serce, każdy CTA = scale 0.97 on press

### 20.6. Accessibility

- WCAG 2.2 AA kontrast wszędzie
- `prefers-reduced-motion` respektowane (zamiast spring → fade)
- Wszystkie obrazki mają alt
- Focus visible (gold outline), klawiaturowa nawigacja po decku (← → ↑)
- Screen reader announcements dla matchy i wiadomości

### 20.7. Design tokens (`tailwind.config.ts` extension)

```ts
extend: {
  colors: { 'fm-gold': '#C8A960', 'fm-velvet': '#8B2A3F', 'fm-cream': '#FBF7EF', 'fm-ink': '#1A1816' },
  fontFamily: { display: ['Cormorant Garamond', 'serif'], handwriting: ['Caveat', 'cursive'] },
  boxShadow: { 'fm-card': '0 12px 32px -8px rgba(26,24,22,0.18)', 'fm-glow': '0 0 40px rgba(200,169,96,0.4)' },
}
```

---

## 21. 🚀 Plan szybkiej promocji (FB + Google jednym klikiem)

### 21.1. Architektura „One-Click Publish"

Panel admina → strona „Promocje" → przycisk **„Opublikuj wszędzie"** → backend wysyła równolegle do:

1. **Facebook Page** — post + zdjęcie + link
2. **Instagram (przez FB Graph API)** — post na feed + story
3. **Google Business Profile** — post (Update / Offer / Event)
4. **Google Ads** — uruchomienie kampanii Performance Max z gotowym creative
5. **Newsletter** (Resend / Mailchimp) — mail do bazy
6. **TikTok / Twitter (X)** — opcjonalnie w v2

### 21.2. Tech stack integracji

| Platforma | API | Wymagana autoryzacja | Limit |
|---|---|---|---|
| Facebook Page | **Meta Graph API** v19+ | Long-lived Page Access Token (60 dni, rotacja) | 200 calls/h |
| Instagram | **Meta Graph API** (IG Business Account) | Long-lived token | 200 calls/h |
| Google Business Profile | **Business Profile Performance API** | OAuth2 + token refresh | 10 calls/min |
| Google Ads | **Google Ads API** (REST) | OAuth2 + Developer Token | budgetowo |
| Mail | **Resend API** | API key | 100/dzień (free) |

### 21.3. Endpoint backendowy

```ts
// POST /api/admin/promo/publish
{
  title: "Promocja majowa — 20% na sesje rodzinne",
  description: "...",
  image_url: "https://...jpg",
  cta: { text: "Rezerwuj", url: "https://wlasniewski.pl/oferta/promo-maj" },
  channels: ["facebook", "instagram", "google_business", "google_ads", "newsletter"],
  schedule_at: null, // lub ISO date dla kolejki
}

→ response: { results: [{ channel, status, post_id, error }] }
```

### 21.4. UI w admin panel

- Form: tytuł, opis, zdjęcie (drag&drop), CTA, checkboxy kanałów, wybór budżetu Ads (50/100/200/500 zł)
- Preview w stylu każdego kanału (jak będzie wyglądało na FB, IG, Google)
- Przycisk **„Opublikuj teraz"** lub **„Zaplanuj na…"**
- Historia kampanii + wyniki (zasięg, CTR, konwersje — pull z API)
- Template'y („Walentynki", „Boże Narodzenie", „Black Friday")

### 21.5. UTM tracking

Każdy URL automatycznie z `utm_source={channel}&utm_medium=social&utm_campaign={slug}` → widać w GA4 / Plausible co konwertuje.

### 21.6. Compliance

- Token storage: encrypted w DB (envelope encryption z KMS)
- Webhook Meta: weryfikacja sygnatury
- Disclaimer w panelu: „posty są publikowane natychmiast, edycja wymaga ręcznego usunięcia z FB/IG"
- Limit: max 5 publikacji/dzień (anti-spam własny)

---

## 22. 🎯 Mocne lokalne SEO — promień 100 km od Płużnica (87‑214)

### 22.1. Geo-strategia

Płużnica leży w pow. wąbrzeskim. W promieniu 100 km mieści się **całe woj. kujawsko-pomorskie + skrawki warmińsko-mazurskiego, pomorskiego i wielkopolskiego**.

### 22.2. Lista miast (priorytetyzowana po ilości wyszukiwań)

**TIER 1 — must have (osobne landing pages):**
- Toruń (53.013, 18.598) — 23 km, 200k mieszk.
- Bydgoszcz (53.123, 18.008) — 50 km, 340k mieszk.
- Grudziądz (53.488, 18.755) — 25 km, 90k mieszk.
- Włocławek (52.658, 19.067) — 75 km, 110k mieszk.
- Inowrocław (52.798, 18.262) — 60 km, 73k mieszk.

**TIER 2 — landing pages compact:**
- Chełmno (53.347, 18.426) — 20 km, 19k
- Wąbrzeźno (53.281, 18.948) — 8 km, 13k
- Świecie (53.408, 18.444) — 30 km, 25k
- Brodnica (53.258, 19.395) — 50 km, 28k
- Chełmża (53.184, 18.602) — 18 km, 15k
- Golub-Dobrzyń (53.106, 19.054) — 30 km, 13k
- Lipno (52.846, 19.183) — 65 km, 14k
- Rypin (53.066, 19.421) — 55 km, 16k
- Aleksandrów Kujawski (52.876, 18.701) — 50 km, 12k
- Nakło nad Notecią (53.143, 17.591) — 80 km, 19k
- Tuchola (53.589, 17.854) — 75 km, 14k
- Sępólno Krajeńskie (53.450, 17.532) — 90 km, 9k
- Kowalewo Pomorskie (53.156, 18.892) — 17 km, 4k
- Lisewo (53.421, 18.633) — 8 km, 2k
- Kowalewo, Płużnica, Wabcz, Lipinki, Rywałd, Książki, Łasin (3–15 km, lokalne wsie)

**TIER 3 — single mention w listach:**
- Iława, Ostróda (warmińsko-maz., 80–100 km)
- Pelplin, Tczew (pomorskie, 80–100 km)
- Żnin, Mogilno (kujawsko-pom., 70–90 km)
- Płock (mazowieckie, 100 km na granicy)

### 22.3. Struktura URL i contentu

```
/foto-wyzwanie/torun
/foto-wyzwanie/bydgoszcz
/foto-wyzwanie/grudziadz
/foto-wyzwanie/wabrzezno
... (jeden plik dynamiczny + tabela miast)
```

Każdy landing zawiera:
- H1: „Foto Wyzwanie {Miasto} — sesja fotograficzna w prezencie"
- 600+ słów uniqe content (najpopularniejsze plenery w danym mieście, opinie, lokalne ceny)
- Mapa Google z pinami lokalizacji w danym mieście
- Galeria przykładowych zdjęć Z TEGO MIASTA (z portfolio)
- FAQ specyficzne („Czy dojeżdżasz do {Miasto}?")
- LocalBusiness Schema z `areaServed: {Miasto}`
- Wewnętrzne linki do sąsiednich miast („Robisz też sesje w pobliskim {X}")
- Breadcrumbs Strona → Foto Wyzwanie → {Miasto}

### 22.4. Ścieżki lokalne (równolegle dla każdego modułu)

Powtarzamy dla:
- `/sesja-rodzinna/{miasto}`
- `/sesja-narzeczenska/{miasto}`
- `/fotograf-slubny/{miasto}`
- `/sesja-komunijna/{miasto}`
- `/foto-match/{miasto}` (po launchu)

= przy 5 modułach × 20 miast = **100 landing pages** (wszystkie SSR z ISR).

### 22.5. Off-site SEO

- **Google Business Profile** — zoptymalizowany 100% (zdjęcia co tydzień, posty co tydzień, opinie po każdej sesji)
- **NAP consistency** (Name, Address, Phone) w katalogach: GoWork, Panorama Firm, ZnanyLekarz wzorem (jeśli istnieje branża), Pkt.pl, Yellowpages.pl, Yelp
- **Lokalne katalogi:** Toruński Informator Kulturalny, BydgoszczInfo, lokalne fora rodzicielskie
- **Współpraca:** wymiana linków z lokalnymi MUA, wedding plannerami, salami zabaw, kwiaciarniami, restauracjami event
- **Lokalne PR:** artykuły w PomorskaTV, GazetaPomorska, Express Bydgoski („oryginalny prezent na…")
- **Backlinks tematyczne:** blogi parentingowe, ślubne (np. ślubnabydgoszcz.pl, weddingstyle.pl)

### 22.6. Schema.org Local

Każdy landing page miastowy ma `LocalBusiness` z:
```json
{
  "@type": ["LocalBusiness", "PhotographyBusiness"],
  "name": "Przemysław Właśniewski Fotograf",
  "areaServed": { "@type": "City", "name": "Toruń" },
  "geo": { "@type": "GeoCoordinates", "latitude": 53.013, "longitude": 18.598 },
  "address": { "@type": "PostalAddress", "addressLocality": "Płużnica", "postalCode": "87-214", "addressCountry": "PL" }
}
```

### 22.7. Sitemapa

`src/app/sitemap.ts` automatycznie generuje wpisy dla wszystkich kombinacji `module × city` (w `lib/seo/cities.ts` mamy listę miast z koordynatami).

### 22.8. Metryki sukcesu lokalnego SEO (po 6 mies.)

- 🎯 TOP 3 w Google na frazy „fotograf {miasto}" dla 8/20 miast
- 🎯 TOP 10 dla 15/20 miast
- 🎯 Google Business Profile: 50+ recenzji, 4.9 średnia
- 🎯 Organic traffic: +200% YoY
- 🎯 30% leadów z lokalnych landing pages

---

## 23. 📋 Następny krok

1. **Spotkanie decyzyjne** — odpowiedzi na 8 pytań z sekcji 13
2. **Wybór priorytetu:** najpierw audyt bezpieczeństwa (sekcja 16) i lokalne SEO (sekcja 22) — to robimy NA OBECNEJ stronie, niezależnie od Foto-Match
3. **Foto-Match MVP** — start dopiero po audycie bezpieczeństwa istniejącej strony
4. **Estymacja:**
   - Audyt bezpieczeństwa + naprawy: 2 tyg.
   - 20 landing pages lokalnych SEO: 1 tydz. (template + content AI z ręczną korektą)
   - One-click promo (FB + Google + IG): 1 tydz.
   - Mapa spotkań: 3 dni
   - Foto-Match MVP: 6 tyg.
   - PWA + push: 3 dni
   - Aplikacja Expo MVP: 4 tyg.

> **Nie wdrażamy bez Twojego „GO" na każdą sekcję osobno.**

