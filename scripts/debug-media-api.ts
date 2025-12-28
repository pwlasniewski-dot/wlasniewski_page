
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugMediaApi() {
    try {
        // limit to first 5
        const media = await prisma.mediaLibrary.findMany({
            where: {}, // Simulate "All" folder which sends empty object in API
            orderBy: { created_at: 'desc' },
            take: 5
        });

        console.log(`API would return ${media.length} items for "All" folder.`);
        if (media.length > 0) {
            console.log('Sample item:', media[0]);
        }

        // Check specific folder "Wykryte"
        const wykryte = await prisma.mediaLibrary.findMany({
            where: { folder: 'Wykryte' },
            take: 5
        });
        console.log(`API would return ${wykryte.length} items for "Wykryte" folder.`);


        // Debug folders aggregation
        const folders = await prisma.mediaLibrary.groupBy({
            by: ['folder'],
            _count: { id: true }
        });
        console.log('Folders found:', folders);

    } catch (error) {
        console.error("DB Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

debugMediaApi();
