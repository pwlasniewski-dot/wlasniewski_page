/**
 * Tworzy kontrakt dla Oskara Liszaja (oferta 68) z PEŁNYM podstawieniem danych,
 * generuje PDF i wgrywa na S3.
 *
 * Uruchom: node internal_scripts/create_contract_oskar.js
 */
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const p = new PrismaClient();

const BANK_ACCOUNT = '97 1140 2004 0000 3202 8378 2010';
const BANK_HOLDER  = 'FOTO-DRON Przemysław Właśniewski';
const BANK_NAME    = 'mBank';

function fmtDatePL(v) {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function generatePDF(content) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Próba wczytania polskiej czcionki
        let useCustomFont = false;
        const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Regular.ttf');
        const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Bold.ttf');
        try {
            if (fs.existsSync(fontPath)) {
                doc.registerFont('Regular', fontPath);
                if (fs.existsSync(fontBoldPath)) doc.registerFont('Bold', fontBoldPath);
                useCustomFont = true;
            }
        } catch { useCustomFont = false; }

        const lines = content.split('\n');
        let i = 0;
        while (i < lines.length) {
            const trimmed = lines[i].trim();
            if (!trimmed) { doc.moveDown(0.4); i++; continue; }

            // strip markdown bold
            const plain = trimmed.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
            const nextPlain = i + 1 < lines.length
                ? lines[i + 1].trim().replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
                : '';

            // Two-column signature row
            if (plain.startsWith('Wykonawca:') && nextPlain.startsWith('Zleceniodawca:')) {
                doc.moveDown(0.5);
                const y = doc.y;
                useCustomFont ? doc.font('Regular').fontSize(10) : doc.font('Helvetica').fontSize(10);
                doc.fillColor('#1f2937');
                doc.text(plain, 50, y, { width: 230 });
                doc.text(nextPlain, 310, y, { width: 235 });
                doc.moveDown(1);
                i += 2;
                continue;
            }

            if (trimmed.startsWith('# ')) {
                const txt = trimmed.slice(2);
                useCustomFont ? doc.font('Bold').fontSize(16) : doc.font('Helvetica-Bold').fontSize(16);
                doc.fillColor('#111827').text(txt, { align: 'center' });
                doc.moveDown(0.3);
            } else if (trimmed.startsWith('## ')) {
                const txt = trimmed.slice(3);
                useCustomFont ? doc.font('Bold').fontSize(13) : doc.font('Helvetica-Bold').fontSize(13);
                doc.fillColor('#1d4ed8').text(txt);
                doc.moveDown(0.2);
            } else if (trimmed.startsWith('### ')) {
                const txt = trimmed.slice(4);
                useCustomFont ? doc.font('Bold').fontSize(11) : doc.font('Helvetica-Bold').fontSize(11);
                doc.fillColor('#374151').text(txt);
                doc.moveDown(0.1);
            } else if (trimmed.startsWith('---')) {
                doc.strokeColor('#d1d5db').lineWidth(0.5)
                   .moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
                doc.moveDown(0.3);
            } else {
                const isBullet = plain.startsWith('- ') || plain.startsWith('* ');
                useCustomFont ? doc.font('Regular').fontSize(10) : doc.font('Helvetica').fontSize(10);
                doc.fillColor('#1f2937');
                if (isBullet) {
                    doc.text('•  ' + plain.slice(2), { indent: 10 });
                } else {
                    doc.text(plain);
                }
                doc.moveDown(0.1);
            }
            i++;
        }

        // Footer
        doc.fontSize(8).fillColor('#9ca3af')
           .text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 50, doc.page.height - 40, {
               align: 'center', width: doc.page.width - 100
           });
        doc.end();
    });
}

async function uploadToS3(buffer, key, contentType) {
    const client = new S3Client({
        region: process.env.AWS_REGION || 'eu-north-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    const bucket = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET;
    await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));
    return `https://${bucket}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`;
}

