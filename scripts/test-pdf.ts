import { PrismaClient } from '@prisma/client';
import { generateContractPDF } from '../src/lib/services/pdf';

const prisma = new PrismaClient();

async function main() {
    const contract = await prisma.contract.findFirst({
        where: { status: { in: ['SIGNED', 'signed'] } },
        include: { offer: true, user: true }
    });
    if (!contract) return console.log('No signed contract found');
    console.log('Found contract', contract.id);
    try {
        const clientName = (contract.offer?.template_data as any)?.contactName || contract.user?.name || undefined;
        const eventDate = (contract.offer?.template_data as any)?.eventDate || undefined;

        const modifiedContract = { ...contract, _footerNote: 'Test footer note' };
        const buf = await generateContractPDF(modifiedContract as any, clientName, eventDate);
        console.log('Success, generated buffer of size', buf.length);
    } catch (e) {
        console.error('Error generating:', e);
    }
}
main().finally(() => prisma.$disconnect());
