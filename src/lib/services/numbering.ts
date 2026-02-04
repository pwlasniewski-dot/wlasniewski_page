import prisma from '@/lib/db/prisma';

/**
 * Generate unique offer number in format: B2C-YYYY-NNN or B2B-YYYY-NNN
 * @param type - "B2C" or "B2B"
 * @returns Promise<string> - e.g. "B2C-2026-001"
 */
export async function generateOfferNumber(type: 'B2C' | 'B2B'): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = type.toUpperCase();

    // Find highest number for this type and year
    const lastOffer = await prisma.offer.findFirst({
        where: {
            offerNumber: {
                startsWith: `${prefix}-${currentYear}-`
            }
        },
        orderBy: {
            offerNumber: 'desc'
        }
    });

    let nextNumber = 1;
    if (lastOffer && lastOffer.offerNumber) {
        // Extract number from format "B2C-2026-001"
        const parts = lastOffer.offerNumber.split('-');
        if (parts.length === 3) {
            const lastNum = parseInt(parts[2], 10);
            if (!isNaN(lastNum)) {
                nextNumber = lastNum + 1;
            }
        }
    }

    // Format: B2C-2026-001 (3 digits, zero-padded)
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}-${currentYear}-${formattedNumber}`;
}

/**
 * Generate unique contract number in format: UMW-B2C-YYYY-NNN or UMW-B2B-YYYY-NNN
 * @param type - "B2C" or "B2B"
 * @returns Promise<string> - e.g. "UMW-B2C-2026-001"
 */
export async function generateContractNumber(type: 'B2C' | 'B2B'): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `UMW-${type.toUpperCase()}`;

    const lastContract = await prisma.contract.findFirst({
        where: {
            contract_number: {
                startsWith: `${prefix}-${currentYear}-`
            }
        },
        orderBy: {
            contract_number: 'desc'
        }
    });

    let nextNumber = 1;
    if (lastContract && lastContract.contract_number) {
        const parts = lastContract.contract_number.split('-');
        if (parts.length === 4) { // UMW-B2C-2026-001
            const lastNum = parseInt(parts[3], 10);
            if (!isNaN(lastNum)) {
                nextNumber = lastNum + 1;
            }
        }
    }

    const formattedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}-${currentYear}-${formattedNumber}`;
}
