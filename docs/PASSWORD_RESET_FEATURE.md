# Password Reset Required Feature

## Cel
System wymuszania resetu hasła po incydentach bezpieczeństwa (np. wyciek danych SMTP).

## Komponenty

### 1. Baza danych
- **Pole**: `users.password_reset_required` (Boolean, default: false)
- **Migracja**: `database/migration_password_reset_required.sql`

### 2. Backend (API)
- **Login endpoint** (`/api/auth/login`): Sprawdza flagę i blokuje logowanie z kodem `403` i komunikatem `PASSWORD_RESET_REQUIRED`
- **Reset password endpoint** (`/api/auth/reset-password`): Automatycznie czyści flagę po udanym resecie hasła

### 3. Frontend
- **Strona logowania** (`/logowanie`): 
  - Wykrywa status `PASSWORD_RESET_REQUIRED`
  - Wyświetla pomarańczowy alert z przyciskiem "Resetuj hasło"
  - Przekazuje email do strony resetowania via query param

- **Strona reset hasła** (`/logowanie/przypomnij-haslo`):
  - Auto-wypełnia email z query params
  - Standardowy flow resetu hasła

## Użycie

### Po incydencie bezpieczeństwa

#### Opcja 1: Ręczna migracja SQL (dla wszystkich klientów)
```sql
UPDATE `users` 
SET `password_reset_required` = TRUE 
WHERE `role` = 'CLIENT';
```

#### Opcja 2: Skrypt TypeScript (elastyczny)
```bash
# Dla wszystkich klientów
npx ts-node scripts/force-password-reset.ts

# Dla konkretnych użytkowników
npx ts-node scripts/force-password-reset.ts --emails="user1@example.com,user2@example.com"
```

### Co zobaczy klient?
1. Próba logowania → błąd 403 z komunikatem "Hasło wygasło"
2. Pomarańczowy alert z wyjaśnieniem i przyciskiem "Resetuj hasło"
3. Przekierowanie do strony resetu hasła (email auto-wypełniony)
4. Po resecie hasła → flaga automatycznie wyczyszczona, logowanie działa

## Logi systemu
- `LOGIN_BLOCKED_PASSWORD_RESET_REQUIRED` - próba logowania z wygasłym hasłem
- Wszystkie logi w tabeli `system_logs` z kontekstem (IP, user agent, userId)

## Testowanie
1. Ustaw flagę dla testowego użytkownika:
   ```sql
   UPDATE users SET password_reset_required = TRUE WHERE email = 'test@example.com';
   ```

2. Spróbuj się zalogować → powinien pojawić się alert o wygasłym haśle

3. Zresetuj hasło → flaga powinna zostać wyczyszczona automatycznie

## Historia
- **2026-05-18**: Implementacja po ataku na SMTP (Pani Kierys nie mogła się zalogować po ręcznym resecie haseł)