(async () => {
    // 1. Pobierz ofertę
    const offer = await p.offer.findUnique({ where: { id: 68 }, include: { user: true } });
    if (!offer) { console.error('Brak oferty 68'); process.exit(1); }

    const td  = offer.template_data || {};
    const sel = offer.client_selection || {};

    // 2. Generuj numer umowy
    const year = new Date().getFullYear();
    const lastContract = await p.contract.findFirst({
        where: { contract_number: { startsWith: `UMW-B2C-${year}-` } },
        orderBy: { created_at: 'desc' },
    });
    let nextNum = 1;
    if (lastContract?.contract_number) {
        const parts = lastContract.contract_number.split('-');
        nextNum = parseInt(parts[parts.length - 1], 10) + 1;
    }
    const contract_number = `UMW-B2C-${year}-${String(nextNum).padStart(3, '0')}`;

    // 3. Dane do podstawienia
    const clientName  = offer.user?.name || offer.client_email || '';
    const clientEmail = offer.user?.email || offer.client_email || '';
    const clientPhone = (offer.user)?.phone || td.contactPhone || '';
    const clientAddr  = td.contactAddress || `${td.contactLocation || ''}`;

    const eventDate     = fmtDatePL(offer.session_date || td.eventDate || td.sessionDateIso);
    const eventTime     = offer.session_time || td.sessionTime || td.eventTime || '';
    const eventLocation = offer.session_location || td.eventLocation || '';
    const eventCount    = (sel.childCount ? String(sel.childCount) : '') || (td.eventCount || '');
    const eventTeam     = td.eventTeam || '';
    const totalPrice    = String(sel.totalPrice || offer.total_price || 0);
    const depositAmount = String(Math.round((sel.totalPrice || offer.total_price || 0) * 0.3));
    const depositDueDate = fmtDatePL(new Date(Date.now() + 7 * 86400000));
    const packageDetails = sel.selectedPackage
        ? `**Wybrany pakiet:** ${sel.selectedPackage.name} — ${sel.selectedPackage.price}`
        : '';

    // 4. Treść umowy
    const content = `# UMOWA NA WYKONANIE USŁUGI FOTOGRAFICZNEJ — PRZYJĘCIE URODZINOWE
**Numer umowy:** ${contract_number}
**Data zawarcia:** ${new Date().toLocaleDateString('pl-PL')}

## STRONY UMOWY
**Wykonawca:** FOTO-DRON Przemysław Właśniewski, Płużnica, 87-214 Płużnica, NIP: 8781430365
Numer konta (${BANK_NAME}): **${BANK_ACCOUNT}** — odbiorca: ${BANK_HOLDER}
**Zleceniodawca:** ${clientName}
${clientAddr ? clientAddr + '\n' : ''}E-mail: ${clientEmail} · Tel.: ${clientPhone}

## §1 PRZEDMIOT UMOWY
Przedmiotem umowy jest wykonanie reportażu fotograficznego z **przyjęcia urodzinowego** zgodnie z ofertą **"${offer.title}"**.

**Szczegóły wydarzenia:**
- Miejsce: **${eventLocation}**
- Data: **${eventDate}**
- Godzina rozpoczęcia: **${eventTime}**
- Liczba gości / charakter przyjęcia: **${eventCount}**

${packageDetails}

## §2 ZAKRES USŁUGI
1. Reportaż z przyjęcia: powitanie gości, tort, animacje, wspólne zabawy.
2. Sesja portretowa Jubilata z rodziną i przyjaciółmi.
3. Galeria online z możliwością pobrania zdjęć w pełnej rozdzielczości.

## §3 WYNAGRODZENIE
Strony ustalają wynagrodzenie w kwocie **${totalPrice} PLN** brutto.
- **Zaliczka: ${depositAmount} PLN** — płatna do **${depositDueDate}** przelewem na rachunek Wykonawcy (${BANK_ACCOUNT}, ${BANK_NAME}). Brak wpłaty zaliczki w terminie powoduje unieważnienie rezerwacji terminu wydarzenia.
- Pozostała kwota: w dniu wydarzenia lub bezpośrednio po wydaniu materiałów.

## §4 TERMIN WYDANIA MATERIAŁÓW
Galeria online udostępniona w terminie do 21 dni roboczych od dnia wydarzenia.

## POSTANOWIENIA KOŃCOWE
1. Wszelkie zmiany niniejszej Umowy wymagają formy pisemnej pod rygorem nieważności.
2. W sprawach nieuregulowanych zastosowanie mają przepisy Kodeksu Cywilnego.
3. Spory wynikłe z realizacji niniejszej Umowy strony będą rozstrzygać polubownie, a w razie braku porozumienia – sąd właściwy dla siedziby Wykonawcy.
4. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.

## PRAWA AUTORSKIE I RODO
1. Wykonawca zachowuje autorskie prawa osobiste do wykonanych zdjęć.
2. Zleceniodawca otrzymuje licencję niewyłączną do wykorzystywania zdjęć w celach prywatnych.
3. Wykonawca może wykorzystać wybrane zdjęcia w portfolio, na stronie www.wlasniewski.pl oraz w mediach społecznościowych, chyba że Strony postanowią inaczej w pisemnej adnotacji do Umowy.
4. Administratorem danych osobowych Zleceniodawcy jest Wykonawca. Dane przetwarzane są wyłącznie w celu realizacji niniejszej Umowy zgodnie z RODO.

---

**Wykonawca:** ............................................
**Zleceniodawca:** ............................................
`;

    console.log('Treść umowy (podgląd):');
    console.log(content.substring(0, 600));
    console.log('...');

    // 5. Wygeneruj PDF
    console.log('\nGeneruję PDF...');
    const pdfBuffer = await generatePDF(content);
    console.log(`PDF: ${pdfBuffer.length} bajtów`);

    // 6. Wgraj na S3
    console.log('Wgrywam na S3...');
    const s3Key = `contracts/umowa_${contract_number}.pdf`;
    let pdfUrl = null;
    try {
        pdfUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');
        console.log('S3 URL:', pdfUrl);
    } catch (e) {
        console.warn('Nie udało się wgrać na S3 (sprawdź zmienne AWS w .env.local):', e.message);
        console.warn('Umowa zostanie zapisana bez PDF URL — wygenerujesz go z panelu admina.');
    }

    // 7. Sprawdź czy oferta 68 nie ma już nowej umowy
    const existing = await p.contract.findUnique({ where: { offer_id: 68 } }).catch(() => null);
    let contract;
    if (existing) {
        console.log(`Oferta 68 ma już umowę id=${existing.id} — aktualizuję...`);
        contract = await p.contract.update({
            where: { id: existing.id },
            data: {
                content,
                contract_number,
                status: 'pending',
                deposit_amount: parseInt(depositAmount, 10),
                deposit_due_at: new Date(Date.now() + 7 * 86400000),
                session_date: offer.session_date,
                session_time: offer.session_time || eventTime || null,
                session_location: eventLocation || null,
                ...(pdfUrl ? { pdf_url: pdfUrl } : {}),
            },
        });
    } else {
        contract = await p.contract.create({
            data: {
                offer_id: 68,
                client_id: offer.client_id,
                contract_number,
                content,
                status: 'pending',
                deposit_amount: parseInt(depositAmount, 10),
                deposit_due_at: new Date(Date.now() + 7 * 86400000),
                session_date: offer.session_date,
                session_time: offer.session_time || eventTime || null,
                session_location: eventLocation || null,
                ...(pdfUrl ? { pdf_url: pdfUrl } : {}),
            },
        });
    }

    console.log(`\n✅ SUKCES! Umowa: id=${contract.id}, numer=${contract.contract_number}`);
    console.log(`   Klient: ${clientName} <${clientEmail}>`);
    console.log(`   Data: ${eventDate}, ${eventTime}, ${eventLocation}`);
    console.log(`   Zaliczka: ${depositAmount} PLN do ${depositDueDate}`);
    console.log(`   Kwota: ${totalPrice} PLN`);
    if (pdfUrl) console.log(`   PDF: ${pdfUrl}`);
    else console.log(`   PDF: brak — wygeneruj z panelu /admin/umowy/${contract.id} przyciskiem "Zregeneruj PDF"`);
    console.log(`\n   Panel admina: https://wlasniewski.pl/admin/umowy/${contract.id}`);

    await p.$disconnect();
})();
