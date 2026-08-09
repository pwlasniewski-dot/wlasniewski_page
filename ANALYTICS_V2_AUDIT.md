# Analytics 2.0 — audyt, decyzje i kryteria odbioru

## Decyzja

Dotychczasowy panel analityczny nie jest źródłem danych wystarczająco wiarygodnym do decyzji biznesowych. Analytics 2.0 traktuje stare zdarzenia jako legacy i nie miesza ich z nowym pomiarem.

## Potwierdzone problemy starego systemu

1. Produkcyjny tracker używany przez `src/app/layout.tsx` przechowywał `analytics_session_id` w `localStorage` bez mechanizmu wygaśnięcia sesji. Ta sama sesja mogła trwać przez wiele niezależnych wizyt użytkownika.
2. Stary dashboard generował część wartości przy użyciu `Math.random()`:
   - zmianę udziału źródeł ruchu,
   - średni czas na stronie.
   Takie liczby nie mogą być używane do analizy biznesowej.
3. W repozytorium istniały dwa różne mechanizmy trackingu (`src/hooks/useAnalytics.ts` i `src/lib/analytics-tracker.ts`), co utrudniało ustalenie, który model danych jest faktycznie źródłem prawdy.
4. Stary endpoint `/api/analytics/track` rozpakowywał pola zachowania (`time_on_page`, `scroll_depth`, dane kliknięcia itd.) do `otherData`, ale ich nie zapisywał w tabeli `AnalyticsEvent`.
5. Stary dashboard mieszał dane o zachowaniu, rezerwacjach, gift cardach, wyzwaniach i elementach typu „CEO Dashboard”, zamiast odpowiadać na podstawowe pytania o ruch, źródła i konwersję.

## Analytics 2.0 — model danych

Nowe zdarzenia mają prefiks `v2_`. Dashboard V2 pobiera wyłącznie takie rekordy, więc dane historyczne legacy nie wpływają na nowe statystyki.

### Użytkownik

Anonimowy `user_id` jest trwały dla danej przeglądarki.

### Sesja

`session_id` jest odnawiany po 30 minutach bezczynności. Sesja zapisuje:

- moment rozpoczęcia,
- moment ostatniej aktywności,
- landing page,
- referrer,
- UTM source / medium / campaign,
- sklasyfikowane źródło ruchu.

### Aktywny czas

Aktywny czas jest liczony heartbeatami co 15 sekund wyłącznie wtedy, gdy:

- karta jest widoczna,
- użytkownik wykazał aktywność w ostatnich 60 sekundach.

Dzięki temu otwarta, ale porzucona karta nie jest automatycznie liczona jako aktywna sesja.

### Zdarzenia podstawowe

- `v2_session_start`
- `v2_page_view`
- `v2_engagement`
- `v2_click`
- `v2_form_start`
- `v2_form_submit`
- `v2_visibility_hidden`
- `v2_visibility_visible`
- `v2_page_exit`

Dodatkowe zdarzenia sprzedażowe mogą być emitowane przez `useAnalytics().trackEvent(...)`; są automatycznie zapisywane jako `v2_*`.

## Nowy panel

Panel `/admin/analytics` korzysta z endpointu `/api/analytics/v2/dashboard` i obsługuje:

- ostatnią godzinę,
- dzisiaj,
- wczoraj,
- 7 dni,
- 30 dni,
- własny zakres czasu,
- agregację godzinową,
- agregację dzienną,
- agregację tygodniową,
- porównanie z poprzednim okresem o tej samej długości,
- źródła ruchu liczone per sesja,
- strony i aktywny czas,
- listę ostatnich sesji,
- ścieżkę zdarzeń pojedynczej sesji.

## Źródła prawdy

- zachowanie użytkowników: `AnalyticsEvent` z `event_type` rozpoczynającym się od `v2_`,
- rezerwacje: tabela `Booking`,
- wartość rezerwacji: suma `Booking.price` w wybranym okresie.

**Uwaga:** suma `Booking.price` oznacza wartość utworzonych rezerwacji, a nie jednoznacznie zaksięgowany przychód. Do metryki „faktyczny przychód” wymagane jest osobne, jednoznaczne powiązanie ze statusem płatności PayU / wpłatą zaliczki i dopłaty.

## Kryteria odbioru przed scaleniem

- brak `Math.random()` i innych wartości syntetycznych w dashboardzie,
- stare zdarzenia nie są uwzględniane w Analytics 2.0,
- sesja odnawia się po 30 minutach bezczynności,
- SPA page view rejestruje zmianę `pathname` / query,
- panel filtruje po dokładnym zakresie czasu,
- grupowanie działa dla godziny / dnia / tygodnia,
- aktywny czas nie rośnie przy niewidocznej / nieaktywnej karcie,
- urządzenie administratora może być wykluczone,
- endpoint dashboardu wymaga autoryzacji,
- endpoint trackingu odrzuca boty, admin IP i `/admin`,
- terminologia finansowa nie sugeruje „przychodu”, jeśli dane oznaczają wyłącznie wartość utworzonej rezerwacji.

## Kolejny etap

Po zebraniu pierwszych danych V2 należy porównać liczbę sesji i pageview z GA4 / Clarity przez wspólny okres kontrolny. Dopiero po takim porównaniu legacy analytics można usunąć z repozytorium.
