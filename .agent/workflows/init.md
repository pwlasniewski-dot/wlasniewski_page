---
description: Procedura inicjalizacji i zachowania ciągłości wiedzy projektowej (MUST READ)
---

// turbo-all

Poniższa procedura jest KRYTYCZNA dla zachowania stabilności projektu wlasniewski.pl i musi być wykonana na początku KAŻDEJ nowej sesji lub przy zmianie kontekstu zadania.

### 1. Synchronizacja ze Źródłem Prawdy
Przed wykonaniem jakiejkolwiek komendy lub edycji kodu, zapoznaj się z następującymi plikami:
1.  **PROJECT_HISTORIA.md**: Sprawdź ostatnie incydenty, "Holy Rules" oraz stan produkcji.
2.  **ARCHITECTURE.md**: Zapoznaj się z protokołami (Zero Loss, Zero Flower, Scope Isolation).
3.  **FUNCTIONAL_SPECIFICATION.md**: Zweryfikuj, jak dany moduł powinien działać według założeń.

### 2. Żelazna Zasada "Scope Isolation"
- ABSOLUTNY ZAKAZ edytowania plików/sekcji niezwiązanych bezpośrednio z zadaniem.
- ZAKAZ przesyłania całych plików (rewritów) dla złożonych komponentów. Zawsze używaj precyzyjnych chunków.
- Jeśli zadanie wymaga edycji `settings/page.tsx` lub `api/settings/route.ts` - zachowaj najwyższą ostrożność (podgląd `view_file` całego pliku przed edycją).

### 3. Protokół Bezpieczeństwa Builda
- Nigdy nie ingeruj w dane po buildzie (np. ręczne zmiany w skompilowanych plikach).
- Nie wykonuj `prisma db push` na produkcji.
- Zmiany w bazie danych raportuj i wykonuj tylko przez `prisma migrate` lub zweryfikowane skrypty naprawcze.

### 4. Reakcja na błędy
Każdy błąd/regresja musi zostać natychmiast odnotowany w `PROJECT_HISTORIA.md` w sekcji "Log Zmian" z dopiskiem [AGENT ERROR] lub [INCIDENT] wraz z nową zasadą zapobiegawczą.
