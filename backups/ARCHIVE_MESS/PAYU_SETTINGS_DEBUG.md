# 🔧 Diagnoza Błędu Zapisywania Ustawień PayU

## Status
- ✅ Pola PayU istnieją w schema: `payu_client_id`, `payu_client_secret`, `payu_merchant_pos_id`, `payu_md5_key`, `payu_notify_url`, `payu_environment`
- ✅ Pola są w bazie danych (migracja potwierdzona)
- ⚠️ Problem: Ustawienia mogą się nie zapisywać LUB mogą być NULL

## Dodane Debug Logs

### 1. W admin panelu (`src/app/admin/settings/page.tsx`)
Gdy klikasz "Zapisz", w DevTools → Console widać będą:
```
[Admin Settings] Saving settings: {
  payu_client_id: "...",
  payu_client_secret: "...",
  payu_pos_id: "...",
  payu_md5_key: "...",
  payu_test_mode: ...
}
```

### 2. Na serwerze (`src/app/api/settings/route.ts`)
W logach serwera widać:
```
[API Settings POST] Received body: {
  payu_client_id: "...",
  payu_client_secret: "...",
  payu_pos_id: "...",
  payu_md5_key: "...",
  payu_test_mode: ...
}

[API Settings POST] Mapping payu_pos_id to payu_merchant_pos_id: ...
[API Settings POST] Mapping payu_test_mode to payu_environment: ...

[API Settings POST] Column updates to apply: {
  payu_merchant_pos_id: "...",
  payu_client_id: "...",
  payu_client_secret: "...",
  payu_md5_key: "...",
  payu_environment: "..."
}
```

## Kroki diagnostyczne

### Krok 1: Sprawdź czy wartości przychodzą z frontend
1. Otwórz admin panel
2. DevTools → Network
3. Przejdź do "Konfiguracja Płatności (PayU)"
4. Wpisz wartości PayU (client_id, client_secret, pos_id, md5_key)
5. Kliknij "Zapisz"
6. W Network tab kliknij na request do `/api/settings`
7. Sprawdź Request payload → czy zawiera Twoje wartości PayU?

**Jeśli TAK** → Wartości przychodzą z frontend OK ✅

**Jeśli NIE** → Frontend nie wysyła wartości (problem w state)

### Krok 2: Sprawdź czy server je otrzymuje
1. Kliknij "Zapisz" ponownie
2. Otwórz serwer logs (jeśli masz dostęp do konsoli serwera/Vercel logs)
3. Sprawdź czy widzisz log `[API Settings POST] Received body` z Twoimi wartościami

**Jeśli TAK** → Server je otrzymuje ✅

**Jeśli NIE** → Coś jest nie tak z requestem

### Krok 3: Sprawdź czy się zapisują do bazy
1. Po wysłaniu, sprawdź czy response to `{ success: true }`
2. Poczekaj 5 sekund
3. Odśwież admin panel (F5)
4. Sprawdź czy PayU pola nadal zawierają Twoje wartości

**Jeśli TAK** → Zapisywanie działa ✅

**Jeśli NIE** (resetują się na puste) → Coś jest nie tak z zapisem do bazy

### Krok 4: Sprawdź czy payment API je pobiera
1. Spróbuj utworzyć zamówienie (karta podarunkowa / rezerwacja)
2. Jeśli error "PayU settings not configured" → Pola są NULL w bazie

## Możliwe przyczyny

### 1. ❌ Wartości nie przychodzą z frontend
**Przyczyna**: Problem w admin form state  
**Rozwiązanie**: 
- Sprawdź czy inputy są poprawnie bound do state
- Sprawdź czy onChange handler działa

### 2. ❌ Server nie zapisuje do bazy
**Przyczyna**: Problem z Prisma update lub authentication  
**Rozwiązanie**:
- Sprawdź czy admin token jest prawidłowy
- Sprawdź czy withAuth middleware pozwala na operacje
- Sprawdź Prisma query logs

### 3. ❌ Wartości się resetują po przeładowaniu
**Przyczyna**: Albo się nie zapisały, albo nie pobierają ze store  
**Rozwiązanie**:
- Sprawdź czy GET `/api/settings` zwraca Twoje wartości
- Sprawdzić czy fetchSettings prawidłowo parsuje response

## Bezpośrednie Sprawdzenie Bazy

Jeśli potrzebujesz sprawdzić bezpośrednio co jest w bazie:

```sql
SELECT 
  payu_client_id,
  payu_client_secret,
  payu_merchant_pos_id,
  payu_md5_key,
  payu_notify_url,
  payu_environment
FROM settings
LIMIT 1;
```

**Oczekiwane wartości:**
- Jeśli wszystkie NULL → Nic się nie zapisało
- Jeśli tylko niektóre NULL → Częściowy zapis
- Jeśli wszystkie mają wartości → OK!

## Tymczasowe Obejście

Jeśli admin form nie działa, możesz tymczasowo ustawić PayU bezpośrednio w bazie poprzez SQL:

```sql
UPDATE settings
SET 
  payu_client_id = 'YOUR_CLIENT_ID',
  payu_client_secret = 'YOUR_CLIENT_SECRET',
  payu_merchant_pos_id = 'YOUR_POS_ID',
  payu_md5_key = 'YOUR_MD5_KEY',
  payu_notify_url = 'https://wlasniewski.pl/api/payu/notify',
  payu_environment = 'secure'  -- lub 'sandbox' do testów
WHERE id = 1;
```

## Następny Krok

1. Wykonaj Kroki 1-3 powyżej
2. Powiedz mi:
   - Czy wartości są w Request payload? (Krok 1)
   - Czy są w server logs? (Krok 2)
   - Czy się zapisują? (Krok 3)

Na podstawie odpowiedzi mogę dokładnie lokalizować problem.
