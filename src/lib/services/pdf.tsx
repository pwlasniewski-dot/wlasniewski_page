import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { OfferDocument } from './OfferDocument';
import { ContractDocument } from './ContractDocument';

export async function generateOfferPDF(offer: any): Promise<Buffer> {
    console.log('[PDF] Generating PDF for offer:', offer.id);
    return await renderToBuffer(<OfferDocument offer={offer} />);
}

export async function generateContractPDF(
    contract: any,
    clientName?: string,
    eventDate?: string
): Promise<Buffer> {
    console.log('[PDF] Generating PDF for contract:', contract?.id);
    return await renderToBuffer(
        <ContractDocument
            contract={contract}
            clientName={clientName}
            eventDate={eventDate}
        />
    );
}
