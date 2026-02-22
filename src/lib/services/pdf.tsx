import { renderToBuffer } from '@react-pdf/renderer';
import { ContractDocument } from './ContractDocument';
import { generateOfferPDFBuffer } from './generateOfferPDF';

import fs from 'fs';
import path from 'path';

export async function generateOfferPDF(offer: any): Promise<Buffer> {
    try {
        console.log('[PDF] ==================== GENERATING PDF (PDFKIT) ====================');
        console.log('[PDF] Offer ID:', offer.id);
        console.log('[PDF] Offer status:', offer.status);
        console.log('[PDF] Offer category:', offer.category);

        const generationDate = offer._footerNote || new Date().toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        console.log('[PDF] Starting pdfkit generation...');
        const buffer = await generateOfferPDFBuffer(offer, generationDate);
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
    clientName?: string,
    eventDate?: string
): Promise<Buffer> {
    try {
        console.log('[PDF] Generating PDF for contract:', contract?.id);
        const generationDate = contract._footerNote || new Date().toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        return await renderToBuffer(
            <ContractDocument
                contract={contract}
                clientName={clientName}
                eventDate={eventDate}
                generationDate={generationDate}
            />
        );
    } catch (error: any) {
        console.error('[PDF] Error in generateContractPDF:', error);
        throw error;
    }
}
