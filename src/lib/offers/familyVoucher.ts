import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { BUSINESS_INFO } from '@/lib/business-info';

const COLOR_GOLD = '#c5a059';
const COLOR_DARK = '#1a1a1a';
const COLOR_LIGHT_BG = '#faf6ed';
const COLOR_TEXT = '#2a2a2a';
const COLOR_MUTED = '#6b6b6b';

function getFontPath(fileName: string): string {
    const localPath = path.join(process.cwd(), 'public', 'fonts', fileName);
    if (fs.existsSync(localPath)) return localPath;
    const netlifyPath = path.resolve(__dirname, '..', '..', '..', 'public', 'fonts', fileName);
    if (fs.existsSync(netlifyPath)) return netlifyPath;
    return localPath;
}

export interface FamilyVoucherData {
    senderName: string;
    recipientName: string;
    packageName: string;
    packagePriceLabel: string;
    hidePrice?: boolean;
    sessionDate: string;
    sessionTime: string;
    location: string;
    verificationCode: string;
    qrTarget: string;
}

export async function generateFamilyVoucherPdfBuffer(voucher: FamilyVoucherData): Promise<Buffer> {
    const qrPngBuffer = await QRCode.toBuffer(voucher.qrTarget, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 320,
        color: { dark: COLOR_DARK, light: '#ffffff' },
    });

    return await new Promise<Buffer>((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true, font: undefined });
            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            try {
                const reg = getFontPath('Montserrat-Regular.ttf');
                const bold = getFontPath('Montserrat-Bold.ttf');
                const semi = getFontPath('Montserrat-SemiBold.ttf');
                if (fs.existsSync(reg)) doc.registerFont('M', reg);
                if (fs.existsSync(bold)) doc.registerFont('M-Bold', bold);
                if (fs.existsSync(semi)) doc.registerFont('M-Semi', semi);
            } catch {
                // noop
            }

            doc.font('M');

            const width = doc.page.width;
            const height = doc.page.height;

            doc.rect(0, 0, width, 110).fill(COLOR_DARK);
            doc.fillColor(COLOR_GOLD).font('M-Bold').fontSize(11)
                .text(`${BUSINESS_INFO.nameAscii.toUpperCase()} · FOTOGRAFIA`, 0, 38, { align: 'center', width, characterSpacing: 3 });
            doc.fillColor('#ffffff').font('M').fontSize(9)
                .text(BUSINESS_INFO.siteName, 0, 60, { align: 'center', width, characterSpacing: 1 });
            doc.fillColor(COLOR_GOLD).fontSize(8)
                .text('VOUCHER SESJI RODZINNEJ', 0, 82, { align: 'center', width, characterSpacing: 6 });

            doc.fillColor(COLOR_DARK).font('M-Bold').fontSize(28)
                .text('Voucher na sesję', 0, 145, { align: 'center', width });

            doc.fillColor(COLOR_MUTED).font('M').fontSize(9)
                .text('OD', 60, 230, { characterSpacing: 3 });
            doc.fillColor(COLOR_DARK).font('M-Bold').fontSize(16)
                .text(voucher.senderName || 'Osoba zamawiająca', 60, 245, { width: 240 });

            doc.fillColor(COLOR_MUTED).font('M').fontSize(9)
                .text('DLA', 320, 230, { characterSpacing: 3 });
            doc.fillColor(COLOR_DARK).font('M-Bold').fontSize(16)
                .text(voucher.recipientName || 'Rodzice', 320, 245, { width: 240 });

            const cardY = 295;
            const cardH = voucher.hidePrice ? 150 : 182;
            doc.roundedRect(50, cardY, width - 100, cardH, 8).fill(COLOR_LIGHT_BG);
            doc.strokeColor(COLOR_GOLD).lineWidth(0.6)
                .roundedRect(50, cardY, width - 100, cardH, 8).stroke();

            let y = cardY + 24;
            const labelX = 70;
            const valueX = 200;
            const lineGap = 32;

            const drawRow = (label: string, value: string) => {
                doc.fillColor(COLOR_MUTED).font('M').fontSize(8.5)
                    .text(label.toUpperCase(), labelX, y, { width: 120, characterSpacing: 2.5 });
                doc.fillColor(COLOR_TEXT).font('M-Semi').fontSize(11)
                    .text(value, valueX, y - 2, { width: width - valueX - 70 });
                y += lineGap;
            };

            drawRow('Pakiet', voucher.packageName || 'Do wyboru');
            if (!voucher.hidePrice) {
                drawRow('Cena', voucher.packagePriceLabel || 'Do ustalenia');
            }
            drawRow('Data sesji', voucher.sessionDate || 'Termin do uzgodnienia');
            drawRow('Godzina', voucher.sessionTime || 'Godzina do uzgodnienia');
            drawRow('Miejsce', voucher.location || 'Lokalizacja do uzgodnienia');

            const qrSize = 110;
            const qrX = (width - qrSize) / 2;
            const qrY = cardY + cardH + 30;
            doc.image(qrPngBuffer, qrX, qrY, { width: qrSize, height: qrSize });
            doc.fillColor(COLOR_MUTED).font('M').fontSize(8.5)
                .text('Zeskanuj, aby otworzyć wlasniewski.pl', 0, qrY + qrSize + 8, {
                    align: 'center', width, characterSpacing: 1,
                });

            const footerY = height - 110;
            doc.rect(0, footerY, width, 110).fill(COLOR_DARK);
            doc.fillColor('#ffffff').font('M-Semi').fontSize(10)
                .text(BUSINESS_INFO.nameAscii, 60, footerY + 22);
            doc.fillColor('#bdbdbd').font('M').fontSize(9)
                .text(`${BUSINESS_INFO.regionAscii} - sesje rodzinne`, 60, footerY + 38);
            doc.text(`${BUSINESS_INFO.phone}  ·  ${BUSINESS_INFO.email}`, 60, footerY + 52);
            doc.fillColor(COLOR_GOLD).fontSize(8)
                .text(`NIP ${BUSINESS_INFO.nip}`, 60, footerY + 70, { characterSpacing: 1.5 });

            doc.fillColor('#bdbdbd').font('M').fontSize(8)
                .text('Voucher imienny · wyłącznie do użytku rodzinnego', 0, footerY + 38, {
                    align: 'right', width: width - 60, characterSpacing: 1,
                });
            doc.text(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, 0, footerY + 52, { align: 'right', width: width - 60 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}