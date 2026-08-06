# Galeria klienta indywidualnego — pobieranie JPG i film z imprezy

## Priorytet krytyczny: pobieranie pełnej galerii

### Błąd obecny

Endpoint `GET /api/galleries/[accessCode]/download-all` pobierał `photo.file_url`, czyli źródło podglądowe, ładował cały plik do pamięci, konwertował go do JPG przez `sharp().toBuffer()` i dopiero dokładał do archiwum. Przy dużej liczbie zdjęć powodowało to:

- długi czas wykonywania funkcji,
- narastające użycie pamięci,
- ryzyko przerwania odpowiedzi ZIP,
- ZIP widoczny jako utworzony, ale niekompletny albo niemożliwy do pobrania,
- używanie WebP/podglądu zamiast właściwego pliku do pobrania.

### Wprowadzona poprawka

- źródło pobrania: `download_source_url`, a dopiero awaryjnie `file_url`,
- wynik dla klienta zawsze ma rozszerzenie `.jpg`,
- istniejący JPG jest przesyłany strumieniowo bez ponownej kompresji,
- WebP/PNG jest konwertowany strumieniowo do JPG jakości 92,
- usunięto `arrayBuffer()` i `toBuffer()` z głównego przepływu,
- zdjęcia są przetwarzane kolejno, aby ograniczyć pamięć,
- ZIP64 pozostaje włączony dla dużych archiwów,
- dodano bezpieczną nazwę pliku ZIP,
- błędny pojedynczy plik nie przerywa całej paczki,
- jeśli żadne źródło nie zadziała, ZIP zawiera plik tekstowy z informacją o błędzie.

### Warunki odbioru

1. Galeria 10, 50, 100 i 300 zdjęć tworzy możliwy do rozpakowania ZIP.
2. Wszystkie pliki wewnątrz mają format i rozszerzenie JPG.
3. Źródłem jest pełna jakość z `download_source_url`, jeżeli została zmapowana.
4. Rozmiar i wymiary pobranego JPG odpowiadają źródłu wysokiej jakości.
5. Uszkodzony pojedynczy URL nie blokuje pozostałych zdjęć.
6. Test wykonać na Safari iOS, Chrome desktop i Safari macOS.

## Film z imprezy w panelu klienta

### Zakres

Do galerii należy dodać opcjonalną sekcję filmu YouTube zarządzaną z panelu administratora.

### Dane

Do `ClientGallery`:

- `event_video_url String?`
- `event_video_title String?`
- `event_video_description String?`
- `event_video_enabled Boolean @default(false)`

### Panel administratora

W edycji galerii:

- przełącznik „Pokaż film klientowi”,
- pole adresu YouTube,
- pole tytułu,
- pole krótkiego opisu,
- podgląd filmu,
- walidacja wyłącznie domen `youtube.com` i `youtu.be`,
- zapis wyłącznie identyfikatora filmu lub znormalizowanego URL.

### Panel klienta

Sekcja powinna pojawić się pod hero galerii i przed zdjęciami:

- nagłówek „Film z Twojej imprezy” lub tytuł administratora,
- responsywny odtwarzacz 16:9,
- `youtube-nocookie.com/embed/{videoId}`,
- `loading="lazy"`,
- pełny ekran,
- brak renderowania sekcji, gdy film jest wyłączony albo URL jest błędny,
- link awaryjny „Otwórz film w YouTube”.

### Bezpieczeństwo

- nie zapisywać dowolnego kodu iframe,
- nie przyjmować HTML od administratora,
- parsować identyfikator filmu po stronie serwera,
- generować iframe wyłącznie z zaufanej domeny `youtube-nocookie.com`,
- uwzględnić domenę w CSP `frame-src`.

### Kryteria odbioru

1. Administrator zapisuje link zwykły, skrócony i link `youtu.be`.
2. Klient widzi poprawny film na telefonie i komputerze.
3. Film nie rozpycha ekranu i nie powoduje poziomego przewijania.
4. Niepoprawny URL nie tworzy iframe.
5. Galeria bez filmu działa bez zmian.
