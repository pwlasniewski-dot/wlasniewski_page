# Analityka V3 i Google Search Console — konfiguracja Netlify

Analityka V3 działa bez danych syntetycznych. Gdy GSC nie jest skonfigurowane, panel pokazuje status `not_configured`; pozostała analityka nadal działa.

## 1. Service account Google

1. W Google Cloud utwórz service account i włącz **Google Search Console API**.
2. W GSC dodaj adres e-mail service account jako użytkownika z prawem odczytu do obu usług: `wlasniewski.pl` i `aeroanaliza.pl`.
3. Nie dodawaj pliku JSON do repozytorium.

## 2. Zmienne produkcyjne Netlify

Ustaw w kontekście Production:

```text
GSC_SERVICE_ACCOUNT_EMAIL=analytics-reader@project.iam.gserviceaccount.com
GSC_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GSC_SITE_URL_WLASNIEWSKI=sc-domain:wlasniewski.pl
GSC_SITE_URL_AEROANALIZA=sc-domain:aeroanaliza.pl
GSC_TIMEOUT_MS=8000
```

Akceptowane są wyłącznie właściwości domenowe lub adresy HTTPS z allowlisty `wlasniewski.pl` i `aeroanaliza.pl`. Konektor ma wyłącznie zakres `webmasters.readonly`. Sekret nie jest logowany ani zwracany przez API.

## 3. Odbiór

Po deployu otwórz `/admin/analytics`, wybierz 28 dni i sprawdź:

- status GSC `connected` i osobny status każdej domeny;
- datę ostatniego kompletnego dnia (dwa najnowsze dni są oznaczone jako niepełne);
- kliknięcia, wyświetlenia, CTR i pozycję w tabeli stron;
- porównanie z poprzednim równym okresem;
- zgodny status GSC w `/admin/seo`.

Konektor wykonuje dla każdej domeny trzy odczyty: wybrany okres, poprzedni równy okres i historię maksymalnie 16 miesięcy potrzebną wyłącznie do ustalenia najstarszej dostępnej obserwacji podstrony oraz bazowego trendu 28/28. Nie pobiera wymiaru zapytania ani treści wyszukiwanych fraz. Zakresy GSC są inclusive, są przeliczane z zakresów Analytics `[start, end)` bez nakładania dnia granicznego i obcinane do ostatniego kompletnego dnia GSC.

Rezerwacje kanoniczne nie są przypisywane do podstron, dopóki model rezerwacji nie przechowuje bezpiecznego identyfikatora sesji/landing page. Panel jawnie pokazuje to ograniczenie.

## Rejestr historii podstron

Migracja `20260812120000_page_analytics_registry` dodaje rejestr `(site_host, path)` z polami pierwszej publikacji i pierwszej obserwacji Analytics/GSC. Upsert zachowuje najstarsze daty i ich nie resetuje. Dla stron opublikowanych przed V3 `first_published_at` pozostaje `NULL` — system nie zgaduje daty na podstawie `updated_at`. Dla nowych stron CMS data jest ustawiana tylko przy utworzeniu jako opublikowana lub zmianie `false → true`.

Zdarzenia przyjęte po V3 dostają `site_host` wyprowadzony przez serwer z wcześniej zweryfikowanego nagłówka `Origin`. Wartość przesłana przez klienta jest odrzucana przez sanitizer i nadpisywana. Starsze zdarzenia bez tego pola mają domenę `unknown`: wchodzą do sum ogólnych, ale nie są przypisywane do `wlasniewski.pl` ani `aeroanaliza.pl`.
