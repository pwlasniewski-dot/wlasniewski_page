# MySQL Setup Guide - Cyberfolks DirectAdmin

## Krok 1: Utworzenie Bazy Danych

1. **Zaloguj się do DirectAdmin:**
   - URL: https://22505.myadmin.tld.pl
   - Twoje dane logowania

2. **Utwórz nową bazę danych:**
   - Kliknij **"MySQL Management"** lub **"Bazy danych"**
   - Przycisk **"Create new Database"**
   
3. **Wypełnij formularz:**
   ```
   Database Name: wlasniewski_admin
   Database User: wlasniewski_user  
   Password: [wygeneruj silne hasło - min 16 znaków]
   ```
   
4. **Zapisz dane połączenia:**
   ```
   Host: localhost
   Port: 3306
   Database: wlasniewski_admin
   User: wlasniewski_user
   Password: [twoje hasło]
   ```

---

## Krok 2: Utworzenie Pliku .env.local

W głównym katalogu projektu utwórz plik `.env.local`:

```env
# MySQL Database Connection
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=wlasniewski_admin
DB_USER=wlasniewski_user
DB_PASSWORD=your_password_from_step1_here

# JWT Secret (dla autentykacji admina)
# Wygeneruj losowy string min 32 znaki: https://generate-secret.vercel.app/32
JWT_SECRET=wygeneruj_losowy_secret_tutaj_min_32_znaki

# Admin Account (pierwsze logowanie)
ADMIN_EMAIL=przemek@wlasniewski.pl
ADMIN_PASSWORD=change_this_on_first_login
```

**UWAGA:** `.env.local` już jest w `.gitignore` - nie zostanie wysłany do repozytorium!

---

## Krok 3: Uruchomienie Migracji SQL

1. **Otwórz phpMyAdmin:**
   - W DirectAdmin → **"phpMyAdmin"**
   
2. **Wybierz bazę:**
   - Z lewej strony kliknij **"wlasniewski_admin"**
   
3. **Zakładka SQL:**
   - Kliknij zakładkę **"SQL"**
   
4. **Wklej skrypt migracji:**
   - Skopiuj załączony plik `migration.sql`
   - Wklej do pola tekstowego
   - Kliknij **"Wykonaj"** / **"Go"**

---

## Krok 4: Weryfikacja

Po wykonaniu migracji powinieneś zobaczyć 10 tabel:
- ✅ admin_users
- ✅ settings
- ✅ media_library
- ✅ portfolio_sessions
- ✅ blog_posts
- ✅ testimonials
- ✅ promo_codes
- ✅ inquiries
- ✅ email_subscribers
- ✅ analytics_events

---

## Krok 5: Test Połączenia

Uruchom polecenie w terminalu projektu:
```bash
npm run dev
```

Jeśli wszystko OK, aplikacja połączy się z bazą danych i utworzy pierwszego użytkownika admina.

---

## Troubleshooting

### Błąd: "Unable to connect to database"
- Sprawdź czy dane w `.env.local` są poprawne
- Sprawdź czy baza została utworzona w DirectAdmin
- Sprawdź czy użytkownik ma uprawnienia do bazy

### Błąd: "Table doesn't exist"
- Uruchom ponownie migrację SQL w phpMyAdmin
- Sprawdź czy wszystkie tabele zostały utworzone

---

**Gotowy? Daj znak gdy stworzysz bazę i plik .env.local!** 🚀
