import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Get font file path with multiple fallback locations
 */
function getFontPath(fileName: string): string {
    const pathsToTry = [
        path.join(process.cwd(), 'public', 'fonts', fileName),
        path.join('/var/task', 'public', 'fonts', fileName),
        path.join('/var/task/.next/standalone', 'public', 'fonts', fileName),
        path.join(process.cwd(), 'node_modules', 'pdfkit', 'js', 'data', fileName),
    ];

    for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
            console.log(`[ContractPDF] Font found at: ${p}`);
            return p;
        }
    }

    console.warn(`[ContractPDF] Font ${fileName} not found in any path, using default`);
    return fileName;
}

/**
 * Generate contract PDF using pdfkit
 */
export async function generateContractPDFBuffer(
    contract: any,
    includeSignatureSection: boolean = false
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Register fonts
            try {
                const montserratPath = getFontPath('Montserrat-Regular.ttf');
                const montserratBoldPath = getFontPath('Montserrat-Bold.ttf');
                const montserratSemiBoldPath = getFontPath('Montserrat-SemiBold.ttf');

                doc.registerFont('Montserrat', montserratPath);
                doc.registerFont('Montserrat-Bold', montserratBoldPath);
                doc.registerFont('Montserrat-SemiBold', montserratSemiBoldPath);
            } catch (fontError) {
                console.warn('[ContractPDF] Font registration warning:', fontError);
                // Continue with default fonts
            }

            // Title
            doc.font('Montserrat-Bold', 16);
            doc.text(contract.contract_number ? `Umowa nr ${contract.contract_number}` : 'Umowa o dzieło fotograficzne', {
                align: 'center',
            });
            doc.moveDown(0.5);

            // Horizontal line
            doc.strokeColor('#E5E7EB');
            doc.lineWidth(1);
            doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
            doc.moveDown(0.5);

            // Contract content (HTML stripped to plain text)
            doc.font('Montserrat', 10);
            doc.fillColor('#1F2937');

            if (contract.content) {
                // Strip HTML tags and decode entities
                const plainText = contract.content
                    .replace(/<[^>]*>/g, '') // Remove HTML tags
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&amp;/g, '&')
                    .trim();

                doc.text(plainText, {
                    align: 'left',
                    width: 515,
                    lineGap: 4,
                });
                doc.moveDown(0.5);
            }

            // Signature section (if contract is signed)
            if (includeSignatureSection && contract.signed_at) {
                doc.moveDown(1);
                doc.strokeColor('#E5E7EB');
                doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
                doc.moveDown(0.5);

                // Title
                doc.font('Montserrat-Bold', 12);
                doc.fillColor('#059669'); // Green
                doc.text('ZATWIERDZENIE UMOWY', { align: 'center' });
                doc.moveDown(0.3);

                // Signature info
                doc.font('Montserrat', 10);
                doc.fillColor('#1F2937');

                const signedDate = new Date(contract.signed_at).toLocaleString('pl-PL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });

                doc.text(`Podpisano elektronicznie w dniu: ${signedDate}`, {
                    align: 'center',
                });
                doc.moveDown(0.3);

                // Client notes (if provided)
                if (contract.client_note) {
                    doc.moveDown(0.3);
                    doc.font('Montserrat-SemiBold', 10);
                    doc.fillColor('#374151');
                    doc.text('Notatka klienta:');
                    doc.moveDown(0.2);

                    doc.font('Montserrat', 9);
                    doc.fillColor('#6B7280');
                    doc.text(contract.client_note, {
                        align: 'left',
                        width: 515,
                        lineGap: 3,
                    });
                }

                doc.moveDown(0.5);
            }

            // Footer with generation date
            doc.fontSize(8);
            doc.fillColor('#9CA3AF');
            const footerText = contract._footerNote || `Dokument wygenerowany: ${new Date().toLocaleString('pl-PL')}`;
            doc.text(footerText, 40, doc.page.height - 40, {
                align: 'center',
                width: doc.page.width - 80,
            });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
