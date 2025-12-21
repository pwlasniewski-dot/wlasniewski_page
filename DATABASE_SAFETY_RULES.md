# 🚨 ZASADY BEZPIECZEŃSTWA BAZY DANYCH (DATABASE SAFETY RULES)

**Ten dokument został stworzony w odpowiedzi na Incydent z 21.12.2025 (Wyczyszczenie Bazy Danych).**
**Przeczytaj go UWAŻNIE, aby nigdy nie powtórzyć tego błędu.**

---

## 🛑 CZEGO NIGDY NIE ROBIĆ (ABSOLUTE PROHIBITION)

### 1. ❌ NIE używaj `prisma db push` na produkcji
To komenda DESTRUKCYJNA. Jeśli schemat lokalny różni się od produkcji, `db push` może zapytać o reset (wyczyszczenie bazy). Jeśli przypadkiem klikniesz "Yes" lub użyjesz flagi `--accept-data-loss`, **wszystkie dane zostaną skasowane w milisekundę.**

**Dlaczego to jest groźne?**
- `db push` synchronizuje *stan bazy* ze *schematem*.
- Nie dba o zachowanie danych, jeśli napotka konflikt.
- Jest przeznaczona do prototypowania (lokalnie), NIE do produkcji.

### 2. ❌ NIE używaj flagi `--force-reset`
Komenda `prisma convert`, `prisma db push` i inne mają flagę `--force`. Nigdy jej nie używaj, chyba że jesteś na bazie lokalnej (SQLite) i chcesz zacząć od zera.

### 3. ❌ NIE używaj `git push --force`
Nadpisywanie historii Gita może ukryć błędy i utrudnić przywrócenie kodu do działającej wersji.

### 4. ❌ NIE testuj zmian bezpośrednio na produkcji
"Szybki fix" na produkcji to najkrótsza droga do katastrofy. Zmiany testuj lokalnie (`npm run dev`).

---

## ✅ CO NALEŻY ROBIĆ (SAFE PROCEDURES)

### 1. Migracje (`prisma migrate`)
Zamiast `db push`, używaj systemu migracji.

**Workflow:**
1. Zmień `schema.prisma`.
2. Stwórz migrację: `npx prisma migrate dev --name nazwa_zmiany` (to tworzy plik SQL).
3. Sprawdź plik SQL (czy nie ma `DROP TABLE`?).
4. Na produkcji użyj: `npx prisma migrate deploy` (to wykonuje zatwierdzony plik SQL).

### 2. Backup przed każdą zmianą
Zanim zrobisz cokolwiek z bazą:
1. Wejdź w panel Neon/Vercel/Hosting.
2. Pobierz dump SQL bazy danych.
3. Lub użyj `prisma studio` w ostateczności żeby wyeksportować JSON.

### 3. Connection String Safety
Upewnij się, że lokalnie łączysz się do `dev.db` (SQLite) lub innej bazy testowej, a nie do produkcji. Sprawdź plik `.env` trzy razy.

---

## 📜 SKRÓT DLA OPORNYCH

| Komenda | Gdzie można używać? | Co robi? | Bezpieczna? |
|---------|---------------------|----------|-------------|
| `npx prisma db push` | TYLKO LOCAL (Dev) | Synchronizuje schema (może usunąć dane) | ❌ NIE BEZPIECZNA |
| `npx prisma migrate dev` | TYLKO LOCAL (Dev) | Tworzy plik migracji SQL | ✅ BEZPIECZNA |
| `npx prisma migrate deploy` | PRODUKCJA & LOCAL | Wykonuje SQL na bazie | ✅ BEZPIECZNA |
| `npx prisma studio` | WSZĘDZIE | Panel GUI do danych | ✅ BEZPIECZNA |
| `npm run build` | WSZĘDZIE | Buduje aplikację | ✅ BEZPIECZNA |

**Zapamiętaj:**
Baza danych to serce firmy. Kod można odzyskać z Gita. Utraconych danych klientów często nie da się odzyskać.

---
*Podpisano: Antygravity & Zespół Developerski*
