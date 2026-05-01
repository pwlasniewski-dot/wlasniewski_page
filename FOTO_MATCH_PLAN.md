# Foto-Match — Plan implementacji (8 tygodni)

> **Cel:** pełen end-to-end klient: rejestracja → profil → wybór partnera → płatność → sesja → admin CRM.
> **Filozofia:** reuse istniejącego CRM (User, JWT, PayU, `/admin/clients` pattern). Zero duplikatów.

---

## Decyzje architektoniczne (zatwierdzone)

| Obszar | Decyzja | Uzasadnienie |
|---|---|---|
| **Auth klienta** | Reuse `User` model + `src/lib/auth/jwt.ts` (Bearer token) | Spójność CRM — jeden klient = jedna karta w `/admin/clients` |
| **Płatności** | PayU (już zintegrowany w `src/lib/payu.ts`) | Polski rynek, BLIK, niższe opłaty niż Stripe |
| **Split płatności** | Parametryzacja per kampania (admin decyduje) | Modele: `INVITER_PAYS` / `SPLIT_50_50` / `INVITEE_CHOICE` |
| **Weryfikacja tożsamości** | MVP: manual queue (admin akceptuje selfie+dowód) | Najtaniej, najszybciej, kontrola jakości. Veriff/Onfido w fazie 9 (post-MVP) |
| **Czat** | Pusher Channels (real-time) | Wymóg user, ~$50/mc Sandbox-Free do 200k msg/dzień |
| **Moderacja zdjęć** | Hybryda: AWS Rekognition auto-flag → manual review flagged | Bezpieczne, koszt ~$0.001/zdjęcie |
| **Storage zdjęć** | S3 (już skonfigurowane: `wlasniewski-photo-storage`) | Reuse |
| **Email** | Istniejący `sendEmail()` (Resend? — zaudytować) | Reuse |
| **Real-time** | Pusher dla czatu, polling dla notyfikacji match | Prostota |

---

## Modele bazy danych (Prisma) — nowe

