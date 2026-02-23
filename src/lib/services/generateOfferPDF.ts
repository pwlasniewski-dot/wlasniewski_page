import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const getFontPath = (fileName: string) => {
    const localPath = path.join(process.cwd(), 'public', 'fonts', fileName);
    if (fs.existsSync(localPath)) return localPath;
    
    const netlifyPath = path.resolve(__dirname, '..', '..', '..', 'public', 'fonts', fileName);
    if (fs.existsSync(netlifyPath)) return netlifyPath;
    
    const netlifyPathAlt = path.resolve(__dirname, '..', 'public', 'fonts', fileName);
    if (fs.existsSync(netlifyPathAlt)) return netlifyPathAlt;
    
    // Last resort - return path anyway, pdfkit will handle missing fonts
    return localPath;
};

const COLOR_ACCENT = '#c5a059';
const COLOR_DARK = '#1a1a1a';
const COLOR_LIGHT = '#f4efe6';
const COLOR_BORDER = '#eee';
const COLOR_TEXT = '#333333';

interface OfferData {
    title: string;
    subtitle: string;
    contactName: string;
    contactLocation: string;
    contactPhone: string;
    contactEmail: string;
    contactZip: string;
    eventLocation: string;
    eventDate: string;
    eventCount: string;
    eventTeam: string;
    preparations: { before: string; dayOf: string };
    features: string[];
    pricingHeaders: string[];
    pricingRows: Array<{ values: string[]; isHeader?: boolean }>;
    footerPrices: string[];
    deliveryTerms: { t1?: string; t2?: string; t3?: string };
    albumDescription: string;
    sectionVisibility: {
        eventInfo: boolean;
        preparations: boolean;
        features: boolean;
        pricing: boolean;
        album: boolean;
        delivery: boolean;
    };
    labels: any;
    sectionTitles: any;
    recommendationColumnIndex?: number;
    recommendationLabel: string;
    footerCompany: string;
}

