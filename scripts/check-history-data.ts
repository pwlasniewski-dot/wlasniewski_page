
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking HistoryPhoto table...');
    const photos = await prisma.historyPhoto.findMany();
    console.log(`Total photos: ${photos.length}`);

    const ids = photos.map(p => p.id);
    console.log('Sample IDs:', ids.slice(0, 5));

    const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
    if (duplicates.length > 0) {
        console.error('Found duplicate IDs:', duplicates);
    } else {
        console.log('No duplicate IDs found in DB.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