```prisma
// Profil użytkownika Foto-Match (1:1 z User)
model FotoMatchProfile {
  id              Int      @id @default(autoincrement())
  user_id         Int      @unique
  user            User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  display_name    String   @db.VarChar(60)
  birth_year      Int
  gender          String   @db.VarChar(20)        // male/female/other
  city            String   @db.VarChar(60)
  radius_km       Int      @default(30)
  bio             String?  @db.Text
  interests       String[] // tags
  experience      String?  // never_modeled / few_times / experienced
  comfort_level   String?  // shy / neutral / open

  // Weryfikacja
  selfie_url      String?
  id_doc_url      String?
  verified_at     DateTime?
  verified_by     Int?     // admin user id
  rejection_reason String?

  // Modaracja
  status          String   @default("PENDING") // PENDING | ACTIVE | SUSPENDED | DELETED
  is_active       Boolean  @default(false)
  flagged_count   Int      @default(0)

  // Metryki
  last_active     DateTime?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  photos          FotoMatchPhoto[]
  intents         SessionIntent[]
  matches_a       SessionMatch[] @relation("ProfileA")
  matches_b       SessionMatch[] @relation("ProfileB")
  messages_sent   MatchMessage[]
  reports_filed   ProfileReport[] @relation("Reporter")
  reports_against ProfileReport[] @relation("Reported")
}

// Zdjęcia profilowe (3-6 per profil)
model FotoMatchPhoto {
  id            Int      @id @default(autoincrement())
  profile_id    Int
  profile       FotoMatchProfile @relation(fields: [profile_id], references: [id], onDelete: Cascade)
  url           String
  position      Int      @default(0)  // 0 = main
  ai_status     String   @default("PENDING") // PENDING | APPROVED | FLAGGED | REJECTED
  ai_labels     Json?    // AWS Rekognition labels
  ai_flagged_for String? // nudity, violence, etc.
  reviewed_by   Int?     // admin id (jeśli flagged → manual review)
  reviewed_at   DateTime?
  created_at    DateTime @default(now())
}

// Intencja sesji (czego szukam)
model SessionIntent {
  id              Int      @id @default(autoincrement())
  profile_id      Int
  profile         FotoMatchProfile @relation(fields: [profile_id], references: [id], onDelete: Cascade)

  type            String   // ADVENTURE | LOCAL_COMMUNITY | NETWORKING (3 nasze tagi)
  partner_gender  String?  // any/male/female
  partner_age_min Int?
  partner_age_max Int?
  partner_city    String?
  budget_pln      Int?     // ile gotów wydać na sesję
  available_dates DateTime[]
  message         String?  @db.Text  // "Czego szukam, czemu jestem tu"
  is_active       Boolean  @default(true)

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  expires_at      DateTime?

  likes_given     SessionLike[] @relation("LikeFromIntent")
  likes_received  SessionLike[] @relation("LikeToProfile")
}

// "Polubienia" w decku
model SessionLike {
  id              Int      @id @default(autoincrement())
  from_intent_id  Int
  from_intent     SessionIntent @relation("LikeFromIntent", fields: [from_intent_id], references: [id], onDelete: Cascade)
  to_profile_id   Int
  to_profile      SessionIntent @relation("LikeToProfile", fields: [to_profile_id], references: [id], onDelete: Cascade)
  action          String   // LIKE | PASS
  created_at      DateTime @default(now())

  @@unique([from_intent_id, to_profile_id])
}

// Match (gdy obustronnie LIKE)
model SessionMatch {
  id                Int      @id @default(autoincrement())
  profile_a_id      Int
  profile_a         FotoMatchProfile @relation("ProfileA", fields: [profile_a_id], references: [id])
  profile_b_id      Int
  profile_b         FotoMatchProfile @relation("ProfileB", fields: [profile_b_id], references: [id])

  status            String   @default("MATCHED")
  // MATCHED → CHAT_OPEN → BOOKING_PROPOSED → PAID → SCHEDULED → COMPLETED → CANCELLED

  // Booking detail
  proposed_date     DateTime?
  proposed_location String?
  package_id        Int?     // jeśli używamy katalogu pakietów
  total_price_pln   Int?

  // Płatność
  payment_model     String?  // INVITER_PAYS | SPLIT_50_50 | INVITEE_CHOICE
  payu_order_a_id   String?
  payu_order_b_id   String?
  paid_a_at         DateTime?
  paid_b_at         DateTime?
  payment_status    String   @default("PENDING") // PENDING | PARTIAL | PAID | REFUNDED

  // Notatki admin
  admin_notes       String?  @db.Text

  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  messages          MatchMessage[]
}

// Wiadomości w czacie matcha
model MatchMessage {
  id          Int      @id @default(autoincrement())
  match_id    Int
  match       SessionMatch @relation(fields: [match_id], references: [id], onDelete: Cascade)
  sender_id   Int
  sender      FotoMatchProfile @relation(fields: [sender_id], references: [id])
  body        String   @db.Text
  is_read     Boolean  @default(false)
  created_at  DateTime @default(now())
}

// Zgłoszenia użytkowników
model ProfileReport {
  id            Int      @id @default(autoincrement())
  reporter_id   Int
  reporter      FotoMatchProfile @relation("Reporter", fields: [reporter_id], references: [id])
  reported_id   Int
  reported      FotoMatchProfile @relation("Reported", fields: [reported_id], references: [id])
  reason        String   // INAPPROPRIATE_PHOTO | HARASSMENT | FAKE | OTHER
  description   String?  @db.Text
  status        String   @default("OPEN") // OPEN | RESOLVED | DISMISSED
  resolved_by   Int?
  resolved_at   DateTime?
  resolution_notes String? @db.Text
  created_at    DateTime @default(now())
}

// Globalne ustawienia parametryzowalne (admin)
// Reuse istniejącego Setting{key,value}:
// foto_match_default_payment_model = INVITER_PAYS
// foto_match_default_session_price = 60000  // grosze
// foto_match_min_age = 18
// foto_match_active_cities = "Toruń,Bydgoszcz,Warszawa"
// foto_match_aws_rekognition_enabled = true
// foto_match_pusher_app_id = ...
```

