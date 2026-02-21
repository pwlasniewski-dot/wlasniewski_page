import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { OfferDocument } from './OfferDocument';
import { ContractDocument } from './ContractDocument';

export async function generateOfferPDF(offer: any): Promise<Buffer> {
    console.log('[PDF] Generating PDF for offer:', offer.id);
    const generationDate = offer._footerNote || new Date().toLocaleString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    return await renderToBuffer(<OfferDocument offer={offer} generationDate={generationDate} />);
}

export async function generateContractPDF(
    contract: any,
    clientName?: string,
    eventDate?: string
): Promise<Buffer> {
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
}
