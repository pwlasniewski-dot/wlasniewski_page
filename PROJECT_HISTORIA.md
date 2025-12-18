# Historia Zmian Projektu - wlasniewski.pl

Ten plik służy do ścisłego monitorowania wszystkich zmian wprowadzanych w projekcie, aby uniknąć regresji i utraty danych.

## Zasady Bezpieczeństwa (Safety Protocol)
1. **Weryfikacja przed zmianą**: Zawsze sprawdź stan bazy danych (np. `prisma studio` lub skrypty auditowe) oraz stan strony `wlasniewski.pl` przed edycją kodu.
2. **Zakaz niszczenia danych**: Nigdy nie używaj `db push --force-reset` ani podobnych destrukcyjnych komend na środowisku produkcyjnym.
3. **Migracje zamiast push**: Stosuj `prisma migrate` dla zmian w schemacie.
4. **Logowanie**: Każda zmiana strukturalna musi być tutaj odnotowana z uzasadnieniem.

---

## Log Zmian

### [2025-12-18] Inicjalizacja audytu i naprawy
- **Zadanie**: Naprawa flow maili, konsolidacja Admina, audyt utraconych danych, plan stabilizacji.
- **Działania**:
    - Usunięcie destrukcyjnych skryptów `db:clean` z `package.json`.
    - Rozpoczęcie konsolidacji logiki SMTP.
- **Status**: W trakcie realizacji.
