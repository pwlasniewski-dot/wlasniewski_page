# System Wyboru Zdjęć dla Galerii Grupowych

## Przeznaczenie
System do zarządzania galeriami grupowymi (np. komunia, sesja klasowa), gdzie każdy uczestnik może:
- **Pobrać wszystkie** zdjęcia ze swojej galerii
- **Zaznaczyć max X zdjęć** (domyślnie 5) do wydruku
- **Wyrazić zgodę na publikację** wybranych zdjęć

## Przykład użycia
**Scenariusz**: Komunia św. dla 60 dzieci w klasie Pani Kierys
- Admin tworzy 1 galerię "Klasa B - Toruń"
- Admin dodaje 60 uczestników (każde dziecko dostaje unikalny kod)
- Rodzice logują się swoim kodem → widzą zdjęcia swojego dziecka
- Rodzice zaznaczają 5 zdjęć → fotograf je wywoła
- Rodzice wyrażają zgodę na publikację

---

## 1. Modele bazy danych

### `GalleryParticipant`
Uczestnik galerii grupowej (np. dziecko w komunii)

| Pole | Typ | Opis |
|------|-----|------|
| `id` | Int | ID uczestnika |
| `gallery_id` | Int | Galeria, do której należy |
| `participant_code` | String (unique) | **Unikalny kod dostępu** (8 znaków, np. `A3F7B2E9`) |
| `name` | String | Nazwa uczestnika (np. "Jan Kowalski", "Dziecko 1") |
| `max_selections` | Int | Limit zdjęć do wyboru (domyślnie 5) |
| `publication_consent` | Boolean | Czy wyraził zgodę na publikację |
| `consent_given_at` | DateTime? | Kiedy wyraził zgodę |
| `notes` | String? | Notatki admina |

### `PhotoSelection`
Wybór zdjęcia przez uczestnika

| Pole | Typ | Opis |
|------|-----|------|
| `id` | Int | ID wyboru |
| `participant_id` | Int | Uczestnik, który wybrał |
| `photo_id` | Int | Wybrane zdjęcie |
| `selected_at` | DateTime | Kiedy zaznaczono |

**Unique constraint**: `(participant_id, photo_id)` - uczestnik nie może zaznaczyć tego samego zdjęcia 2x

---

## 2. API Endpoints

### Dla rodziców (publiczne)

#### `POST /api/galleries/participant/auth`
Weryfikacja kodu dostępu
```json
{
  "code": "A3F7B2E9"
}
```

#### `GET /api/galleries/participant/[code]/photos`
Pobierz wszystkie zdjęcia uczestnika

#### `POST /api/galleries/participant/[code]/select`
Zaznacz/odznacz zdjęcie
```json
{
  "photo_id": 123,
  "action": "select" // lub "deselect"
}
```

#### `POST /api/galleries/participant/[code]/consent`
Wyraź zgodę na publikację
```json
{
  "consent": true
}
```

### Dla admina

#### `GET /api/admin/galleries/[id]/participants`
Pobierz wszystkich uczestników galerii

#### `POST /api/admin/galleries/[id]/participants`
Dodaj nowego uczestnika
```json
{
  "name": "Jan Kowalski",
  "max_selections": 5,
  "notes": "Rodzic: 123-456-789"
}
```

#### `POST /api/admin/galleries/[id]/participants/bulk`
Dodaj wielu uczestników naraz
```json
{
  "count": 60,
  "name_prefix": "Dziecko",
  "max_selections": 5
}
```
Stworzy: "Dziecko 1", "Dziecko 2", ..., "Dziecko 60" z unikalnymi kodami

#### `PATCH /api/admin/galleries/[id]/participants/[participantId]`
Edytuj uczestnika

#### `DELETE /api/admin/galleries/[id]/participants/[participantId]`
Usuń uczestnika

#### `GET /api/admin/galleries/[id]/selections-summary`
Pobierz podsumowanie wyborów wszystkich uczestników

