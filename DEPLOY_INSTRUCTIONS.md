# Instrukcja Wdrożenia na Cyberfolks (Finalna)

Twój projekt używa architektury hybrydowej:
- **Frontend:** Statyczny HTML/JS (Next.js Export)
- **Backend:** Skrypty PHP (API) + Baza MySQL

## 1. Przygotowanie Bazy Danych (Jeśli jeszcze nie zrobione)

1. Zaloguj się do DirectAdmin na Cyberfolks.
2. Wejdź w **phpMyAdmin**.
3. Wybierz swoją bazę danych (`baza22505_4558816`).
4. Kliknij zakładkę **Import**.
5. Wybierz plik `database/migration.sql` z folderu projektu i kliknij **Wykonaj**.
   *To utworzy wszystkie potrzebne tabele (admin_users, settings, blog_posts, portfolio_sessions, media_library).*

## 2. Budowanie Projektu

W terminalu (VS Code) uruchom:
```bash
npm run build
```
To wygeneruje folder `out`, który zawiera gotową stronę.

## 3. Wgrywanie na Serwer (FTP)

1. Połącz się z serwerem (FileZilla / WinSCP).
2. Wejdź do katalogu `public_html` (lub `domains/wlasniewski.pl/public_html`).
3. **Wyczyść** ten katalog (usuń stare pliki, jeśli są).
4. **Wgraj całą zawartość folderu `out`** do `public_html`.

Struktura na serwerze powinna wyglądać tak:
```
public_html/
  ├── _next/
  ├── admin/
  ├── api/          <-- TU SĄ SKRYPTY PHP (login.php, blog.php, media.php, itd.)
  ├── index.html
  ├── .htaccess     <-- WAŻNE! (Instrukcja poniżej)
  └── ...
```

## 4. Konfiguracja .htaccess (Kluczowe!)

Aby działało odświeżanie stron (np. jak wejdziesz bezpośrednio na `/admin/blog`), musisz mieć plik `.htaccess`.
Jeśli nie ma go w folderze `out` (Next.js go nie generuje), utwórz go ręcznie w `public_html`:

**Treść pliku .htaccess:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

## 5. Konfiguracja Bazy Danych w PHP

Upewnij się, że plik `public_html/api/db.php` ma poprawne dane do Twojej bazy na Cyberfolks:
*(Powinny być już ustawione w kodzie, ale warto sprawdzić)*

```php
$host = "localhost";
$db_name = "baza22505_4558816";
$username = "baza22505_4558816";
$password = "Kie@!st78ar?X";
```

## 6. Testowanie

1. Wejdź na `https://wlasniewski.pl/admin/login`
2. Zaloguj się (Email: `admin22505_4558816`, Hasło: `Kie@!st78ar?X`).
   *(Jeśli to pierwsze logowanie, konto zostanie utworzone automatycznie)*.
3. Sprawdź zakładki: Media, Blog, Portfolio, Socjotechniki.

**Gotowe! Twoja strona jest w pełni funkcjonalna na hostingu Cyberfolks.** 🚀
