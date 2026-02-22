import { generateOfferPDFBuffer } from './generateOfferPDF';
import { generateContractPDFBuffer } from './generateContractPDF';

import fs from 'fs';
import path from 'path';

export async function generateOfferPDF(offer: any, includeClientSelection: boolean = false): Promise<Buffer> {
    try {
        console.log('[PDF] ==================== GENERATING PDF (PDFKIT) ====================');
        console.log('[PDF] Offer ID:', offer.id);
        console.log('[PDF] Offer status:', offer.status);
        console.log('[PDF] Include client selection:', includeClientSelection);

        const generationDate = offer._footerNote || new Date().toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        console.log('[PDF] Starting pdfkit generation...');
        const buffer = await generateOfferPDFBuffer(offer, generationDate, includeClientSelection);
        console.log(`[PDF] ✅ SUCCESS! Buffer size: ${buffer.length} bytes`);
        console.log('[PDF] ====================  PDF READY  ====================');
        return buffer;
    } catch (error: any) {
        console.error('[PDF] Error in generateOfferPDF:', error);
        console.error('[PDF] Error message:', error?.message);
        console.error('[PDF] Error name:', error?.name);
        throw error;
    }
}

export async function generateContractPDF(
    contract: any,
    includeSignatureSection: boolean = false
): Promise<Buffer> {
    try {
        console.log('[PDF] ==================== GENERATING CONTRACT PDF (PDFKIT) ====================');
        console.log('[PDF] Contract ID:', contract?.id);
        console.log('[PDF] Contract status:', contract?.status);
        console.log('[PDF] Include signature section:', includeSignatureSection);

        const buffer = await generateContractPDFBuffer(contract, includeSignatureSection);
        console.log(`[PDF] ✅ CONTRACT PDF SUCCESS! Buffer size: ${buffer.length} bytes`);
        console.log('[PDF] ====================  PDF READY  ====================');
        return buffer;
    } catch (error: any) {
        console.error('[PDF] Error in generateContractPDF:', error);
        console.error('[PDF] Error message:', error?.message);
        console.error('[PDF] Error name:', error?.name);
        throw error;
    }
}