---

## 3. Frontend

### Dla rodziców
**URL**: `/galeria/wybor-zdjec`

**Funkcje**:
- Logowanie kodem dostępu (8-znakowy kod)
- Siatka zdjęć z możliwością:
  - Kliknięcia serduszka 💛 = zaznaczenie do wydruku
  - Pobrania zdjęcia (przycisk download)
- Licznik wybranych zdjęć (X / Y)
- Modal zgody na publikację (po wyborze wszystkich zdjęć)
- Potwierdzenie wysłania zgody

### Dla admina
**Integracja z GalleryAdmin.tsx** (do zaimplementowania):
- Zakładka "Uczestnicy" w panelu galerii
- Przycisk "Dodaj uczestników grupowo" (60 naraz)
- Lista uczestników z:
  - Nazwa
  - Kod dostępu (można skopiować)
  - Postęp wyboru (3/5)
  - Status zgody (✅ / ❌)
- Widok podsumowania:
  - Statystyki (ile osób wybrało, ile wyraziło zgodę)
  - Podgląd wyborów każdego uczestnika
  - Eksport listy wyborów do CSV

---

## 4. Workflow wdrożenia

### Krok 1: Migracja bazy danych
```bash
npx prisma db execute --file=database/migration_gallery_participants.sql
npx prisma generate
```

### Krok 2: Testowanie API
```bash
# Test auth endpoint
curl -X POST http://localhost:3000/api/galleries/participant/auth \
  -H "Content-Type: application/json" \
  -d '{"code":"A3F7B2E9"}'
```

### Krok 3: Dodanie uczestników (przykład)
W panelu admin → Galerie → [wybierz galerię] → **POST** do `/api/admin/galleries/9/participants/bulk`:
```json
{
  "count": 21,
  "name_prefix": "Klasa B - Dziecko",
  "max_selections": 5
}
```

### Krok 4: Udostępnienie kodów rodzicom
Admin pobiera listę kodów dostępu i wysyła je rodzicom (np. mailem lub wydrukiem).

### Krok 5: Rodzice wybierają zdjęcia
Rodzice wchodzą na `/galeria/wybor-zdjec`, logują się kodem i wybierają 5 zdjęć.

### Krok 6: Admin sprawdza wybory
Admin wchodzi do widoku podsumowania i widzi kto co wybrał.

---

## 5. Bezpieczeństwo

- **Kody dostępu**: 8-znakowe hex (16^8 = 4.3 miliarda kombinacji) - praktycznie niemożliwe do odgadnięcia
- **Brak logowania**: Rodzice nie potrzebują hasła, tylko kod dostępu (prosty UX)
- **Walidacja**: API sprawdza czy galeria jest aktywna i nie wygasła
- **Rate limiting**: Można dodać throttling na endpoint auth (np. max 5 prób/minutę)

---

## 6. Rozszerzenia (przyszłość)

### Email notifications
Wysyłanie automatycznych maili do rodziców z kodem dostępu:
```
Temat: Twoje zdjęcia z komunii - Kod dostępu
Treść: Twój kod dostępu: A3F7B2E9
Link: https://wlasniewski.pl/galeria/wybor-zdjec
```

### SMS notifications
Integracja z Twilio/SMSapi do wysyłki kodów SMS.

### QR codes
Generowanie kodów QR dla każdego uczestnika (rodzic skanuje → automatyczne logowanie).

### Bulk export
Przycisk "Eksportuj wybory do CSV" z listą:
```csv
Uczestnik,Kod,Zdjęcia wybrane,Zgoda na publikację
Jan Kowalski,A3F7B2E9,"photo_123.jpg, photo_456.jpg, ...",TAK
```

### Print queue
Automatyczne generowanie listy zdjęć do wydruku dla laboratorium.

---

## Historia
- **2026-05-18**: Implementacja systemu wyboru zdjęć dla galerii grupowych (komunia, sesje klasowe)
