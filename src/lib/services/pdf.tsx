import { renderToStream } from '@react-pdf/renderer';
import { OfferDocument } from './OfferDocument';
import { ContractDocument } from './ContractDocument';

export async function generateOfferPDF(offer: any): Promise<Buffer> {
    const stream = await renderToStream(<OfferDocument offer={ offer } />);

    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

export async function generateContractPDF(
    contract: any,
    clientName?: string,
    eventDate?: string
): Promise<Buffer> {
    const stream = await renderToStream(
        <ContractDocument contract={ contract } clientName = { clientName } eventDate = { eventDate } />
    );

    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