export async function generateOfferPDFBuffer(offer: any, generationDate?: string, includeClientSelection: boolean = false): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: 'A4',
                margin: 40,
                bufferPages: true,
                font: undefined // Don't use default fonts
            });

            const chunks: Buffer[] = [];
            
            doc.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on('error', (err) => {
                reject(err);
            });

            // Register fonts - MUST do this before using doc.font()
            let regularFont = 'Montserrat';
            let boldFont = 'Montserrat-Bold';
            let semiboldFont = 'Montserrat-SemiBold';

            try {
                const regularPath = getFontPath('Montserrat-Regular.ttf');
                const boldPath = getFontPath('Montserrat-Bold.ttf');
                const semiboldPath = getFontPath('Montserrat-SemiBold.ttf');

                console.log('[PDF] Registering fonts...');
                console.log('[PDF] Regular path:', regularPath, 'exists:', fs.existsSync(regularPath));
                console.log('[PDF] Bold path:', boldPath, 'exists:', fs.existsSync(boldPath));
                console.log('[PDF] Semibold path:', semiboldPath, 'exists:', fs.existsSync(semiboldPath));

                if (fs.existsSync(regularPath)) {
                    doc.registerFont('Montserrat', regularPath);
                    console.log('[PDF] ✓ Registered Montserrat');
                }
                if (fs.existsSync(boldPath)) {
                    doc.registerFont('Montserrat-Bold', boldPath);
                    console.log('[PDF] ✓ Registered Montserrat-Bold');
                }
                if (fs.existsSync(semiboldPath)) {
                    doc.registerFont('Montserrat-SemiBold', semiboldPath);
                    console.log('[PDF] ✓ Registered Montserrat-SemiBold');
                }
            } catch (e) {
                console.error('[PDF] Font registration error:', e);
                // Don't reject - continue with what we have
            }

            // Set default font - MUST be a registered font
            doc.font('Montserrat');

            // Extract and validate data
            const template = offer.template_data || {};
            
            const data: OfferData = {
                title: template.title || offer.title || 'Oferta',
                subtitle: template.subtitle || '',
                contactName: template.contactName || '',
                contactLocation: template.contactLocation || '',
                contactPhone: template.contactPhone || '',
                contactEmail: template.contactEmail || '',
                contactZip: template.contactZip || '',
                eventLocation: template.eventLocation || '',
                eventDate: template.eventDate || '',
                eventCount: template.eventCount || '',
                eventTeam: template.eventTeam || '',
                preparations: template.preparations || { before: '', dayOf: '' },
                features: Array.isArray(template.features) ? template.features : [],
                pricingHeaders: Array.isArray(template.pricingHeaders) ? template.pricingHeaders : [],
                pricingRows: Array.isArray(template.pricingRows) ? template.pricingRows : [],
                footerPrices: Array.isArray(template.footerPrices) ? template.footerPrices : [],
                deliveryTerms: (template.deliveryTerms && typeof template.deliveryTerms === 'object') ? template.deliveryTerms : {},
                albumDescription: template.albumDescription || '',
                sectionVisibility: template.sectionVisibility || {
                    eventInfo: true,
                    preparations: true,
                    features: true,
                    pricing: true,
                    album: true,
                    delivery: true
                },
                labels: template.labels || {},
                sectionTitles: template.sectionTitles || {},
                recommendationColumnIndex: template.recommendationColumnIndex,
                recommendationLabel: template.recommendationLabel || 'REKOMENDACJA',
                footerCompany: template.footerCompany || ''
            };

            // Helper function for safe string conversion
            const S = (val: any): string => {
                if (val === null || val === undefined) return '';
                if (typeof val === 'string') return val;
                if (typeof val === 'number') return String(val);
                return '';
            };

            // PAGE CONTENT
            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;
            const margins = 40;
            const contentWidth = pageWidth - margins * 2;
            const footerReserve = 55; // Space reserved for footer on each page
            const bottomLimit = pageHeight - margins - footerReserve;

            let yPos = margins;

            // Helper: check if we need a new page, add one if so
            const checkPageBreak = (neededHeight: number): void => {
                if (yPos + neededHeight > bottomLimit) {
                    doc.addPage();
                    yPos = margins;
                }
            };

            // Helper: measure text height
            const measureText = (text: string, opts: { font?: string; size?: number; width?: number } = {}): number => {
                const f = opts.font || regularFont;
                const s = opts.size || 9;
                const w = opts.width || contentWidth;
                doc.font(f, s);
                return doc.heightOfString(text, { width: w });
            };

            // ===== HEADER =====
            checkPageBreak(80);
            doc.font(boldFont, 24).fillColor(COLOR_DARK);
            const titleHeight = doc.heightOfString(S(data.title), { width: contentWidth * 0.65 });
            doc.text(S(data.title), margins, yPos, {
                width: contentWidth * 0.65,
                align: 'left'
            });

            doc.font(semiboldFont, 12).fillColor(COLOR_ACCENT);
            doc.text(S(data.subtitle), margins, yPos + titleHeight + 4, {
                width: contentWidth * 0.65,
                align: 'left'
            });

            // Header right side
            doc.font(boldFont, 11).fillColor(COLOR_DARK);
            doc.text(S(data.contactName), pageWidth - margins - 180, yPos, {
                width: 180,
                align: 'right'
            });

            doc.font(regularFont, 9).fillColor(COLOR_TEXT);
            doc.text(S(data.contactLocation), pageWidth - margins - 180, yPos + 20, { width: 180, align: 'right' });
            doc.text(`Tel: ${S(data.contactPhone)}`, pageWidth - margins - 180, yPos + 32, { width: 180, align: 'right' });
            doc.text(S(data.contactEmail), pageWidth - margins - 180, yPos + 44, { width: 180, align: 'right' });

            yPos += Math.max(titleHeight + 30, 70);

            // Separator line
            doc.strokeColor(COLOR_ACCENT).lineWidth(2);
            doc.moveTo(margins, yPos).lineTo(pageWidth - margins, yPos).stroke();
            yPos += 15;

            // ===== EVENT INFO =====
            if (data.sectionVisibility.eventInfo) {
                checkPageBreak(60);
                doc.rect(margins, yPos, contentWidth, 50).fillAndStroke(COLOR_LIGHT, COLOR_BORDER);
                
                doc.font(regularFont, 9).fillColor(COLOR_DARK);
                const infoY = yPos + 5;
                doc.text(`${S(data.labels.location || 'Lokalizacja')}: ${S(data.eventLocation)}`, margins + 8, infoY);
                doc.text(`${S(data.labels.date || 'Data')}: ${S(data.eventDate)}`, pageWidth / 2, infoY);
                doc.text(`${S(data.labels.count || 'Liczba gości')}: ${S(data.eventCount)}`, margins + 8, infoY + 15);
                doc.text(`${S(data.labels.team || 'Zespół')}: ${S(data.eventTeam)}`, pageWidth / 2, infoY + 15);
                
                yPos += 60;
            }

            // ===== PREPARATIONS =====
            if (data.sectionVisibility.preparations) {
                const colWidth = contentWidth / 2 - 5;
                const beforeText = S(data.preparations.before || '');
                const dayOfText = S(data.preparations.dayOf || '');
                const beforeHeight = beforeText ? measureText(beforeText, { width: colWidth }) : 0;
                const dayOfHeight = dayOfText ? measureText(dayOfText, { width: colWidth }) : 0;
                const prepContentHeight = Math.max(beforeHeight, dayOfHeight) + 25; // +25 for label
                const totalPrepHeight = 35 + prepContentHeight; // section title + content

                checkPageBreak(Math.min(totalPrepHeight, 120)); // Check for at least beginning

                yPos += 10;
                doc.font(semiboldFont, 14).fillColor(COLOR_DARK);
                doc.text(S(data.sectionTitles.preparations || 'Przygotowania'), margins, yPos);
                yPos += 25;

                const prepStartY = yPos;
                doc.font(semiboldFont, 10).text(S(data.labels.prepBefore || 'Przed ślubem'), margins, yPos);
                doc.font(regularFont, 9).text(beforeText, margins, yPos + 15, {
                    width: colWidth,
                    align: 'left'
                });

                doc.font(semiboldFont, 10).text(S(data.labels.prepDay || 'W dniu ślubu'), margins + colWidth + 10, prepStartY);
                doc.font(regularFont, 9).text(dayOfText, margins + colWidth + 10, prepStartY + 15, {
                    width: colWidth,
                    align: 'left'
                });

                yPos += prepContentHeight + 10;
            }

            // ===== FEATURES / STANDARDS =====
            if (data.sectionVisibility.features && data.features.length > 0) {
                checkPageBreak(40);
                yPos += 10;
                doc.font(semiboldFont, 14).fillColor(COLOR_DARK);
                doc.text(S(data.sectionTitles.standards || 'Standardy'), margins, yPos);
                yPos += 20;

                doc.font(regularFont, 9).fillColor(COLOR_TEXT);
                data.features.forEach((feature) => {
                    const featureText = `✓ ${S(feature)}`;
                    const featureHeight = measureText(featureText, { width: contentWidth - 15 });
                    checkPageBreak(featureHeight + 4);
                    doc.font(regularFont, 9).fillColor(COLOR_TEXT);
                    doc.text(featureText, margins + 15, yPos, { width: contentWidth - 15 });
                    yPos += featureHeight + 4;
                });
                yPos += 5;
            }

            // ===== PRICING TABLE =====
            if (data.sectionVisibility.pricing && data.pricingHeaders.length > 0) {
                yPos += 10;
                const colCount = data.pricingHeaders.length;
                const colWidth = contentWidth / colCount;
                const headerRowH = 25;
                const dataRowH = 20;

                // Check if header fits
                checkPageBreak(headerRowH + dataRowH);

                // Headers
                data.pricingHeaders.forEach((header, idx) => {
                    const xPos = margins + idx * colWidth;
                    doc.rect(xPos, yPos, colWidth, headerRowH).stroke(COLOR_BORDER);
                    
                    const isRec = idx === data.recommendationColumnIndex;
                    if (isRec) {
                        doc.fillColor(COLOR_ACCENT).fontSize(7);
                        doc.text(S(data.recommendationLabel), xPos + 2, yPos + 2, {
                            width: colWidth - 4,
                            align: 'center'
                        });
                    }

                    doc.font(boldFont, 10).fillColor(COLOR_DARK);
                    doc.text(S(header), xPos + 2, yPos + (isRec ? 12 : 5), {
                        width: colWidth - 4,
                        align: 'center'
                    });
                });

                yPos += headerRowH;

                // Rows - check page break for each row
                data.pricingRows.forEach((row) => {
                    checkPageBreak(dataRowH);
                    (row.values || []).forEach((val, idx) => {
                        const xPos = margins + idx * colWidth;
                        const isRec = idx === data.recommendationColumnIndex;
                        
                        if (isRec) {
                            doc.rect(xPos, yPos, colWidth, dataRowH).fillAndStroke(COLOR_LIGHT, COLOR_BORDER);
                        } else {
                            doc.rect(xPos, yPos, colWidth, dataRowH).stroke(COLOR_BORDER);
                        }

                        const fontName = row.isHeader ? boldFont : regularFont;
                        doc.font(fontName, 9).fillColor(COLOR_DARK);
                        doc.text(S(val), xPos + 2, yPos + 3, {
                            width: colWidth - 4,
                            align: 'center'
                        });
                    });
                    yPos += dataRowH;
                });

                // Footer prices row
                checkPageBreak(dataRowH);
                data.footerPrices.forEach((price, idx) => {
                    const xPos = margins + idx * colWidth;
                    const isRec = idx === data.recommendationColumnIndex;
                    
                    if (isRec) {
                        doc.rect(xPos, yPos, colWidth, dataRowH).fillAndStroke(COLOR_LIGHT, COLOR_BORDER);
                    } else {
                        doc.rect(xPos, yPos, colWidth, dataRowH).stroke(COLOR_BORDER);
                    }

                    doc.font(semiboldFont, 11).fillColor(COLOR_DARK);
                    doc.text(S(price), xPos + 2, yPos + 3, {
                        width: colWidth - 4,
                        align: 'center'
                    });
                });

                yPos += dataRowH + 10;
            }

            // ===== ALBUM =====
            if (data.sectionVisibility.album && data.albumDescription) {
                const albumText = S(data.albumDescription);
                const albumTextHeight = measureText(albumText, { width: contentWidth - 16 });
                const albumBoxHeight = albumTextHeight + 22; // padding + label
                
                checkPageBreak(albumBoxHeight + 10);
                yPos += 10;
                doc.rect(margins, yPos, contentWidth, albumBoxHeight).stroke(COLOR_BORDER);
                
                doc.font(semiboldFont, 10).fillColor(COLOR_DARK);
                doc.text(S(data.labels.albumAdvantage || 'Albumy') + ':', margins + 8, yPos + 5);
                
                doc.font(regularFont, 9).fillColor(COLOR_TEXT);
                doc.text(albumText, margins + 8, yPos + 18, {
                    width: contentWidth - 16,
                    align: 'left'
                });
                
                yPos += albumBoxHeight + 10;
            }

            // ===== DELIVERY =====
            if (data.sectionVisibility.delivery && Object.keys(data.deliveryTerms).length > 0) {
                checkPageBreak(40);
                yPos += 10;
                doc.font(semiboldFont, 14).fillColor(COLOR_DARK);
                doc.text(S(data.sectionTitles.delivery || 'Dostarczenie'), margins, yPos);
                yPos += 20;

                doc.font(regularFont, 9).fillColor(COLOR_TEXT);
                Object.values(data.deliveryTerms).forEach((term: any) => {
                    if (term) {
                        const termText = `✓ ${S(term)}`;
                        const termHeight = measureText(termText, { width: contentWidth - 15 });
                        checkPageBreak(termHeight + 4);
                        doc.font(regularFont, 9).fillColor(COLOR_TEXT);
                        doc.text(termText, margins + 15, yPos, { width: contentWidth - 15 });
                        yPos += termHeight + 4;
                    }
                });
                yPos += 5;
            }

            // ===== CLIENT SELECTION (Post-Acceptance) =====
            if (includeClientSelection && offer.client_selection && offer.status === 'accepted') {
                const clientSel = offer.client_selection;
                
                checkPageBreak(80);
                yPos += 10;

                doc.rect(margins, yPos, contentWidth, 8).fillAndStroke(COLOR_LIGHT, COLOR_BORDER);
                doc.font(semiboldFont, 14).fillColor(COLOR_DARK);
                doc.text('ZATWIERDZENIE OFERTY', margins + 8, yPos + 2);
                yPos += 25;

                // Show selected packages/children count
                if (clientSel.splitPackageCounts) {
                    checkPageBreak(30);
                    doc.font(semiboldFont, 11).fillColor(COLOR_DARK);
                    doc.text('Zaznaczone pakiety:', margins, yPos);
                    yPos += 15;

                    doc.font(regularFont, 10).fillColor(COLOR_TEXT);
                    const headers = data.pricingHeaders || [];
                    headers.forEach((header, idx) => {
                        if (idx > 0) { // Skip first column (description column)
                            const count = clientSel.splitPackageCounts[idx] || 0;
                            const price = data.footerPrices[idx] || '0 zł';
                            if (count > 0) {
                                checkPageBreak(14);
                                doc.font(regularFont, 10).fillColor(COLOR_TEXT);
                                doc.text(`${S(header)}: ${count} osób (${S(price)})`, margins + 15, yPos);
                                yPos += 12;
                            }
                        }
                    });
                    yPos += 5;
                }

                // Show total price and confirmation date
                checkPageBreak(50);
                yPos += 10;
                doc.rect(margins, yPos, contentWidth, 35).fillAndStroke(COLOR_LIGHT, COLOR_BORDER);
                
                doc.font(semiboldFont, 12).fillColor(COLOR_DARK);
                doc.text('Suma do zapłaty:', margins + 8, yPos + 5);
                
                doc.font(semiboldFont, 16).fillColor(COLOR_ACCENT);
                doc.text(`${clientSel.totalPrice?.toLocaleString('pl-PL')} PLN`, margins + 8, yPos + 17);
                
                doc.font(regularFont, 9).fillColor(COLOR_TEXT);
                doc.text(`Data zatwierdzenia: ${generationDate}`, pageWidth - margins - 150, yPos + 5, {
                    width: 150,
                    align: 'right'
                });

                yPos += 45;
            }

            // ===== FOOTER (drawn on final page) =====
            // If footer won't fit below current content, add a page
            checkPageBreak(40);
            
            // Draw footer at bottom of current (last) page
            const footerY = Math.max(yPos + 15, pageHeight - margins - 35);
            doc.strokeColor(COLOR_BORDER).lineWidth(0.5);
            doc.moveTo(margins, footerY).lineTo(pageWidth - margins, footerY).stroke();

            doc.font(regularFont, 8).fillColor(COLOR_TEXT);
            doc.text(S(data.labels.footerDisclaimer || ''), margins, footerY + 5, { width: contentWidth });
            
            doc.font(semiboldFont, 9).fillColor(COLOR_DARK);
            doc.text(S(data.footerCompany), margins, footerY + 15, { width: contentWidth });

            if (generationDate) {
                doc.font(regularFont, 7).fillColor(COLOR_TEXT);
                doc.text(`Dokument wygenerowany z systemu dnia: ${generationDate}`, margins, footerY + 25, { width: contentWidth });
            }

            doc.end();

        } catch (error) {
            console.error('[PDF] Error in generateOfferPDF:', error);
            reject(error);
        }
    });
}
