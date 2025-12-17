
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listMedia() {
    try {
        const media = await prisma.mediaLibrary.findMany({
            take: 20,
            orderBy: { created_at: 'desc' },
            select: { id: true, file_name: true, file_path: true }
        });

        console.log("Recent Media:");
        media.forEach(m => {
            console.log(`[${m.id}] ${m.file_name} - ${m.file_path}`);
        });

    } catch (error) {
        console.error('Error listing media:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listMedia();
