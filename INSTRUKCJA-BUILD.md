# INSTRUKCJA: Przeniesienie projektu i build

## Problem
OneDrive blokuje pliki Prisma podczas buildu, powodując błąd EPERM.

## Rozwiązanie

### OPCJA 1: Ręczne przeniesienie (ZALECANE)

```powershell
# 1. Utwórz folder na dysku C:\
mkdir C:\Strona-fotografa

# 2. Skopiuj projekt (BEZ node_modules, .next, .git)
robocopy "C:\Users\pwlas\OneDrive\Dokumenty\GitHub\Strona-fotografa\fotograf1" "C:\Strona-fotografa" /E /XD node_modules .next

# 3. Przejdź do nowego folderu
cd C:\Strona-fotografa

# 4. Zainstaluj zależności
npm install

# 5. Zrób build
npm run build
```

### OPCJA 2: Build z pominięciem seed (w OneDrive)

```powershell
cd "C:\Users\pwlas\OneDrive\Dokumenty\GitHub\Strona-fotografa\fotograf1"

# Zmień package.json build script tymczasowo:
# "build": "prisma generate && next build"

npm run build
```

### OPCJA 3: Poczekaj na Netlify

Netlify buduje się ze swojego własnego środowiska (bez OneDrive).
Ostatni commit `146282de` naprawił błąd importu - Netlify powinien zbudować się poprawnie.

**Sprawdź**: https://app.netlify.com/sites/[twoja-nazwa]/deploys

---

## Co zostało naprawione w ostatnim commicie:

```typescript
// PRZED (błąd):
import { withAuth } from '@/lib/withAuth';  // ❌ plik nie istnieje

// PO (poprawne):
import { withAuth } from '@/lib/auth/middleware';  // ✅
```

## Status ostatnich commitów:

- `146282de` - fix: Correct withAuth import path ✅
- `04d6bf16` - fix: Final menu_order conflict resolution ✅
- `0b5f1ff4` - feat: Add Error Notebook system ✅

Netlify powinien teraz zbudować się poprawnie!
