
import prisma from '../src/lib/db/prisma';

async function main() {
    console.log('Fetching History Photos...');
    const photos = await prisma.historyPhoto.findMany();
    console.log(`Found ${photos.length} photos.`);

    const ids = photos.map(p => p.id);
    const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);

    if (duplicates.length > 0) {
        console.log('Duplicate IDs found:', duplicates);
    } else {
        console.log('No duplicate IDs found.');
    }

    console.log('Sample IDs:', ids.slice(0, 5));
    console.log('ID Type:', typeof ids[0]);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
