import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { OfferDocument } from './OfferDocument';
import { ContractDocument } from './ContractDocument';

import fs from 'fs';
import path from 'path';

export async function generateOfferPDF(offer: any): Promise<Buffer> {
    try {
        console.log('[PDF] Generating PDF for offer:', offer.id);

        // Debugging font paths
        const fontDir = path.join(process.cwd(), 'public', 'fonts');
        console.log('[PDF] Font directory:', fontDir);
        console.log('[PDF] Is Vercel?', process.env.VERCEL === '1');

        const fontsToWeights = {
            'Montserrat-Regular.ttf': 400,
            'Montserrat-SemiBold.ttf': 600,
            'Montserrat-Bold.ttf': 700
        };

        for (const fontFile of Object.keys(fontsToWeights)) {
            const fullPath = path.join(fontDir, fontFile);
            const exists = fs.existsSync(fullPath);
            console.log(`[PDF] Font ${fontFile} exists? ${exists} (Path: ${fullPath})`);
            if (!exists) {
                console.warn(`[PDF] CRITICAL: Font ${fontFile} NOT FOUND at ${fullPath}`);
            }
        }

        const generationDate = offer._footerNote || new Date().toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        console.log('[PDF] Rendering to buffer...');
        const buffer = await renderToBuffer(<OfferDocument offer={offer} generationDate={generationDate} />);
        console.log(`[PDF] Success! Buffer size: ${buffer.length} bytes`);
        return buffer;
    } catch (error: any) {
        console.error('[PDF] Error in generateOfferPDF:', error);
        console.error('[PDF] Stack trace:', error.stack);
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
