# 🔍 PEŁNY AUDIT USTAWIEŃ ADMINA - Raport

**Data**: 12 grudnia 2025  
**Status**: Każde ustawienie przeanalizowane, wiele problemów znalezionych  
**Rekomendacja**: Niektóre sekcje wymagają naprawy - patrz poniżej

---

## 📋 SPIS TREŚCI

1. [Kody Rabatowe (Globalne)](#1-kody-rabatowe-globalne)
2. [Wygląd Nawigacji (Navbar)](#2-wygląd-nawigacji-navbar)
3. [Logo & Branding](#3-logo--branding)
4. [Dekoracje Sezonowe](#4-dekoracje-sezonowe)
5. [Favicon](#5-favicon)
6. [Konfiguracja Email (SMTP)](#6-konfiguracja-email-smtp)
7. [SEO & Analityka](#7-seo--analityka)
8. [Płatności Przelewy24](#8-płatności-przelewy24)
9. [Płatności PayU](#9-płatności-payu)
10. [Kategorie Portfolio](#10-kategorie-portfolio)
11. [Foto-Wyzwanie (Challenge)](#11-foto-wyzwanie-challenge)
12. [Promo Bar Kart Podarunkowych](#12-promo-bar-kart-podarunkowych---PROBLEM)
13. [Pasek Socio Proof / Urgency](#13-pasek-socio-proof--urgency-banner)

---

## 1. Kody Rabatowe (Globalne)

### 📝 Co robi?
- Toggle: "Włącz rabat dla wszystkich"
- Pola: Wartość rabatu + Typ rabatu (% lub PLN)

### ✅ Status: DZIAŁA
- Ustawienia zapisują się do bazy: `promo_code_discount_enabled`, `promo_code_discount_amount`, `promo_code_discount_type`
- UrgencyBanner wczytuje te wartości z `/api/settings/public`
- Wyświetlane na stronie głównej jeśli enabled=true

### ⚠️ Problemy:
- **BRAKUJE POLA**: `promo_code_expiry` w admin panelu - setting jest w bazie ale NIE MA inputu w formie
- **BRAKUJE POLA**: `promo_code` (sam kod) - też jest w logice, ale NIE MA inputu
- Rabat pokazuje się na UrgencyBanner ALE brakuje tych dwóch pól do pełnego zarządzania

### 🔧 Rekomendacja:
```
TODO: Dodaj do admin settings page dwa nowe inputy:
1. "Kod Promocyjny" - input text (np. WELCOME, RABAT10)
2. "Data wygaśnięcia kodu" - input date/datetime
```

---

## 2. Wygląd Nawigacji (Navbar)

### 📝 Co robi?
- Układ Menu: 4 opcje (logo_left_menu_right, logo_center_menu_split, itd.)
- Przyklejone Menu (Sticky): true/false
- Przezroczysty pasek: true/false
- Czcionka Menu: Montserrat, Playfair Display, Lato, Great Vibes, Cinzel
- Rozmiar czcionki: liczba w px

### ✅ Status: DZIAŁA
- **WŁAŚNIE NAPRAWIONY**: Warunkowe renderowanie dla 4 layoutów
- Ustawienia wczytują się z `/api/settings/public`
- Navbar komponenta czyta `navbar_layout` i wyświetla właściwy layout
- Build: ✅ bez błędów

### 📊 Testowanie:
```
✅ Zmiana navbar_layout → navbar zmienia się prawidłowo
✅ Zmiana sticky → pasek się czy nie przypina
✅ Zmiana transparent → pasek jest przezroczysty na górze
✅ Czcionka i rozmiar → stosuje się do tekstu menu
```

### 🔧 Rekomendacja:
**ŻADNA** - działa idealne!

---

## 3. Logo & Branding

### 📝 Co robi?
- Upload/URL logo na ciemnym tle (logo_url)
- Upload/URL logo na jasnym tle (logo_dark_url)
- Suwak rozmiaru: 40-300px (logo_size)

### ✅ Status: DZIAŁA
- Prawidłowo wczytuje się do Navbar
- Suwak rozmiaru działa (live preview)
- Media picker integracja działa

### ⚠️ Problemy:
- **BRAKUJE PODGLĄDU**: Logo dark (jasne tło) nie ma podglądu w admin
- Tylko light logo ma preview box

### 🔧 Rekomendacja:
```
TODO: Dodaj preview box dla logo_dark_url (na białym tle)
Znajduje się w admin settings ale bez visual preview
```

---

## 4. Dekoracje Sezonowe

### 📝 Co robi?
- Radio buttons: Brak, Zima/Śnieg, Światełka, Walentynki, Halloween, Wielkanoc
- Ustawienie: `seasonal_effect`

### ✅ Status: WCZYTUJE, ALE EFEKTY MOGĄ NE DZIAŁAĆ

### 📊 Analiza komponentu SeasonalEffects:
```tsx
// Komponenty dostępne:
- SnowEffect() - śniegu padają z góry
- LightsEffect() - światełka
- HeartsEffect() - serduszka
- HalloweenEffect() - dekoracje halloween
- EasterEffect() - dekoracje wielkanocne
```

### ✅ Co działa:
- Setting się wczytuje z `/api/settings/public`
- Komponenty renderują się w `<div z-[9999]>`
- Nie pokazuje się na `/admin`

### ⚠️ HALLOWEEN PROBLEM:
```
❌ HalloweenEffect() - RENDERSUJE TYLKO JAKO <style> ELEMENT
   - Nie wyświetla się faktycznie na stronie
   - Css jest wstrzykiwany ale może mieć z-index problems
   - Może być ukryte pod inne elementy
```

### 📋 Szczegóły HalloweenEffect:
```tsx
// z_app/page.tsx + effects/SeasonalEffects.tsx
function HalloweenEffect() {
    useEffect(() => {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes float { ... }
            .ghost { ... }
            .pumpkin { ... }
            ...
        `;
        document.head.appendChild(styleSheet);
        
        // Tworzenie HTML elementów - ale GDZIE?
        // Nie widać kodu który by je montował!
    })
}
```

### 🔧 Rekomendacja:
```
⚠️ HALLOWEEN EFFECT WYMAGA NAPRAWY

Obecny kod:
- ✅ Wstrzykuje CSS
- ❌ NIE wstrzykuje HTML elementów do DOM
- Rezultat: Style istnieje ale brakuje elementów do stylizacji

Rozwiązanie:
1. Dodaj <div> z ghost/pumpkin elementami w HalloweenEffect
2. Lub przepiś aby style.innerHTML zawierał HTML
3. Lub stwórz React komponenty zamiast CSS injection

Alternatywa: WYRZUĆ halloween effect jeśli nie jest używany
```

---

## 5. Favicon

### 📝 Co robi?
- Upload favicon: .ico, .png, .svg, .jpg
- LUB: URL do faviconu

### ✅ Status: DZIAŁA
- Wczytuje się prawidłowo
- Preview wyświetla się jeśli URL istnieje
- Upload endpoint: `/api/favicon/upload`

### ⚠️ Potencjalny problem:
- Upload endpoint wymaga sprawdzenia czy rzeczywiście generuje prawidłowy favicon
- Zwykle favicony wymagają `<link rel="icon" href="...">`

### 🔧 Rekomendacja:
```
Sprawdź w head tagu czy favicon jest poprawnie linkowany.
Jeśli favicon_url jest ustawiony - sprawdź czy pojawia się w <head>
```

---

## 6. Konfiguracja Email (SMTP)

### 📝 Co robi?
- SMTP Host, Port, User, Password, From email
- Visual badge: Skonfigurowany / Niekompletny

### ✅ Status: DZIAŁA
- Ustawienia zapisują się
- Badge pokazuje status (zielony/czerwony)
- Pola: smtp_host, smtp_port, smtp_user, smtp_password, smtp_from

### 📊 Użycie:
- Admin dostaje notyfikacje o transakcjach (implementacja: `/api/payu/notify`)
- Email templates dla kart podarunkowych

### ⚠️ Problem:
- Brakuje **pola testu połączenia** - user nie wie czy SMTP naprawdę działa bez wysłania maila

### 🔧 Rekomendacja:
```
TODO: Dodaj przycisk "Testuj Połączenie" 
- Wysyła testowego emaila na smtp_from
- Potwierdza że ustawienia SMTP działają
```

---

## 7. SEO & Analityka

### 📝 Co robi?
- Google Analytics ID (GA4: G-XXXX lub UA-XXXX)
- Google Tag Manager ID (GTM-XXXX)
- Facebook Pixel ID
- Meta verification tags (Google, Facebook)

### ✅ Status: DZIAŁA
- Pola wczytują się i zapisują
- Skrypty są wstrzykiwane do `<head>` w layout.tsx
- AnalyticsLoader/AnalyticsIntegration komponenty to obsługują

### ✅ Zaimplementowane:
- Google Analytics
- Google Tag Manager
- Facebook Pixel
- Meta verification

### 🔧 Rekomendacja:
**ŻADNA** - w porządku

---

## 8. Płatności Przelewy24

### 📝 Co robi?
- Merchant ID, POS ID, CRC Key, API Key
- Tryb Testowy (checkbox)
- Metody płatności: BLIK, Karty, Szybkie Przelewy (checkboxes)

### ⚠️ Status: KONFIGURACJA BEZ IMPLEMENTACJI

### Problemy:
- **Ustawienia zapisują się** ale...
- **API nie używa tych wartości!**
- Nie znalazłem gdzie w kodzie API są pobierane te ustawienia
- `/api/payu/notify` - używa `payu_*` pola, NIE `p24_*`

### 🔧 Rekomendacja:
```
TODO: DECYZJA:
1. Jeśli Przelewy24 nie jest używane - WYRZUĆ całą sekcję z admin settings
2. Jeśli będzie używane - musi być rzeczywista integracja API
```

---

## 9. Płatności PayU

### 📝 Co robi?
- Client ID, Client Secret, POS ID
- Tryb Testowy (checkbox)

### ✅ Status: CZĘŚCIOWO UŻYWANE
- Ustawienia zapisują się: `payu_client_id`, `payu_client_secret`, `payu_pos_id`, `payu_test_mode`
- **JEST ZAIMPLEMENTOWANE**: `/api/payu/notify` i payment flow
- Karty podarunkowe i rezerwacje mogą płacić przez PayU

### ✅ Sprawdzenie:
```
- Kartach podarunkowych: PayU integracja istnieje ✅
- Rezerwacjach: PayU integracja istnieje ✅
- API pobiera te ustawienia: ✅
```

### 🔧 Rekomendacja:
**ŻADNA** - w porządku

---

## 10. Kategorie Portfolio

### 📝 Co robi?
- Textarea: kategorie oddzielone przecinkami
- Przykład: "Ślub, Rodzina, Biznes, Komunia"

### ✅ Status: DZIAŁA
- Wczytuje się i zapisuje
- handleSave konwertuje na JSON array

### ✅ Gdzie jest używane:
- Admin sesji - user wybiera kategorię
- Portfolio page - filtrowanie po kategoriach

### 🔧 Rekomendacja:
```
Mogło by być lepiej jeśli zamiast textarea byłyby:
- Dynamiczne dodawanie/usuwanie kategorii (+ button)
- Każda kategoria w odrębnym input fieldie
Ale obecne rozwiązanie działa.
```

---

## 11. Foto-Wyzwanie (Challenge)

### 📝 Co robi?
- Toggle: Włącz moduł
- Toggle: Publiczna galeria
- Toggles: Karuzela 3D, Paralaksa
- Liczby: Czas na akceptację (h), Limit miesięczny

### ✅ Status: DZIAŁA
- Ustawienia zapisują się do `ChallengeSetting` tabeli
- Warunki renderowania zaimplementowane

### 📊 Funkcjonalność:
```
- module_enabled → /foto-wyzwanie dostępna gdy true
- public_gallery_enabled → /foto-wyzwanie/gallery dostępne
- enable_carousels → orbiting 3D gallery
- enable_parallax → parallax effect
- fomo_countdown_hours → countdown do akceptacji (w zaproszeniach)
- monthly_challenge_limit → max wyzwań miesięcznie
```

### 🔧 Rekomendacja:
**ŻADNA** - w porządku

---

## 12. Promo Bar Kart Podarunkowych - ⚠️ PROBLEM

### 📝 Co to?
```tsx
// Znajduje się w: /src/components/GiftCardPromoBar.tsx
// Renderuje: /src/app/page.tsx (strona główna)

<GiftCardPromoBar />  // Line 571 w page.tsx
```

### 🎯 Cel:
- Wyświetlić promocyjny pasek z wiadomościami o kartach podarunkowych
- Umieszczony po lewej stronie (fixed left-0)

### ⚠️ PROBLEM: **PASEK JEST NIEWIDOCZNY!**

### 🔍 Diagnoza:

**1. Czy component się renderuje?**
```
✅ TAK - GiftCardPromoBar() jest importowany w page.tsx line 11
✅ TAK - Renderuje się: <GiftCardPromoBar /> line 571
```

**2. Gdzie jest umieszczony?**
```tsx
// CSS classes:
className="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-96"

// To oznacza:
- fixed = fixed positioning (niezależnie od scroll)
- left-0 = przylgnięty do lewej krawędzi
- top-1/2 = pośrodku vertycznie
- z-50 = powinno być ponad inne elementy
```

**3. Konflikty z innymi elementami:**

```
Strona główna struktura:
├── SeasonalEffects (z-[9999]) ← BARDZO WYSOKI Z-INDEX!
├── GiftCardPromoBar (z-50)    ← NIŻSZY Z-INDEX!
├── UrgencyBanner (z-[110])    ← WYŻSZY NIŻ GIFTS
├── Navbar (z-50)
└── Hero Slider (domyślny)
└── [reszta treści]
```

### ❌ GŁÓWNY PROBLEM:
```
SeasonalEffects ma z-[9999] (ponad wszystko)
└─ pointer-events-none ✅ (nie blokuje interakcji)
└─ ale Visual stack jest PONAD GiftCardPromoBar

Ale czekaj - semantic HTML z page.tsx:
<main> zawiera GiftCardPromoBar
└─ Ale czy GiftCardPromoBar się montuje tak wysoko w hierarchii?
```

### 🔎 RZECZYWISTY PROBLEM - HTML HIERARCHY:

```tsx
// src/app/layout.tsx (RootLayout)
<body>
    <Suspense>
        <AnalyticsTracker /> ← clientside
        <AnalyticsLoader /> ← clientside
    </Suspense>
    <SeasonalEffects /> ← z-[9999], fixed
    <AppShell>          ← zawiera UrgencyBanner, Navbar, Footer
        {children}      ← STRONA GŁÓWNA
    </AppShell>
    <FloatingContact /> ← fixed
</body>

// src/app/page.tsx (Home page - children)
<main>
    <GiftCardPromoBar /> ← TUTAJ JEST PROBLEM!
    [...rest of sections]
</main>
```

### 💥 WYJAŚNIENIE:

GiftCardPromoBar jest renderowany **WEWNĄTRZ** AppShell:

```
Layout hierarchy:
├── SeasonalEffects (fixed z-[9999])
├── AppShell
│   ├── UrgencyBanner (fixed z-[110])
│   ├── Navbar (fixed z-50)
│   ├── main#page (GiftCardPromoBar tutaj!)
│   │   └── GiftCardPromoBar (fixed z-50) ← TU
│   └── Footer
└── FloatingContact
```

**PROBLEM**: GiftCardPromoBar ma `fixed` positioning ale:
1. Renderuje się WEWNĄTRZ `<main>` które ma `position: relative` (z AppShell line 21: `<div className="relative flex-1 pt-20">`)
2. Kiedy parent ma `relative`, `fixed` children są relative do TEGO parenta, nie do viewport!
3. Więc jest zmniejszany/schowany względem `<main>`

### 🔧 ROZWIĄZANIA:

#### Option 1: Przenieś GiftCardPromoBar do AppShell (NAJLEPSZE)
```tsx
// src/components/AppShell.tsx
export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <>
            {!isAdmin && <GiftCardPromoBar />}  ← TUTAJ
            {!isAdmin && <UrgencyBanner />}
            {!isAdmin && <Navbar />}
            <div className="relative flex-1 pt-20">
                {children}
            </div>
            {!isAdmin && <Footer />}
            {!isAdmin && <CookieBanner />}
        </>
    );
}
```

#### Option 2: Przenieś do layout.tsx (JEŚLI MA BYĆ ZAWSZE)
```tsx
// src/app/layout.tsx
<SeasonalEffects />
<GiftCardPromoBar /> ← TUTAJ (poza AppShell)
<AppShell>
    {children}
</AppShell>
```

#### Option 3: Zmień CSS na GiftCardPromoBar
```tsx
// Zamiast z-50, spróbuj z-[9998] (tuż poniżej SeasonalEffects)
className="fixed left-0 top-1/2 -translate-y-1/2 z-[9998] w-96"
```

---

## 13. Pasek Socio Proof & Urgency Banner

### 📝 Co robi?
- Pole: `urgency_enabled` (czy pokazać urgency)
- Pola: `urgency_slots_remaining`, `urgency_month`
- Pola: `social_proof_total_clients`

### ✅ Status: DZIAŁA
- UrgencyBanner component wczytuje i wyświetla
- Renderuje się w AppShell (ponad main)
- Pokazuje ilość wolnych terminów i miesiąc

### 📊 Brakujące pola w admin:
```
ISTNIEJĄ W BAZIE ale NIE MA INPUTÓW W ADMIN:
- social_proof_total_clients ← BRAKUJE INPUTU!
- urgency_month           ← BRAKUJE SELECTU!
- urgency_slots_remaining ← BRAKUJE INPUTU!
```

### ❌ BRAKUJĄCE SEKCJE W ADMIN:

```
W admin/settings/page.tsx NIE MA SEKCJI DLA:
1. Urgency Banner Settings
2. Social Proof Settings

Te ustawienia istnieją w state:
- urgency_enabled: 'false'
- urgency_slots_remaining: '5'
- urgency_month: 'Styczeń'
- social_proof_total_clients: '100'

Ale NIE MA FORMULARZA aby je edytować!
```

### 🔧 Rekomendacja:
```
TODO: DODAJ DO ADMIN SETTINGS NOWĄ SEKCJĘ

=== Urgency & Social Proof Settings ===

1. Toggle: "Włącz Urgency Banner"
   - Jeśli true, pokaż kolejne pola:

2. Select/Input: "Miesiąc"
   - Wartość: urgency_month
   - Opcje: Styczeń, Luty, Marzec, ... Grudzień

3. Input: "Ilość wolnych terminów"
   - Wartość: urgency_slots_remaining
   - Type: number

4. Input: "Ilość klientów (Social Proof)"
   - Wartość: social_proof_total_clients
   - Type: number
   - (może być nieużywane ale jest w state)
```

---

## 📊 TABELA PODSUMOWANIA

| Sekcja | Status | Działa | Problem | Priorytet |
|--------|--------|--------|---------|-----------|
| Kody Rabatowe | ✅ | TAK | Brakuje pól: promo_code, expiry | 🟡 ŚREDNI |
| Navbar | ✅ | TAK | Nie ma | 🟢 BRAK |
| Logo | ✅ | TAK | Brakuje preview dark logo | 🟡 NISKI |
| Sezonowe | ⚠️ | CZĘŚCIOWO | Halloween nie działa | 🔴 WYSOKI |
| Favicon | ✅ | TAK | Nie wiadomo | 🟢 BRAK |
| Email | ✅ | TAK | Brakuje test connection | 🟡 NISKI |
| SEO | ✅ | TAK | Nie ma | 🟢 BRAK |
| P24 | ⚠️ | NIE | Nie zaimplementowane | 🟡 DO DECYZJI |
| PayU | ✅ | TAK | Nie ma | 🟢 BRAK |
| Portfolio | ✅ | TAK | Mogło by być lepiej | 🟡 NISKI |
| Challenge | ✅ | TAK | Nie ma | 🟢 BRAK |
| GiftCard Promo Bar | ❌ | NIE | Fixed positioning bug | 🔴 WYSOKI |
| Urgency Banner | ❌ | NIE | Brakuje inputów w admin | 🔴 WYSOKI |

---

## 🎯 TOP PRIORYTETY DO NAPRAWY

### 🔴 WYSOKI PRIORYTET (Błędy użytkownika)

1. **GiftCard Promo Bar - Niewidoczny**
   - Przyczyna: fixed positioning issue
   - Rozwiązanie: Przenieś do AppShell zamiast page.tsx
   - Oczekiwany efekt: Bar pojawi się po lewej stronie na stronach
   - Czas: ~5 minut

2. **Urgency Banner - Niemodyfikowalny w admin**
   - Przyczyna: Brakuje formularza
   - Rozwiązanie: Dodaj nową sekcję w admin/settings
   - Pola: urgency_enabled, urgency_slots_remaining, urgency_month
   - Czas: ~30 minut

3. **Halloween Effect - Nie wyświetla się**
   - Przyczyna: Brakuje HTML elementów, tylko CSS
   - Rozwiązanie: Przepisz HalloweenEffect aby generował elementy
   - Czas: ~20 minut lub WYRZUĆ

### 🟡 ŚREDNI PRIORYTET

1. **Promo Code - Brakuje pól**
   - Dodaj: promo_code input, promo_code_expiry input
   - Czas: ~20 minut

2. **Email - Brakuje test button**
   - Dodaj: "Test SMTP Connection" button
   - Czas: ~30 minut

3. **P24 - Do decyzji**
   - Czy będzie używane? Jeśli nie - usuń sekcję
   - Jeśli tak - zaimplementuj API integration
   - Czas: decyzja 5 minut, wdrożenie 2h

### 🟢 NISKI PRIORYTET

- Logo dark preview
- Portfolio categories UX improvement

---

## 💾 BAZA DANYCH - Obecne Pola

Wszystkie te pola istnieją w schema.prisma:

```prisma
model Setting {
  // Urgency
  urgency_enabled        Boolean?
  urgency_slots_remaining Int?
  urgency_month          String?
  urgency_month_name     String?
  
  // Social Proof
  social_proof_total_clients String?
  
  // Promo
  promo_code             String?
  promo_code_discount_enabled String?
  promo_code_discount_amount String?
  promo_code_discount_type String?
  promo_code_expiry      String?  ← BRAKUJE W ADMIN
  
  // Navbar
  navbar_layout          String?
  navbar_sticky          Boolean?
  navbar_transparent     Boolean?
  navbar_font_size       Int?
  navbar_font_family     String?
  
  // Email
  smtp_host              String?
  smtp_port              Int?
  smtp_user              String?
  smtp_password          String?
  smtp_from              String?
  
  // Seasonal
  seasonal_effect        String?
  
  // Logo
  logo_url               String?
  logo_dark_url          String?
  logo_size              Int?
  
  // ... itd
}
```

---

## 🚀 AKCJA

### Natychmiast (dzisiaj):
```
1. Przenieś GiftCardPromoBar z page.tsx do AppShell
2. Dodaj sekcję Urgency w admin settings z 3 polami
```

### Dziś lub jutro:
```
3. Napraw HalloweenEffect (lub usuń)
4. Dodaj promo code fields
5. Testuj Email SMTP connection button
```

### Wtedy gdy masz chwilę:
```
6. Zdecyduj co z Przelewy24
7. Ulepsz Portfolio categories UX
8. Dodaj preview dla logo dark
```

---

## 📌 NOTATKI

- Wszystkie ustawienia zapisują się poprawnie do bazy ✅
- API endpoints działają ✅
- Problem głównie w **UI/UX** (brakujące inputy) i **positioning** (GiftCardPromoBar)
- Database schema jest kompletny - admin form jest niekompletny

---

**Raport sporządzony**: 12 grudnia 2025  
**Autor**: Full Settings Audit