---

## Plan 8-tygodniowy (per faza commit + deploy)

### **FAZA 1 (Tydzień 1) — Fundament + Profil**
**Cel:** klient może się zarejestrować na foto-match (osobny opt-in po zalogowaniu na CRM), wypełnić profil, wgrać zdjęcia.

- Migracja Prisma: `FotoMatchProfile` + `FotoMatchPhoto` (raw SQL → ZERO LOSS)
- `/foto-match/onboarding` (4 kroki client component): podstawowe → preferencje → zdjęcia → weryfikacja
- API:
  - `POST /api/foto-match/profile` (create/update)
  - `POST /api/foto-match/photos/upload` (S3 + AWS Rekognition)
  - `POST /api/foto-match/verify` (selfie + dowód → status PENDING)
  - `GET /api/foto-match/me` (current profile)
- Lib: `src/lib/foto-match/auth.ts` — wrapper na `verifyToken()` zwraca `FotoMatchProfile` lub 401
- Strona profilu: `/foto-match/profil` (edycja)
- AWS Rekognition setup: `src/lib/foto-match/moderation.ts`

**Deliverable:** zalogowany klient widzi przycisk "Dołącz do Foto-Match" w `/strefa-klienta`, klika, przechodzi onboarding, profil ląduje w `PENDING`.

### **FAZA 2 (Tydzień 2) — Admin: moderacja profili**
**Cel:** admin może zatwierdzać profile, akceptować/odrzucać zdjęcia, weryfikować tożsamość.

- `/admin/foto-match/dashboard` — KPI: pending verify, pending photos, active profiles, today signups
- `/admin/foto-match/profiles` (mimic `/admin/clients`): tabela z filtrem status/city, akcja [Zatwierdź/Odrzuć/Zawieś]
- `/admin/foto-match/profiles/[id]` — detail: zdjęcia w gridzie, dane, historia, przyciski moderacji
- `/admin/foto-match/photos-queue` — kolejka flagged przez AWS
- `/admin/foto-match/waitlist` — TO CO DZIŚ MA API (ale brak UI) — lista zapisanych z waitlistu, filtry city/intencja, eksport CSV
- Sidebar: nowa sekcja "Foto-Match" z 4 podpunktami
- API:
  - `GET /api/foto-match/admin/profiles` (filter, pagination)
  - `POST /api/foto-match/admin/profiles/[id]/approve|reject|suspend`
  - `POST /api/foto-match/admin/photos/[id]/approve|reject`
  - `POST /api/foto-match/admin/profiles/[id]/verify` (admin akceptuje selfie+dowód)

**Deliverable:** admin loguje się, widzi listę użytkowników, akceptuje pierwsze profile → `status=ACTIVE`.

### **FAZA 3 (Tydzień 3) — Intencje + Discovery deck**
**Cel:** zaakceptowany użytkownik tworzy intencję sesji i widzi deck osób w jego mieście.

- Migracja: `SessionIntent`, `SessionLike`
- `/foto-match/intencje` — lista moich intencji
- `/foto-match/intencje/nowa` — wizard 3-step: typ → preferencje → daty
- `/foto-match/odkrywaj` — swipe deck (reuse `react-tinder-card` lub custom)
- Algorytm dopasowania: rule-based w `src/lib/foto-match/matching.ts`
  - filter: gender, age range, city/radius, intent type match, NIE pokazane wcześniej
  - score: wspólne zainteresowania (jaccard), wspólne daty
- API:
  - `POST/GET /api/foto-match/intent`
  - `GET /api/foto-match/discover?intent_id=` — zwraca top N profile
  - `POST /api/foto-match/swipe` — body: `{ intent_id, target_profile_id, action: LIKE|PASS }`

**Deliverable:** dwa konta testowe → konto A swipe na konto B → widoczne tylko jednostronne.

