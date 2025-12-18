# Historia Zmian Projektu - wlasniewski.pl

Ten plik służy do ścisłego monitorowania wszystkich zmian wprowadzanych w projekcie, aby uniknąć regresji i utraty danych.

## Zasady Bezpieczeństwa (Safety Protocol)
1. **Weryfikacja przed zmianą**: Zawsze sprawdź stan bazy danych (np. `prisma studio` lub skrypty auditowe) oraz stan strony `wlasniewski.pl` przed edycją kodu.
2. **Zakaz niszczenia danych**: Nigdy nie używaj `db push --force-reset` ani podobnych destrukcyjnych komend na środowisku produkcyjnym.
3. **Migracje zamiast push**: Stosuj `prisma migrate` dla zmian w schemacie.
4. **Logowanie**: Każda zmiana strukturalna musi być tutaj odnotowana z uzasadnieniem.

---

## Log Zmian

### [2025-12-18] Faza 2: Rozbudowa (Analityka & Drony)
- **Zadanie**: Implementacja dashboardu analitycznego, tablicy Scrum oraz strony usług dronowych/termowizyjnych.
- **Działania**:
    - Dodanie nowych modeli do `prisma/schema.prisma` (BusinessGoal, Task, MarketingAction, DroneOrder, AnalyticsSnapshot).
    - Rozpoczęcie prac nad API dla analityki.
- **Status**: W trakcie realizacji (Execution).
