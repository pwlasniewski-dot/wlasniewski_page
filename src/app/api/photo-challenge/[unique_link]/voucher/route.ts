import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/db/prisma';
import { deriveShortCode } from '@/lib/photo-challenge/short-code';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ unique_link: string }> }
) {
    try {
        const { unique_link } = await params;

        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link },
            include: { package: true, location: true },
        });

        if (!challenge) {
            return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        }

        if (challenge.status !== 'accepted' && challenge.status !== 'completed') {
            return NextResponse.json(
                { success: false, error: 'Voucher dostępny po akceptacji zaproszenia.' },
                { status: 403 }
            );
        }

        const booking = await prisma.booking.findFirst({ where: { challenge_id: challenge.id } });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
        const inviteUrl = `${baseUrl}/foto-wyzwanie/invite/${challenge.unique_link}`;
        const shortCode = deriveShortCode(challenge.unique_link);

        // QR code (PNG buffer for pdfkit)
        const qrPngBuffer = await QRCode.toBuffer(inviteUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 320,
            color: { dark: COLOR_DARK, light: '#ffffff' },
        });

        const sessionDate = booking?.date || challenge.session_date;
        const formattedDate = sessionDate
            ? new Date(sessionDate).toLocaleDateString('pl-PL', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })
            : 'Termin do uzgodnienia';
        const sessionTime = booking?.start_time && booking?.end_time
            ? `${booking.start_time} – ${booking.end_time}`
            : booking?.start_time || 'godzina do uzgodnienia';

        const locationName = challenge.location?.name || challenge.custom_location || 'Lokalizacja do uzgodnienia';
        const locationAddress = challenge.location?.address || '';

        const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true, font: undefined });
                const chunks: Buffer[] = [];
                doc.on('data', (c: Buffer) => chunks.push(c));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Register fonts (PL diacritics)
                try {
                    const reg = getFontPath('Montserrat-Regular.ttf');
                    const bold = getFontPath('Montserrat-Bold.ttf');
                    const semi = getFontPath('Montserrat-SemiBold.ttf');
                    if (fs.existsSync(reg)) doc.registerFont('M', reg);
                    if (fs.existsSync(bold)) doc.registerFont('M-Bold', bold);
                    if (fs.existsSync(semi)) doc.registerFont('M-Semi', semi);
                } catch {/* noop */}
                doc.font('M');

                const W = doc.page.width;   // 595
                const H = doc.page.height;  // 842

                // ===== Top dark band with brand =====
                doc.rect(0, 0, W, 110).fill(COLOR_DARK);
                doc.fillColor(COLOR_GOLD).font('M-Bold').fontSize(11)
                    .text('WAŁYCZ STUDIO · WLASNIEWSKI FOTOGRAFIA', 0, 38, { align: 'center', width: W, characterSpacing: 3 });
                doc.fillColor('#ffffff').font('M').fontSize(9)
                    .text('foto-wyzwanie.pl · wlasniewski.pl', 0, 60, { align: 'center', width: W, characterSpacing: 1 });
                doc.fillColor(COLOR_GOLD).fontSize(8)
                    .text('VOUCHER FOTO-WYZWANIA', 0, 82, { align: 'center', width: W, characterSpacing: 6 });

                // ===== Main title =====
                doc.fillColor(COLOR_DARK).font('M-Bold').fontSize(28)
                    .text('Voucher na sesję', 0, 145, { align: 'center', width: W });

                doc.fillColor(COLOR_GOLD).font('M-Semi').fontSize(11)
                    .text('— OPŁACONY · POTWIERDZONY —', 0, 185, { align: 'center', width: W, characterSpacing: 4 });

                // ===== Names block =====
                doc.fillColor(COLOR_MUTED).font('M').fontSize(9)
                    .text('OD', 60, 230, { characterSpacing: 3 });
                doc.fillColor(COLOR_DARK).font('M-Bold').fontSize(16)
                    .text(challenge.inviter_name, 60, 245, { width: 240 });

                doc.fillColor(COLOR_MUTED).font('M').fontSize(9)
                    .text('DLA', 320, 230, { characterSpacing: 3 });
                doc.fillColor(COLOR_DARK).font('M-Bold').fontSize(16)
                    .text(challenge.invitee_name, 320, 245, { width: 240 });

                // ===== Light card with details =====
                const cardY = 295;
                const cardH = 240;
                doc.roundedRect(50, cardY, W - 100, cardH, 8).fill(COLOR_LIGHT_BG);
                doc.strokeColor(COLOR_GOLD).lineWidth(0.6)
                    .roundedRect(50, cardY, W - 100, cardH, 8).stroke();

                let y = cardY + 24;
                const labelX = 70;
                const valueX = 200;
                const lineGap = 32;

                const drawRow = (label: string, value: string) => {
                    doc.fillColor(COLOR_MUTED).font('M').fontSize(8.5)
                        .text(label.toUpperCase(), labelX, y, { width: 120, characterSpacing: 2.5 });
                    doc.fillColor(COLOR_TEXT).font('M-Semi').fontSize(11)
                        .text(value, valueX, y - 2, { width: W - valueX - 70 });
                    y += lineGap;
                };

                drawRow('Pakiet', challenge.package?.name || '—');
                drawRow('Cena', `${challenge.package?.challenge_price || 0} zł  ·  opłacone z góry`);
                drawRow('Data sesji', formattedDate);
                drawRow('Godzina', sessionTime);
                drawRow('Miejsce', locationAddress ? `${locationName} — ${locationAddress}` : locationName);

                // Verification code in highlighted box
                y += 4;
                doc.roundedRect(labelX, y, W - 140, 50, 6).fill('#ffffff');
                doc.strokeColor(COLOR_GOLD).lineWidth(0.6).roundedRect(labelX, y, W - 140, 50, 6).stroke();
                doc.fillColor(COLOR_MUTED).font('M').fontSize(8.5)
                    .text('KOD WERYFIKACYJNY', labelX + 16, y + 10, { characterSpacing: 2.5 });
                doc.fillColor(COLOR_GOLD).font('M-Bold').fontSize(20)
                    .text(shortCode, labelX + 16, y + 22, { characterSpacing: 6 });

                // ===== QR + caption =====
                const qrSize = 110;
                const qrX = (W - qrSize) / 2;
                const qrY = cardY + cardH + 30;
                doc.image(qrPngBuffer, qrX, qrY, { width: qrSize, height: qrSize });
                doc.fillColor(COLOR_MUTED).font('M').fontSize(8.5)
                    .text('Zeskanuj, aby otworzyć stronę zaproszenia', 0, qrY + qrSize + 8,
                        { align: 'center', width: W, characterSpacing: 1 });

                // ===== Bottom dark footer =====
                const footerY = H - 110;
                doc.rect(0, footerY, W, 110).fill(COLOR_DARK);

                doc.fillColor('#ffffff').font('M-Semi').fontSize(10)
                    .text('Przemysław Wlasniewski', 60, footerY + 22);
                doc.fillColor('#bdbdbd').font('M').fontSize(9)
                    .text('Wałycz Studio · Toruń · woj. kujawsko-pomorskie', 60, footerY + 38);
                doc.text('+48 660 470 200  ·  kontakt@wlasniewski.pl', 60, footerY + 52);
                doc.fillColor(COLOR_GOLD).fontSize(8)
                    .text('NIP 8792583213', 60, footerY + 70, { characterSpacing: 1.5 });

                doc.fillColor('#bdbdbd').font('M').fontSize(8)
                    .text('Voucher imienny · nie podlega odsprzedaży', 0, footerY + 38,
                        { align: 'right', width: W - 60, characterSpacing: 1 });
                doc.text(`ID: ${challenge.unique_link.slice(0, 18)}...`, 0, footerY + 52,
                    { align: 'right', width: W - 60 });
                doc.text(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, 0, footerY + 70,
                    { align: 'right', width: W - 60 });

                doc.end();
            } catch (err) {
                reject(err);
            }
        });

        return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="voucher-foto-wyzwanie-${shortCode}.pdf"`,
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (err) {
        console.error('[voucher] error:', err);
        return NextResponse.json({ success: false, error: 'PDF generation failed' }, { status: 500 });
    }
}
