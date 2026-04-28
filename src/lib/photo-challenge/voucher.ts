/**
 * Shared voucher PDF + ICS generator for photo-challenge.
 * Used by:
 *   - GET /api/photo-challenge/[unique_link]/voucher (PDF download)
 *   - GET /api/photo-challenge/[unique_link]/calendar.ics
 *   - POST /api/photo-challenge/[unique_link]/accept (email attachments)
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { deriveShortCode } from './short-code';
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

export interface VoucherChallengeData {
    id: number;
    unique_link: string;
    inviter_name: string;
    invitee_name: string;
    session_date?: Date | string | null;
    custom_location?: string | null;
    package?: { name: string; challenge_price: number } | null;
    location?: { name: string; address?: string | null; google_maps_url?: string | null } | null;
}

export interface BookingTimes {
    date?: Date | string | null;
    start_time?: string | null;
    end_time?: string | null;
}

export async function generateVoucherPdfBuffer(
    challenge: VoucherChallengeData,
    booking: BookingTimes | null,
    baseUrl: string
): Promise<Buffer> {
    const inviteUrl = `${baseUrl}/foto-wyzwanie/invite/${challenge.unique_link}`;
    const shortCode = deriveShortCode(challenge.unique_link);

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
        : (booking?.start_time || 'godzina do uzgodnienia');

    const locationName = challenge.location?.name || challenge.custom_location || 'Lokalizacja do uzgodnienia';
    const locationAddress = challenge.location?.address || '';

    return await new Promise<Buffer>((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true, font: undefined });
            const chunks: Buffer[] = [];
            doc.on('data', (c: Buffer) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            try {
                const reg = getFontPath('Montserrat-Regular.ttf');
                const bold = getFontPath('Montserrat-Bold.ttf');
                const semi = getFontPath('Montserrat-SemiBold.ttf');
                if (fs.existsSync(reg)) doc.registerFont('M', reg);
                if (fs.existsSync(bold)) doc.registerFont('M-Bold', bold);
                if (fs.existsSync(semi)) doc.registerFont('M-Semi', semi);
            } catch { /* noop */ }
            doc.font('M');

            const W = doc.page.width;
            const H = doc.page.height;

            doc.rect(0, 0, W, 110).fill(COLOR_DARK);
            doc.fillColor(COLOR_GOLD).font('M-Bold').fontSize(11)
                .text(BUSINESS_INFO.nameAscii.toUpperCase() + ' · FOTOGRAFIA', 0, 38, { align: 'center', width: W, characterSpacing: 3 });
            doc.fillColor('#ffffff').font('M').fontSize(9)
                .text(BUSINESS_INFO.siteName, 0, 60, { align: 'center', width: W, characterSpacing: 1 });
            doc.fillColor(COLOR_GOLD).fontSize(8)
                .text('VOUCHER FOTO-WYZWANIA', 0, 82, { align: 'center', width: W, characterSpacing: 6 });

            doc.fillColor(COLOR_DARK).font('M-Bold').fontSize(28)
                .text('Voucher na sesję', 0, 145, { align: 'center', width: W });
            doc.fillColor(COLOR_GOLD).font('M-Semi').fontSize(11)
                .text('— OPŁACONY · POTWIERDZONY —', 0, 185, { align: 'center', width: W, characterSpacing: 4 });

            doc.fillColor(COLOR_MUTED).font('M').fontSize(9)
                .text('OD', 60, 230, { characterSpacing: 3 });
            doc.fillColor(COLOR_DARK).font('M-Bold').fontSize(16)
                .text(challenge.inviter_name, 60, 245, { width: 240 });

            doc.fillColor(COLOR_MUTED).font('M').fontSize(9)
                .text('DLA', 320, 230, { characterSpacing: 3 });
            doc.fillColor(COLOR_DARK).font('M-Bold').fontSize(16)
                .text(challenge.invitee_name, 320, 245, { width: 240 });

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

            y += 4;
            doc.roundedRect(labelX, y, W - 140, 50, 6).fill('#ffffff');
            doc.strokeColor(COLOR_GOLD).lineWidth(0.6).roundedRect(labelX, y, W - 140, 50, 6).stroke();
            doc.fillColor(COLOR_MUTED).font('M').fontSize(8.5)
                .text('KOD WERYFIKACYJNY', labelX + 16, y + 10, { characterSpacing: 2.5 });
            doc.fillColor(COLOR_GOLD).font('M-Bold').fontSize(20)
                .text(shortCode, labelX + 16, y + 22, { characterSpacing: 6 });

            const qrSize = 110;
            const qrX = (W - qrSize) / 2;
            const qrY = cardY + cardH + 30;
            doc.image(qrPngBuffer, qrX, qrY, { width: qrSize, height: qrSize });
            doc.fillColor(COLOR_MUTED).font('M').fontSize(8.5)
                .text('Zeskanuj, aby otworzyć stronę zaproszenia', 0, qrY + qrSize + 8,
                    { align: 'center', width: W, characterSpacing: 1 });

            const footerY = H - 110;
            doc.rect(0, footerY, W, 110).fill(COLOR_DARK);
            doc.fillColor('#ffffff').font('M-Semi').fontSize(10)
                .text(BUSINESS_INFO.nameAscii, 60, footerY + 22);
            doc.fillColor('#bdbdbd').font('M').fontSize(9)
                .text(BUSINESS_INFO.regionAscii + ' - sesje plenerowe', 60, footerY + 38);
            doc.text(BUSINESS_INFO.phone + '  ·  ' + BUSINESS_INFO.email, 60, footerY + 52);
            doc.fillColor(COLOR_GOLD).fontSize(8)
                .text('NIP ' + BUSINESS_INFO.nip, 60, footerY + 70, { characterSpacing: 1.5 });

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
}

