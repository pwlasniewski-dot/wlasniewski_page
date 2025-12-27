
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- FINDING RECENT MEDIA ---');

    // Fetch last 10 media items to find the "B&W outdoor" and "ballerina" photos
    const media = await prisma.mediaLibrary.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: { id: true, file_url: true, created_at: true }
    });

    console.log('Recent Media:');
    media.forEach(m => {
        console.log(`[ID: ${m.id}] ${m.file_url} (Date: ${m.created_at})`);
    });
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
