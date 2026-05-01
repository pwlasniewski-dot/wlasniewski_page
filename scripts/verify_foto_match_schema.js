const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
    try {
        const t = await p.$queryRawUnsafe(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'foto_match%' ORDER BY table_name"
        );
        console.log('TABLES:', JSON.stringify(t));

        const c = await p.$queryRawUnsafe(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='foto_match_profile' ORDER BY ordinal_position"
        );
        console.log('PROFILE_COLS (' + c.length + '):');
        c.forEach(r => console.log('  -', r.column_name, r.data_type, r.is_nullable));

        const c2 = await p.$queryRawUnsafe(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='foto_match_photo' ORDER BY ordinal_position"
        );
        console.log('PHOTO_COLS (' + c2.length + '):');
        c2.forEach(r => console.log('  -', r.column_name, r.data_type));

        const fk = await p.$queryRawUnsafe(
            `SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, rc.delete_rule
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name
             JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name
             JOIN information_schema.referential_constraints rc ON rc.constraint_name=tc.constraint_name
             WHERE tc.table_name IN ('foto_match_profile','foto_match_photo') AND tc.constraint_type='FOREIGN KEY'`
        );
        console.log('FKS:');
        fk.forEach(r => console.log('  -', r.constraint_name, r.column_name, '->', r.foreign_table, '(' + r.delete_rule + ')'));

        const idx = await p.$queryRawUnsafe(
            "SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('foto_match_profile','foto_match_photo') ORDER BY tablename, indexname"
        );
        console.log('INDEXES:');
        idx.forEach(r => console.log('  -', r.tablename, ':', r.indexname));

        await p.$disconnect();
    } catch (e) {
        console.error('ERR', e.message);
        process.exit(1);
    }
})();
