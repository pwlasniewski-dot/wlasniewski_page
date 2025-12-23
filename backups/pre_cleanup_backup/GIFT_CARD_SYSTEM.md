# 🎁 System Kart Podarunkowych - Dokumentacja

## Przegląd Funkcjonalności

System umożliwia:
1. **Promocyjny pasek na stronie głównej** - wysuwający się z rotacją tematów
2. **Sklep kart podarunkowych** - przeglądanie i zakup kart
3. **Strona płatności** - bezpieczne dokonanie transakcji
4. **Zarządzanie z admina** - włączanie/wyłączanie, konfiguracja cen

---

## 📱 Komponenty

### 1. **GiftCardPromoBar** (`/src/components/GiftCardPromoBar.tsx`)
- Wysuwający się pasek promocyjny na górze strony
- Automatycznie rotujący komunikaty z różnych tematów
- Można włączać/wyłączać z admina
- Animowany backgrund z ikonami tematów

**Konfiguracja z admina:**
- Włączenie/wyłączenie: `gift_card_promo_enabled` (true/false)
- Wiadomości: `gift_card_promo_messages` (JSON)

---

### 2. **GiftCardShop** (`/src/app/karta-podarunkowa/page.tsx`)
- Strona sklepu z dostępnymi kartami
- Filtrowanie po tematach
- Wyświetlanie ceny vs wartości karty
- Możliwość polubienia i udostępniania
- Responsywny grid

**URL:** `/karta-podarunkowa`

---

### 3. **BuyGiftCard** (`/src/app/karta-podarunkowa/[id]/kup/page.tsx`)
- Strona szczegółów karty przed zakupem
- Duży podgląd karty
- Porównanie ceny i wartości
- Lista tego co otrzymasz
- Przycisk do płatności

**URL:** `/karta-podarunkowa/{id}/kup`

---

## 🔧 API Endpoints

### `GET /api/gift-cards/shop`
Pobiera dostępne karty do sprzedaży
```json
[
  {
    "id": 1,
    "code": "DS",
    "value": 100,
    "theme": "christmas",
    "price": 50,
    "description": "Karta podarunkowa...",
    "available": true,
    "card_title": "KARTA PODARUNKOWA",
    "card_description": "Specjalny upominek"
  }
]
```

### `GET /api/admin/gift-card-promo`
Pobiera ustawienia promocji
```json
{
  "enabled": true,
  "messages": [
    {
      "id": 1,
      "title": "🎁 Chcesz podarować?",
      "message": "Kup kartę podarunkową",
      "cta_text": "Kup kartę",
      "icon": "🎁",
      "colors": { "bg": "#DC143C", "accent": "#FFD700" }
    }
  ]
}
```

### `POST /api/admin/gift-card-promo` (Wymaga auth)
Aktualizuje ustawienia promocji
```json
{
  "enabled": true,
  "messages": [ /* ... */ ]
}
```

### `POST /api/gift-cards/checkout`
Tworzy sesję płatności
```json
Request:
{
  "cardId": 1,
  "price": 50,
  "value": 100,
  "theme": "christmas"
}

Response:
{
  "success": true/false,
  "checkoutUrl": "https://..."
}
```

---

## 🎨 Ceny i Tematyka

### Dostępne Tematy
- 🎄 christmas - Boże Narodzenie
- 💛 wosp - WOŚP
- 💝 valentines - Walentynki
- 🐰 easter - Wielkanoc
- 👻 halloween - Halloween
- 💐 mothers-day - Dzień Matki
- 🎈 childrens-day - Dzień Dziecka
- 💒 wedding - Ślub
- 🎂 birthday - Urodziny

### Kalkulacja Ceny
- Domyślnie: 10% wartości karty lub 50 PLN (co więcej)
- Można customizować per temat z admina
- Ustawianie: `gift_card_price_{theme}` (np. `gift_card_price_christmas`)

---

## 🛒 Jak Klienci Kupują Kartę

