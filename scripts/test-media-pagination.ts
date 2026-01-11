import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPagination() {
    console.log('--- Testing Media Pagination ---');

    const limit = 5;
    const page1 = await prisma.mediaLibrary.findMany({
        take: limit,
        skip: 0,
        orderBy: { created_at: 'desc' }
    });

    const page2 = await prisma.mediaLibrary.findMany({
        take: limit,
        skip: limit,
        orderBy: { created_at: 'desc' }
    });

    const total = await prisma.mediaLibrary.count();

    console.log(`Total images in DB: ${total}`);
    console.log(`Page 1 (first ${limit} items):`, page1.length);
    console.log(`Page 2 (next ${limit} items):`, page2.length);

    if (page1.length > 0 && page2.length > 0) {
        const intersection = page1.filter(p1 => page2.some(p2 => p2.id === p1.id));
        if (intersection.length === 0) {
            console.log('✅ Pagination confirmed: Page 1 and Page 2 have no overlapping items.');
        } else {
            console.log('❌ Pagination failed: Overlapping items found between Page 1 and Page 2.');
        }
    } else if (total <= limit) {
        console.log('⚠️ Not enough items in DB to fully test pagination gaps, but logic seems sound.');
    }
}

testPagination()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
