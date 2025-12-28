
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecoveredFiles() {
    const count = await prisma.mediaLibrary.count({
        where: {
            folder: 'Wykryte'
        }
    });

    const sample = await prisma.mediaLibrary.findFirst({
        where: {
            folder: 'Wykryte'
        }
    });

    console.log(`Found ${count} files in folder 'Wykryte'.`);
    if (sample) {
        console.log(`Sample file: ${sample.file_name} (ID: ${sample.id})`);
    }
}

checkRecoveredFiles()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