// ============ ICS ============

function pad(n: number): string { return n.toString().padStart(2, '0'); }

function toIcsDate(date: Date): string {
    return (
        date.getUTCFullYear().toString() +
        pad(date.getUTCMonth() + 1) +
        pad(date.getUTCDate()) +
        'T' +
        pad(date.getUTCHours()) +
        pad(date.getUTCMinutes()) +
        pad(date.getUTCSeconds()) +
        'Z'
    );
}

function escapeIcs(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

function fold(line: string): string {
    if (line.length <= 75) return line;
    const out: string[] = [];
    let i = 0;
    while (i < line.length) {
        out.push((i === 0 ? '' : ' ') + line.slice(i, i + 73));
        i += 73;
    }
    return out.join('\r\n');
}

export function generateIcs(
    challenge: VoucherChallengeData,
    booking: BookingTimes | null,
    baseUrl: string
): string | null {
    const sessionDate = booking?.date || challenge.session_date;
    if (!sessionDate) return null;

    const dateOnly = new Date(sessionDate);
    const [sh = 12, sm = 0] = (booking?.start_time || '12:00').split(':').map(n => parseInt(n, 10));
    const [eh = sh + 1, em = sm] = (booking?.end_time || `${sh + 1}:${pad(sm)}`).split(':').map(n => parseInt(n, 10));

    const yyyy = dateOnly.getUTCFullYear();
    const mm = dateOnly.getUTCMonth();
    const dd = dateOnly.getUTCDate();

    const isDst = (() => {
        const lastSundayOfMarch = new Date(Date.UTC(yyyy, 2, 31));
        lastSundayOfMarch.setUTCDate(31 - lastSundayOfMarch.getUTCDay());
        const lastSundayOfOctober = new Date(Date.UTC(yyyy, 9, 31));
        lastSundayOfOctober.setUTCDate(31 - lastSundayOfOctober.getUTCDay());
        const local = new Date(Date.UTC(yyyy, mm, dd));
        return local >= lastSundayOfMarch && local < lastSundayOfOctober;
    })();
    const offsetHours = isDst ? 2 : 1;

    const startUtc = new Date(Date.UTC(yyyy, mm, dd, sh - offsetHours, sm, 0));
    const endUtc = new Date(Date.UTC(yyyy, mm, dd, eh - offsetHours, em, 0));

    const inviteUrl = `${baseUrl}/foto-wyzwanie/invite/${challenge.unique_link}`;
    const shortCode = deriveShortCode(challenge.unique_link);
    const summary = `Sesja Foto-Wyzwanie · ${challenge.package?.name || ''}`.trim();
    const locationStr = challenge.location?.address
        ? `${challenge.location.name} — ${challenge.location.address}`
        : (challenge.location?.name || challenge.custom_location || 'Lokalizacja do uzgodnienia');
    const description =
        `Sesja zaproszeniowa od ${challenge.inviter_name} dla ${challenge.invitee_name}.\n` +
        `Pakiet: ${challenge.package?.name || ''}\n` +
        `Kod weryfikacyjny: ${shortCode}\n` +
        `Szczegóły: ${inviteUrl}\n` +
        `Kontakt: ${BUSINESS_INFO.name}, ${BUSINESS_INFO.phone}` + `\n` +
        `Sesja w plenerze - dokladne miejsce ustalamy indywidualnie z fotografem.`;

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:-//${BUSINESS_INFO.nameAscii}//Foto Wyzwanie//PL`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:foto-wyzwanie-${challenge.id}-${challenge.unique_link.slice(0, 12)}@wlasniewski.pl`,
        `DTSTAMP:${toIcsDate(new Date())}`,
        `DTSTART:${toIcsDate(startUtc)}`,
        `DTEND:${toIcsDate(endUtc)}`,
        fold(`SUMMARY:${escapeIcs(summary)}`),
        fold(`LOCATION:${escapeIcs(locationStr)}`),
        fold(`DESCRIPTION:${escapeIcs(description)}`),
        fold(`URL:${inviteUrl}`),
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Przypomnienie: jutro sesja Foto-Wyzwanie',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
    ];
    return lines.join('\r\n');
}
