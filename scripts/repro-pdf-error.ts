import { generateOfferPDF } from '../src/lib/services/pdf';
import prisma from '../src/lib/db/prisma';
import fs from 'fs';

async function test() {
    try {
        const offerId = 12;
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                sections: {
                    include: { items: true },
                },
            },
        });

        if (!offer) {
            console.error('Offer 11 not found');
            return;
        }

        console.log(`Generating PDF for offer ${offerId}...`);
        const buffer = await generateOfferPDF(offer);
        fs.writeFileSync(`test-offer-${offerId}.pdf`, buffer);
        console.log(`PDF generated successfully: test-offer-${offerId}.pdf`);
    } catch (error) {
        console.error('FAILED TO GENERATE PDF:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
