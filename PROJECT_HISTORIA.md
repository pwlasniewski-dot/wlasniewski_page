# Historia Zmian Projektu - wlasniewski.pl

Ten plik służy do ścisłego monitorowania wszystkich zmian wprowadzanych w projekcie, aby uniknąć regresji i utraty danych.

## Zasady Bezpieczeństwa (Safety Protocol)
1. **Weryfikacja przed zmianą**: Zawsze sprawdź stan bazy danych (np. `prisma studio` lub skrypty auditowe) oraz stan strony `wlasniewski.pl` przed edycją kodu.
2. **Zakaz niszczenia danych**: Nigdy nie używaj `db push --force-reset` ani podobnych destrukcyjnych komend na środowisku produkcyjnym.
3. **Migracje zamiast push**: Stosuj `prisma migrate` dla zmian w schemacie.
4. **Logowanie**: Każda zmiana strukturalna musi być tutaj odnotowana z uzasadnieniem.

---

## Log Zmian

### [2025-12-18]#### Faza 2: Rozbudowa (Analytics, Scrum, Dron) [DONE]
- Implementacja Dashboardu Analitycznego z sugerowaniem działań AI.
- Wprowadzenie tablicy Kanban (Scrum) do zarządzania operacjami.
- Pełna integracja strony `/dron` z Page Builderem i nowym modułem Thermal Slider.
- Optymalizacja SEO pod region Kujawsko-Pomorski i kwalifikacje techniczne (NSTS 01, ITC Level 1).
- Wprowadzenie miar rentowności (Revenue Density) dla usług B2B i B2C.
- **Działania**:
    - Dodanie nowych modeli do `prisma/schema.prisma` (BusinessGoal, Task, MarketingAction, DroneOrder, AnalyticsSnapshot).
    - Rozpoczęcie prac nad API dla analityki.
- **Status**: W trakcie realizacji (Execution).

### [2026-01-15] Faza 3: Dron & BI
- **Zadanie**: Rozbudowa funkcjonalności dronowych oraz implementacja zaawansowanych narzędzi Business Intelligence.
- **Działania**:
    - Integracja z zewnętrznymi API pogodowymi dla optymalizacji lotów dronowych.
    - Rozwój modułu do automatycznego generowania raportów z inspekcji termowizyjnych.
    - Wdrożenie narzędzi BI do analizy danych sprzedażowych i operacyjnych.
- **Status**: Planowanie (Planning).
