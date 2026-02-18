import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Use local tsx binary directly to avoid npx hanging inside Next.js server
function getTsxBin(): string {
    const localTsx = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');
    if (fs.existsSync(localTsx)) return localTsx;
    // fallback
    return 'tsx';
}

export async function generateOfferPDF(offer: any): Promise<Buffer> {
    const tempIn = path.join(os.tmpdir(), `offer-in-${Date.now()}.json`);
    const tempOut = path.join(os.tmpdir(), `offer-out-${Date.now()}.pdf`);

    try {
        fs.writeFileSync(tempIn, JSON.stringify(offer));

        const tsx = getTsxBin();
        const scriptPath = path.join(process.cwd(), 'scripts', 'isolated-pdf-gen.ts');
        const cmd = `"${tsx}" "${scriptPath}" "${tempIn}" "${tempOut}" "offer"`;
        console.log('[PDF] Running isolated PDF generation for offer:', offer.id);
        execSync(cmd, {
            cwd: process.cwd(),
            timeout: 30000, // 30 second timeout
            stdio: ['ignore', 'pipe', 'pipe']
        });

        if (!fs.existsSync(tempOut)) {
            throw new Error('PDF output file was not created by isolated process');
        }

        const buffer = fs.readFileSync(tempOut);
        return buffer;
    } finally {
        if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
        if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
    }
}

export async function generateContractPDF(
    contract: any,
    clientName?: string,
    eventDate?: string
): Promise<Buffer> {
    const tempIn = path.join(os.tmpdir(), `contract-in-${Date.now()}.json`);
    const tempOut = path.join(os.tmpdir(), `contract-out-${Date.now()}.pdf`);

    try {
        fs.writeFileSync(tempIn, JSON.stringify({ contract, clientName, eventDate }));

        const tsx = getTsxBin();
        const scriptPath = path.join(process.cwd(), 'scripts', 'isolated-pdf-gen.ts');
        const cmd = `"${tsx}" "${scriptPath}" "${tempIn}" "${tempOut}" "contract"`;
        console.log('[PDF] Running isolated PDF generation for contract:', contract?.id);
        execSync(cmd, {
            cwd: process.cwd(),
            timeout: 30000, // 30 second timeout
            stdio: ['ignore', 'pipe', 'pipe']
        });

        if (!fs.existsSync(tempOut)) {
            throw new Error('PDF output file was not created by isolated process');
        }

        const buffer = fs.readFileSync(tempOut);
        return buffer;
    } finally {
        if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
        if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
    }
}
