import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
    console.log('▶ Sprawdzam czy migracja JUŻ JEST na produkcji...\n');
    try {
        const r = await p.$queryRaw`
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE (table_name = 'users' AND column_name IN ('welcome_email_sent_at', 'welcome_email_count'))
               OR table_name IN ('nphoto_albums', 'offer_recommended_albums')
            ORDER BY table_name, column_name
        ` as any[];
        const map: Record<string, string[]> = {};
        for (const row of r) {
            map[row.table_name] = map[row.table_name] || [];
            map[row.table_name].push(row.column_name);
        }
        console.log('Stan w produkcji:');
        for (const [t, cols] of Object.entries(map)) {
            console.log(`  ${t}: ${cols.length} kolumn`);
        }

        const checks = {
            'users.welcome_email_sent_at': map['users']?.includes('welcome_email_sent_at') ?? false,
            'users.welcome_email_count': map['users']?.includes('welcome_email_count') ?? false,
            'nphoto_albums table': !!map['nphoto_albums']?.length,
            'offer_recommended_albums table': !!map['offer_recommended_albums']?.length,
        };
        console.log('\nWynik:');
        let allOk = true;
        for (const [name, ok] of Object.entries(checks)) {
            console.log(`  ${ok ? '✓' : '✗'} ${name}`);
            if (!ok) allOk = false;
        }
        console.log(allOk ? '\n✓ Migracja jest WCZESNIE WGRANA — deploy bezpieczny.' : '\n✗ MIGRACJA WYMAGANA przed deployem!');
    } catch (e: any) {
        console.log('Błąd query:', e.message);
    }
    await p.$disconnect();
})();