### **FAZA 4 (Tydzień 4) — Match + Czat (Pusher)**
**Cel:** obustronny LIKE = match. Otwiera się czat real-time. Strony pisą do siebie.

- Migracja: `SessionMatch`, `MatchMessage`
- Pusher integracja: `src/lib/foto-match/pusher.ts` (server publish + client subscribe)
- Trigger w `/api/foto-match/swipe`: jeśli druga strona też dała LIKE → utwórz `SessionMatch`, push notyfikację, wyślij maile do obu
- `/foto-match/dopasowania` — lista matchy
- `/foto-match/czat/[match_id]` — chat UI (input + lista wiadomości + Pusher subscribe)
- API:
  - `GET /api/foto-match/matches`
  - `GET /api/foto-match/matches/[id]/messages`
  - `POST /api/foto-match/matches/[id]/messages` (publish do Pusher channel `private-match-{id}`)
  - `POST /api/foto-match/pusher/auth` (Pusher private channel auth endpoint)
- Email po match: "Masz nowe dopasowanie z Anną!"

**Deliverable:** match między dwoma kontami → otwiera się czat → real-time wiadomości lecą.

### **FAZA 5 (Tydzień 5) — Booking + PayU**
**Cel:** w czacie jeden z partnerów proponuje sesję (data, pakiet). Po akceptacji drugiego idzie checkout PayU. Po zapłacie — sesja `SCHEDULED`.

- W czacie: przycisk "Zaproponuj sesję" → modal (data, pakiet, lokalizacja, model płatności)
- Backend ustawia `SessionMatch.status = BOOKING_PROPOSED`, push do drugiej strony
- Druga strona: [Akceptuj / Odrzuć]. Po akceptacji → checkout
- Płatność: zgodnie z `payment_model`:
  - `INVITER_PAYS` → jedno PayU order na inicjatora
  - `SPLIT_50_50` → dwa osobne PayU orders, oba muszą zostać opłacone
  - `INVITEE_CHOICE` → drugi wybiera czy płaci pół czy nic
- Rozszerzenie `src/app/api/payu/notify/route.ts` o prefix `FOTOMATCH_<match_id>_<a|b>`
- Po pełnej zapłacie:
  - `SessionMatch.status = SCHEDULED`
  - Email do obu z potwierdzeniem
  - Email do Przemka z briefem sesji
  - (opcjonalnie) Booking utworzony w istniejącym `Booking` table → idzie w `/admin/availability`
- API:
  - `POST /api/foto-match/matches/[id]/propose-booking`
  - `POST /api/foto-match/matches/[id]/accept-booking` → returns checkout URL(s)
  - Webhook (rozszerzenie istniejącego)

**Deliverable:** end-to-end test: dwa konta → match → czat → propozycja → checkout PayU sandbox → webhook → SCHEDULED.

### **FAZA 6 (Tydzień 6) — Bezpieczeństwo + Zgłoszenia + Block**
**Cel:** użytkownicy mogą zgłaszać/blokować, admin obsługuje zgłoszenia.

- Migracja: `ProfileReport`
- W decku/czacie: przycisk "Zgłoś" → modal z reason
- W decku: przycisk "Zablokuj" → tworzy SessionLike z action=BLOCK, ukrywa wzajemnie
- `/admin/foto-match/zgloszenia` — kolejka zgłoszeń, filtry status, akcje [Ukarać/Oddalić]
- Auto-suspend gdy `flagged_count >= 3`
- Email do zgłoszonego "Twój profil jest w trakcie weryfikacji"
- API:
  - `POST /api/foto-match/report`
  - `POST /api/foto-match/block`
  - `GET /api/foto-match/admin/reports`
  - `POST /api/foto-match/admin/reports/[id]/resolve`

**Deliverable:** safety net działa, admin widzi i obsługuje zgłoszenia.

### **FAZA 7 (Tydzień 7) — Statystyki + Tuning + UX polish**
**Cel:** admin widzi pełen funnel; user UX dopieszczony.

