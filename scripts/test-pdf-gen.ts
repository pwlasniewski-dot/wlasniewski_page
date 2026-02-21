import prisma from '../src/lib/db/prisma';
import { generateContractPDF, generateOfferPDF } from '../src/lib/services/pdf';
import fs from 'fs';

async function testPdf() {
    try {
        console.log('Testing PDF generation for contract 1...');
        const contract = await prisma.contract.findUnique({
            where: { id: 1 },
            include: {
                offer: {
                    include: { sections: { include: { items: true } } }
                },
                user: true
            }
        });

        if (!contract) {
            console.log('Contract 1 not found');
            return;
        }

        const buffer = await generateContractPDF(contract, 'Test Client', '2026-03-01');
        fs.writeFileSync('test-contract.pdf', buffer);
        console.log('SUCCESS: test-contract.pdf generated');

        console.log('Testing PDF generation for offer 22...');
        const offer = await prisma.offer.findUnique({
            where: { id: 22 },
            include: {
                sections: {
                    include: { items: true }
                }
            }
        });

        if (!offer) {
            console.log('Offer 22 not found');
            return;
        }

        const offerBuffer = await generateOfferPDF(offer);
        fs.writeFileSync('test-offer.pdf', offerBuffer);
        console.log('SUCCESS: test-offer.pdf generated');

    } catch (e: any) {
        console.error('PDF TEST FAILED:', e.message);
        if (e.stack) console.error(e.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testPdf();
