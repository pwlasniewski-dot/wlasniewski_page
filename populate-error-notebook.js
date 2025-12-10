const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateErrorNotebook() {
    console.log('📓 WYPEŁNIANIE NOTATNIKA BŁĘDÓW\n');
    console.log('═══════════════════════════════════════════════════════\n');

    const errors = [
        {
            title: 'Duplikat strony głównej w menu',
            category: 'DATABASE',
            severity: 'HIGH',
            description: `PROBLEM:
Znaleziono dwa wpisy dla strony głównej z menu_order=1:
- ID 147: slug="strona-glowna"  
- ID 153: slug="/" (poprzedni wpis)

DLACZEGO TO PROBLEM:
1. Konflikt kolejności - obie mają menu_order=1
2. Navbar może pokazywać duplikaty
3. Użytkownik widzi "Start" dwa razy w menu

ROZWIĄZANIE:
Strona główna powinna mieć is_in_menu=false (nie być w menu) 
i menu_order=0 ponieważ jest dostępna przez "/" automatycznie.`,
            sql_query: `-- Napraw stronę główną
UPDATE "pages" 
SET 
    "is_in_menu" = false,
    "menu_order" = 0
WHERE "slug" = 'strona-glowna';

-- Sprawdź duplikaty w menu
SELECT "id", "slug", "title", "menu_order", "is_in_menu"
FROM "pages"
WHERE "is_in_menu" = true
ORDER BY "menu_order";`,
            notes: '✅ ROZWIĄZANE: cleanup-database.js wykonał tę naprawę automatycznie'
        },
        {
            title: 'Stara tabela menu_items nadal zawiera dane',
            category: 'DATABASE',
            severity: 'MEDIUM',
            description: `PROBLEM:
Tabela menu_items zawierała 7 wpisów ze starego systemu menu:
- O mnie (page_id: 2)
- Rezerwacja (page_id: 4)
- Blog (page_id: 5)
- Foto Wyzwanie (page_id: 6)  
- Portfolio (page_id: 3)
- Jak się ubrać (page_id: NULL)
- Strona Główna (page_id: NULL)

DLACZEGO TO PROBLEM:
1. System został PRZEPROJEKTOWANY - menu teraz działa przez pages.is_in_menu
2. Stara tabela

 menu_items jest IGNOROWANA przez kod
3. API /api/menu czyta TYLKO z pages.is_in_menu
4. Powoduje to KONFUZJĘ - są dwa źródła prawdy o menu
5. "Martwy kod" w bazie - dane które nikt nie czyta

HISTORIA:
- Wcześniej: dedicowana tabela menu_items
- Teraz: uproszczone - pola w tabeli pages (is_in_menu, menu_title, menu_order)`,
            sql_query: `-- Usuń wszystkie stare wpisy menu (nie są używane)
DELETE FROM "menu_items";

-- Sprawdź czy tabela jest pusta
SELECT COUNT(*) FROM "menu_items";

-- Opcjonalnie: usuń całą tabelę (zalecane po migracji)
-- DROP TABLE "menu_items";`,
            notes: '✅ ROZWIĄZANE: cleanup-database.js wyczyścił tabelę - 7 wpisów usunięto'
        },
        {
            title: 'Strona główna miała pusty slug',
            category: 'DATABASE',
            severity: 'CRITICAL',
            description: `PROBLEM:
Strona główna (ID 147) miała pusty slug slug="" zamiast "strona-glowna"

KONSEKWENCJE:
1. Strona główna była NIEOSIĄGALNA przez routing
2. API /api/pages?slug=strona-glowna zwracało błąd 404
3. Homepage nie ładował się przez "/"
4. Navbar component nie mógł znaleźć strony głównej

PRZYCZYNA:
Prawdopodobnie błąd podczas edycji lub migracji danych.
Slug został przypadkowo wyczyszczony lub nie został ustawiony.

JAK TO WYKRYTO:
Analiza bazy wykazała: ID 147: slug="", title="Strona Główna"`,
            sql_query: `-- Napraw pusty slug na stronie głównej
UPDATE "pages"
SET 
    "slug" = 'strona-glowna',
    "page_type" = 'home'
WHERE "id" = 147 OR ("slug" = '' AND "title" = 'Strona Główna');

-- Weryfikacja
SELECT "id", "slug", "title", "page_type", "is_published"
FROM "pages"
WHERE "slug" = 'strona-glowna' OR "slug" = '';`,
            notes: '✅ ROZWIĄZANE: fix-homepage-slug.js naprawił to - slug ustawiono na "strona-glowna"'
        },
        {
            title: 'Brak home_sections w stronie głównej',
            category: 'DATABASE',
            severity: 'MEDIUM',
            description: `PROBLEM:
Strona główna (ID 147, slug="strona-glowna") ma pole home_sections = NULL

KONSEKWENCJE:
1. Brak hero slidera
2. Brak sekcji parallax
3. Brak sekcji "challenge banner"  
4. Strona główna renderuje się pusta lub z defaultami

MOŻLIWE PRZYCZYNY:
- Dane zostały wyczyszczone podczas migracji
- Nigdy nie zostały ustawione
- Błąd podczas zapisu

POTRZEBNE DANE:
home_sections powinno zawierać JSON z konfiguracją:
{
  "hero_slider": [...],
  "about_section": {...},
  "features": [...],
  "parallax_sections": [...],
  "challenge_banner": {...}
}`,
            sql_query: `-- Sprawdź aktualny stan
SELECT "id", "slug", "title", 
       LENGTH("home_sections") as "json_length",
       LEFT("home_sections", 100) as "preview"
FROM "pages"
WHERE "slug" = 'strona-glowna';

-- Opcja 1: Odzyskanie z backupu (jeśli dostępny)
-- Skopiuj home_sections z poprzedniej wersji strony

-- Opcja 2: Ręczne ustawienie przez panel admina
-- Przejdź do /admin/pages/strona-glowna i skonfiguruj sekcje`,
            notes: `⚠️  CZĘŚCIOWO ROZWIĄZANE: 
- Slug naprawiono  
- Trzeba będzie ręcznie skonfigurować sekcje w panelu admina`
        }
    ];

    try {
        console.log(`Dodawanie ${errors.length} notatek błędów...\n`);

        for (const error of errors) {
            const note = await prisma.errorNote.create({
                data: {
                    title: error.title,
                    category: error.category,
                    severity: error.severity,
                    description: error.description,
                    sql_query: error.sql_query,
                    status: error.notes?.includes('ROZWIĄZANE') ? 'RESOLVED' : 'OPEN',
                    notes: error.notes,
                    resolved_at: error.notes?.includes('ROZWIĄZANE') ? new Date() : null
                }
            });

            console.log(`✅ Dodano: "${note.title}" (${note.severity})`);
        }

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('  NOTATNIK WYPEŁNIONY!');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('Odwiedź /admin/error-notebook aby zobaczyć wszystkie błędy\n');

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        await prisma.$disconnect();
    }
}

populateErrorNotebook();