- `/admin/foto-match/statystyki`:
  - Funnel: waitlist → registered → verified → first match → first booking → paid
  - Per miasto, per kohortę miesięczną
  - Wykres: liczba sesji per tydzień, średnia cena, churn, top intencje
  - Eksport CSV
- `/admin/foto-match/ustawienia` — parametryzacja:
  - Default `payment_model`
  - Default cena sesji
  - AWS Rekognition on/off
  - Max zgłoszeń przed auto-suspend
  - Lista aktywnych miast
- UX polish strona klienta:
  - Onboarding progress bar
  - Empty states (brak matchy, brak intencji)
  - Loading skeletons
  - Mobile responsive audit
  - Push notifications via service worker (opcjonalnie)
- Email templates wszystkie (welcome, verify, match, booking proposed, booking confirmed)

**Deliverable:** funkcjonalnie kompletny produkt, dane dla biznesu, UX gotowe na real users.

### **FAZA 8 (Tydzień 8) — E2E testy, performance, deploy production**
**Cel:** zero-defect launch.

- E2E testy Playwright dla critical paths:
  - Pełna podróż klienta (rejestracja → match → płatność)
  - Admin moderacja
  - Zgłoszenie + block
  - Płatność (mock PayU)
- Load testing: 1000 concurrent users na deck endpoint
- Security audit:
  - Rate limit na wszystkie POST endpoints
  - CSRF na formy
  - PII w logach (audit)
  - Photos URL signed (S3 presigned URLs zamiast publicznych)
- Backup strategy: codzienny snapshot bazy + S3 (już istnieje)
- Production setup:
  - Pusher production keys
  - AWS Rekognition production
  - PayU production credentials
  - Resend production
- Smoke test post-deploy
- Dokumentacja dla Przemka (admin manual)

**Deliverable:** launch-ready, przetestowany, monitorowany.

---

## Co odraczam świadomie (post-MVP, "Faza 9+")

- Profesjonalna weryfikacja Veriff/Onfido (na razie manual)
- Smart matching ML (na razie rule-based)
- Subskrypcje premium (na razie pay-per-session)
- Wideo intro w profilu
- Grupowe sesje (3+ osoby)
- Kalendarz fotografów (na razie ręcznie przez Przemka)
- Public profile sharing (link do zdjęć po sesji)
- Reviews/oceny po sesji

---

## Format pracy

- **Każda faza = osobny commit + push** (atomicznie, możemy odkręcić)
- **Po każdej fazie:** smoke test + screenshot/wideo demo
- **Każda migracja DB:** ręczny SQL przez Neon SQL editor (NIGDY `prisma db push|migrate deploy` — ZERO LOSS), backup branch przed migracją
- **Test każdej fazy:** Playwright e2e + manualne kliknięcie w dev
- **Komunikacja:** po każdej fazie krótki raport co działa, co odłożyłem

---

## Pytania do Ciebie przed startem Fazy 1

1. **Pusher konto** — czy mam zarejestrować nowy projekt, czy masz już Pusher? Jeśli nie — zarejestruję `wlasniewski-foto-match` w Sandbox (free tier 200k msg/dzień).
2. **AWS Rekognition** — masz już AWS access key (do S3)? Mogę dodać uprawnienia do Rekognition.
3. **Email provider** — chcę zaudytować jaki masz dziś (`sendEmail()` import). Załóżmy że Resend i działa.
4. **`User` model: czy klienci `/admin/clients` to są ci sami klienci co `/foto-match`?** TAK = jeden CRM (preferowane). NIE = osobna tabela. **Rekomenduję TAK** — wtedy w karcie klienta widać "Klient ma profil Foto-Match: status, matche, sesje".
5. **`/foto-match/onboarding` — czy wymagamy zalogowanego konta na CRM?** TAK = klient musi się najpierw zarejestrować/zalogować, potem dołączyć. NIE = osobna ścieżka rejestracji tylko na foto-match. **Rekomenduję TAK** — spójność, jedna baza klientów.

---

## Status

- [ ] Plan zaakceptowany przez user
- [ ] Pytania 1-5 odpowiedziane
- [ ] **FAZA 1 START**
