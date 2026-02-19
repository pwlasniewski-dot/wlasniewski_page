import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const offer = await prisma.offer.findFirst({
        where: {
            OR: [
                { offerNumber: 'B2C-2026-005' },
                { title: { contains: 'Pierwsza Komunia Święta' } }
            ]
        },
        select: {
            id: true,
            title: true,
            offerNumber: true,
            pdf_url: true,
            template_data: true
        }
    });

    console.log('Offer ID:', offer?.id);
    console.log('PDF URL:', offer?.pdf_url);
    console.log('Has Template Data:', !!offer?.template_data);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
