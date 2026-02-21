import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { OfferDocument } from './OfferDocument';
import { ContractDocument } from './ContractDocument';

export async function generateOfferPDF(offer: any): Promise<Buffer> {
    try {
        console.log('[PDF] Generating PDF for offer:', offer.id);
        const generationDate = offer._footerNote || new Date().toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        return await renderToBuffer(<OfferDocument offer={offer} generationDate={generationDate} />);
    } catch (error: any) {
        console.error('[PDF] Error in generateOfferPDF:', error);
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