1. **Widzą promocję** na stronie głównej → klikają CTA
2. **Trafiają do sklepu** `/karta-podarunkowa`
3. **Filtrują po temacie** i wybierają kartę
4. **Klikają "Kup teraz"** → przeniesienie do `/karta-podarunkowa/{id}/kup`
5. **Przeglądają szczegóły** i klikają "Przejdź do płatności"
6. **Wybierają metodę płatności** (Stripe/PayU)
7. **Po płacie** - dostępne opcje:
   - Wysłanie mailem
   - Wydrukowanie
   - Udostępnianie klientowi

---

## ⚙️ Konfiguracja z Admina

### Settings do Ustawienia

```sql
-- Włączenie sklepu
INSERT INTO settings (setting_key, setting_value) 
VALUES ('gift_card_shop_enabled', 'true');

-- Włączenie promocji
INSERT INTO settings (setting_key, setting_value) 
VALUES ('gift_card_promo_enabled', 'true');

-- Metoda płatności
INSERT INTO settings (setting_key, setting_value) 
VALUES ('payment_method', 'stripe'); -- lub 'payu'

-- Ceny per temat
INSERT INTO settings (setting_key, setting_value) 
VALUES ('gift_card_price_christmas', '50');

INSERT INTO settings (setting_key, setting_value) 
VALUES ('gift_card_price_wosp', '40');

-- Wiadomości promocji (JSON)
INSERT INTO settings (setting_key, setting_value) 
VALUES ('gift_card_promo_messages', '[...]');
```

### Panel Admina (TODO)
Potrzeba stworzyć stronę admina:
- `/admin/gift-cards/shop` - zarządzanie kartami w sprzedaży
- `/admin/gift-cards/promocja` - edycja promocji i komunikatów
- `/admin/gift-cards/ceny` - ustawianie cen per temat
- `/admin/gift-cards/zamowienia` - lista zamówień i dostępu

---

## 🔐 Bezpieczeństwo Płatności

- **Stripe**: Klucze API w environment variables
- **PayU**: Certyfikaty i klucze bezpieczeństwa
- **HTTPS**: Wszystkie płatności szyfrowane
- **PCI DSS**: Zgodność ze standardami

---

## 📝 Następne Kroki

1. **Integracja Stripe** - implementacja tworzenia sesji checkout
2. **Integracja PayU** - jako alternatywa
3. **Admin panel** - stronami do zarządzania
4. **Email notifications** - potwierdzenia zakupu i dostępu
5. **Analytics** - śledzenie sprzedaży kart

---

## 🎯 Schemat Działania

```
Strona główna
    ↓ (GiftCardPromoBar)
Klik na promocję
    ↓
/karta-podarunkowa (Shop)
    ↓ Wybór tematu
    ↓ Polubienie
    ↓
Klik "Kup teraz"
    ↓
/karta-podarunkowa/{id}/kup (BuyCard)
    ↓ Przegląd
    ↓
Klik "Przejdź do płatności"
    ↓
Stripe/PayU (checkout)
    ↓ Płatność
    ↓
Potwierdzenie + dostęp
    ↓
Email + PDF do wydruku
```

---

## 💡 Customization

### Dodawanie Nowego Tematu
1. Dodaj do `THEME_INFO` w komponentach
2. Dodaj kolory do `giftCardTemplate.ts`
3. Dodaj do `GiftCard.tsx` theme configs
4. Ustaw cenę w settings: `gift_card_price_{theme}`

### Zmiana Ceny
```bash
# W bazie lub przez API
UPDATE settings 
SET setting_value = '75' 
WHERE setting_key = 'gift_card_price_christmas';
```

### Włączenie/Wyłączenie Promocji
```bash
# Wyłączyć
UPDATE settings 
SET setting_value = 'false' 
WHERE setting_key = 'gift_card_promo_enabled';

# Włączyć
UPDATE settings 
SET setting_value = 'true' 
WHERE setting_key = 'gift_card_promo_enabled';
```
