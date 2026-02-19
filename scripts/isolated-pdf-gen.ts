import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { OfferDocument } from '../src/lib/services/OfferDocument';
import { ContractDocument } from '../src/lib/services/ContractDocument';
import fs from 'fs';

async function main() {
    try {
        const inputPath = process.argv[2];
        const outputPath = process.argv[3];
        const mode = process.argv[4]; // 'offer' or 'contract'

        if (!inputPath || !outputPath || !mode) {
            console.error('Missing arguments');
            process.exit(1);
        }

        const dataStr = fs.readFileSync(inputPath, 'utf8');
        const data = JSON.parse(dataStr);

        let buffer;
        if (mode === 'offer') {
            buffer = await renderToBuffer(React.createElement(OfferDocument, { offer: data }));
        } else {
            buffer = await renderToBuffer(
                React.createElement(ContractDocument, {
                    contract: data.contract,
                    clientName: data.clientName,
                    eventDate: data.eventDate
                })
            );
        }

        fs.writeFileSync(outputPath, buffer);
        process.exit(0);
    } catch (error) {
        console.error('ISOLATED PDF GENERATION FAILED:');
        console.error(error);
        process.exit(1);
    }
}

main();
