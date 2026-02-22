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

export async function generateOfferPDFBuffer(offer: any, generationDate?: string): Promise<Buffer> {
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

            let yPos = margins;

            // ===== HEADER =====
            doc.font(boldFont, 24).fillColor(COLOR_DARK);
            doc.text(S(data.title), margins, yPos, {
                width: contentWidth * 0.65,
                height: 40,
                align: 'left'
            });

            doc.font(semiboldFont, 12).fillColor(COLOR_ACCENT);
            doc.text(S(data.subtitle), margins, yPos + 30, {
                width: contentWidth * 0.65,
                align: 'left'
            });

            // Header right side
            doc.font(boldFont, 11).fillColor(COLOR_DARK);
            doc.text(S(data.contactName), pageWidth - margins - 150, yPos, {
                width: 150,
                align: 'right'
            });

            doc.font(regularFont, 9).fillColor(COLOR_TEXT);
            doc.text(S(data.contactLocation), pageWidth - margins - 150, yPos + 20, { width: 150, align: 'right' });
            doc.text(`Tel: ${S(data.contactPhone)}`, pageWidth - margins - 150, yPos + 32, { width: 150, align: 'right' });
            doc.text(S(data.contactEmail), pageWidth - margins - 150, yPos + 44, { width: 150, align: 'right' });

            yPos += 70;

            // Separator line
            doc.strokeColor(COLOR_ACCENT).lineWidth(2);
            doc.moveTo(margins, yPos).lineTo(pageWidth - margins, yPos).stroke();
            yPos += 15;

            // ===== EVENT INFO =====
            if (data.sectionVisibility.eventInfo) {
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
                yPos += 10;
                doc.font(semiboldFont, 14).fillColor(COLOR_DARK);
                doc.text(S(data.sectionTitles.preparations || 'Przygotowania'), margins, yPos);
                yPos += 25;

                const colWidth = contentWidth / 2 - 5;
                doc.font(semiboldFont, 10).text(S(data.labels.prepBefore || 'Przed ślubem'), margins, yPos);
                doc.font(regularFont, 9).text(S(data.preparations.before || ''), margins, yPos + 15, {
                    width: colWidth,
                    align: 'left'
                });

                doc.font(semiboldFont, 10).text(S(data.labels.prepDay || 'W dniu ślubu'), margins + colWidth + 10, yPos);
                doc.font(regularFont, 9).text(S(data.preparations.dayOf || ''), margins + colWidth + 10, yPos + 15, {
                    width: colWidth,
                    align: 'left'
                });

                yPos += 50;
            }

            // ===== FEATURES / STANDARDS =====
            if (data.sectionVisibility.features && data.features.length > 0) {
                yPos += 10;
                doc.font(semiboldFont, 14).fillColor(COLOR_DARK);
                doc.text(S(data.sectionTitles.standards || 'Standardy'), margins, yPos);
                yPos += 20;

                doc.font(regularFont, 9).fillColor(COLOR_TEXT);
                data.features.forEach((feature) => {
                    doc.text(`✓ ${S(feature)}`, margins + 15, yPos);
                    yPos += 12;
                });
                yPos += 5;
            }

            // ===== PRICING TABLE =====
            if (data.sectionVisibility.pricing && data.pricingHeaders.length > 0) {
                yPos += 10;

                const colWidth = contentWidth / data.pricingHeaders.length;
                const tableStartY = yPos;

                // Headers
                data.pricingHeaders.forEach((header, idx) => {
                    const xPos = margins + idx * colWidth;
                    doc.rect(xPos, yPos, colWidth, 25).stroke(COLOR_BORDER);
                    
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

                yPos += 25;

                // Rows
                data.pricingRows.forEach((row) => {
                    (row.values || []).forEach((val, idx) => {
                        const xPos = margins + idx * colWidth;
                        const isRec = idx === data.recommendationColumnIndex;
                        
                        if (isRec) {
                            doc.rect(xPos, yPos, colWidth, 20).fillAndStroke(COLOR_LIGHT, COLOR_BORDER);
                        } else {
                            doc.rect(xPos, yPos, colWidth, 20).stroke(COLOR_BORDER);
                        }

                        const fontName = row.isHeader ? boldFont : regularFont;
                        doc.font(fontName, 9).fillColor(COLOR_DARK);
                        doc.text(S(val), xPos + 2, yPos + 3, {
                            width: colWidth - 4,
                            align: 'center'
                        });
                    });
                    yPos += 20;
                });

                // Footer prices
                data.footerPrices.forEach((price, idx) => {
                    const xPos = margins + idx * colWidth;
                    const isRec = idx === data.recommendationColumnIndex;
                    
                    if (isRec) {
                        doc.rect(xPos, yPos, colWidth, 20).fillAndStroke(COLOR_LIGHT, COLOR_BORDER);
                    } else {
                        doc.rect(xPos, yPos, colWidth, 20).stroke(COLOR_BORDER);
                    }

                    doc.font(semiboldFont, 11).fillColor(COLOR_DARK);
                    doc.text(S(price), xPos + 2, yPos + 3, {
                        width: colWidth - 4,
                        align: 'center'
                    });
                });

                yPos += 20 + 10;
            }

            // ===== ALBUM =====
            if (data.sectionVisibility.album && data.albumDescription) {
                yPos += 10;
                doc.rect(margins, yPos, contentWidth, 40).stroke(COLOR_BORDER);
                
                doc.font(semiboldFont, 10).fillColor(COLOR_DARK);
                doc.text(S(data.labels.albumAdvantage || 'Albumy') + ':', margins + 8, yPos + 5);
                
                doc.font(regularFont, 9).fillColor(COLOR_TEXT);
                doc.text(S(data.albumDescription), margins + 8, yPos + 18, {
                    width: contentWidth - 16,
                    align: 'left'
                });
                
                yPos += 50;
            }

            // ===== DELIVERY =====
            if (data.sectionVisibility.delivery && Object.keys(data.deliveryTerms).length > 0) {
                yPos += 10;
                doc.font(semiboldFont, 14).fillColor(COLOR_DARK);
                doc.text(S(data.sectionTitles.delivery || 'Dostarczenie'), margins, yPos);
                yPos += 20;

                doc.font(regularFont, 9).fillColor(COLOR_TEXT);
                Object.values(data.deliveryTerms).forEach((term: any) => {
                    if (term) {
                        doc.text(`✓ ${S(term)}`, margins + 15, yPos);
                        yPos += 12;
                    }
                });
                yPos += 5;
            }

            // ===== FOOTER =====
            yPos = pageHeight - margins - 30;
            doc.moveTo(margins, yPos).lineTo(pageWidth - margins, yPos).stroke(COLOR_BORDER);
            yPos += 8;

            doc.font(regularFont, 8).fillColor(COLOR_TEXT);
            doc.text(S(data.labels.footerDisclaimer || ''), margins, yPos);
            
            doc.font(semiboldFont, 9).fillColor(COLOR_DARK);
            doc.text(S(data.footerCompany), margins, yPos + 10);

            if (generationDate) {
                doc.font(regularFont, 7).fillColor(COLOR_TEXT);
                doc.text(`Dokument wygenerowany z systemu dnia: ${generationDate}`, margins, yPos + 20);
            }

            doc.end();

        } catch (error) {
            console.error('[PDF] Error in generateOfferPDF:', error);
            reject(error);
        }
    });
}
