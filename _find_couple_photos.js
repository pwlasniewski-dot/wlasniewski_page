const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
    // Próba 1: po category/tags
    const byTag = await p.mediaLibrary.findMany({
        where: {
            mime_type: { startsWith: 'image' },
            OR: [
                { category: { contains: 'para', mode: 'insensitive' } },
                { category: { contains: 'narzecz', mode: 'insensitive' } },
                { tags: { contains: 'para', mode: 'insensitive' } },
                { tags: { contains: 'narzecz', mode: 'insensitive' } },
                { tags: { contains: 'engagement', mode: 'insensitive' } },
                { folder: { contains: 'narzecz', mode: 'insensitive' } },
                { folder: { contains: 'para', mode: 'insensitive' } },
                { folder: { contains: 'sesje', mode: 'insensitive' } },
            ],
        },
        take: 30,
        select: { file_path: true, alt_text: true, folder: true, category: true, tags: true, width: true, height: true },
    });
    console.log('=== BY TAG/FOLDER (', byTag.length, ') ===');
    console.log(JSON.stringify(byTag, null, 2));

    // Próba 2: lista folderów
    const folders = await p.mediaLibrary.groupBy({
        by: ['folder'],
        _count: { _all: true },
        orderBy: { _count: { folder: 'desc' } },
        take: 20,
    });
    console.log('=== FOLDERS ===');
    console.log(JSON.stringify(folders, null, 2));

    await p.$disconnect();
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
