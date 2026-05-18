# Wdrożenie systemu wymuszania resetu hasła - INSTRUKCJA

## ⚠️ WAŻNE: Wykonaj w kolejności!

### Krok 1: Uruchom migrację bazy danych
```bash
mysql -u [user] -p [database] < database/migration_password_reset_required.sql
```

### Krok 2: Wdróż nowy kod na produkcję
```bash
# Jeśli używasz Netlify/Vercel → już wdrożone przez git push
# Jeśli manualne wdrożenie:
npm install
npm run build
pm2 restart all
```

### Krok 3: Ustaw flagę dla użytkowników, którym zresetowałeś hasła

#### Opcja A: Dla wszystkich klientów
```bash
npx ts-node scripts/force-password-reset.ts
```

#### Opcja B: Dla konkretnych użytkowników (np. tylko Pani Kierys)
```bash
npx ts-node scripts/force-password-reset.ts --emails="kierys@example.com,inny@email.pl"
```

### Krok 4: (Opcjonalne) Wyślij email do klientów
Stwórz wiadomość wyjaśniającą sytuację:

**Temat**: Wymagany reset hasła - ważne informacje bezpieczeństwa

**Treść**:
```
Witaj,

Z powodu incydentu bezpieczeństwa dotyczącego naszego serwera SMTP, 
zresetowaliśmy wszystkie hasła klientów jako środek ostrożności.

Przy następnym logowaniu zobaczysz komunikat o wygasłym haśle.
Kliknij przycisk "Resetuj hasło", aby ustawić nowe hasło.

Przepraszamy za niedogodności.
```

### Weryfikacja
Po wdrożeniu sprawdź:
1. Zaloguj się jako użytkownik z flagą → powinieneś zobaczyć amber alert
2. Kliknij "Resetuj hasło" → email powinien być auto-wypełniony
3. Zresetuj hasło → flaga powinna być wyczyszczona automatycznie
4. Zaloguj się ponownie → sukces

## Troubleshooting

### Problem: "Column not found: password_reset_required"
**Rozwiązanie**: Migracja nie została uruchomiona. Wykonaj Krok 1.

### Problem: Email nie jest auto-wypełniany
**Rozwiązanie**: Upewnij się, że kod został wdrożony (git pull + restart).

### Problem: Po resecie hasła wciąż widać alert
**Rozwiązanie**: Sprawdź logi `/api/auth/reset-password` - może być błąd w zapisie do bazy.
