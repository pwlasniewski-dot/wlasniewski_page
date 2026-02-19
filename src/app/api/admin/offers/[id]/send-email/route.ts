import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';

// POST /api/admin/offers/[id]/send-email
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const params = await context.params;
            const offerId = parseInt(params.id);

            const offer = await prisma.offer.findUnique({
                where: { id: offerId },
                include: {
                    user: true,
                    sections: {
                        include: { items: true },
                        orderBy: { order: 'asc' }
                    }
                }
            });

            if (!offer) {
                return NextResponse.json({ error: 'Oferta nie znaleziona' }, { status: 404 });
            }

            const recipientEmail = offer.client_email || offer.user?.email;
            if (!recipientEmail) {
                return NextResponse.json({ error: 'Brak adresu e-mail klienta' }, { status: 400 });
            }

            // Build offer summary for email
            let offerSummaryHtml = '';

            // CASE 1: Offer from A4 Builder (template_data)
            if (offer.template_data && typeof offer.template_data === 'object') {
                const td = offer.template_data as any;

                // Pricing Rows (The "offer items" in A4 builder)
                if (Array.isArray(td.pricingRows) && Array.isArray(td.pricingHeaders)) {
                    const recIdx = td.recommendationColumnIndex !== undefined ? td.recommendationColumnIndex : -1;
                    const recLabel = td.recommendationLabel || 'Rekomendowany';

                    offerSummaryHtml += `
                        <div style="overflow-x: auto;">
                            <table class="pricing-table">
                                <thead>
                                    <tr>
                                        ${td.pricingHeaders.map((h: string, idx: number) => {
                        const isRec = idx === recIdx;
                        const style = isRec
                            ? 'background: #f4efe6; border: 2px solid #c5a059; border-bottom: none; color: #1a1a1a;'
                            : 'background: #f9fafb; color: #4b5563;';

                        // Badge for recommended
                        const badge = isRec ? `<div style="background: #c5a059; color: white; display: inline-block; padding: 2px 6px; font-size: 9px; text-transform: uppercase; border-radius: 2px; margin-bottom: 5px;">${recLabel}</div><br>` : '';

                        return `<th class="pricing-th" style="${style}">${badge}${h}</th>`;
                    }).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                    `;

                    td.pricingRows.forEach((row: any) => {
                        offerSummaryHtml += `<tr>`;
                        row.values?.forEach((val: string, idx: number) => {
                            const isRec = idx === recIdx;
                            // Cell styles
                            let cellStyle = 'padding: 10px; border: 1px solid #eee; text-align: center; vertical-align: middle; font-size: 11px;';
                            if (idx === 0) cellStyle += ' text-align: left; font-weight: 600; color: #111827;';
                            else cellStyle += ' color: #4b5563;';

                            if (isRec) cellStyle += ' background: #f4efe6; border-left: 2px solid #c5a059; border-right: 2px solid #c5a059;';

                            offerSummaryHtml += `<td style="${cellStyle}">${val || '—'}</td>`;
                        });
                        offerSummaryHtml += `</tr>`;
                    });

                    // Footer Prices if available
                    if (Array.isArray(td.footerPrices)) {
                        offerSummaryHtml += `<tr>`;
                        td.footerPrices.forEach((p: string, idx: number) => {
                            const isRec = idx === recIdx;
                            let cellStyle = 'padding: 10px; border: 1px solid #eee; text-align: center; font-weight: 700; color: #1a1a1a; font-size: 12px;';
                            if (idx === 0) cellStyle += ' text-align: left; color: #111827;';

                            if (isRec) cellStyle += ' background: #f4efe6; border-left: 2px solid #c5a059; border-right: 2px solid #c5a059; border-bottom: 2px solid #c5a059;';

                            offerSummaryHtml += `<td style="${cellStyle}">${idx === 0 ? 'Inwestycja' : p}</td>`;
                        });
                        offerSummaryHtml += `</tr>`;
                    }

                    offerSummaryHtml += `</tbody></table></div>`;
                }

                // Features
                if (Array.isArray(td.features) && td.features.length > 0) {
                    offerSummaryHtml += `
                        <div style="margin-top: 25px;">
                            <h4 style="color: #c5a059; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 5px;">Kluczowe Standardy Współpracy:</h4>
                            <ul style="padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.6;">
                                ${td.features.map((f: string) => `<li style="margin-bottom: 6px;">${f}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }

                // Event info
                if (td.eventDate || td.eventLocation) {
                    offerSummaryHtml += `
                        <div style="margin: 20px 0; padding: 15px; background: #fafafa; border-radius: 6px; font-size: 14px; border: 1px solid #f0f0f0;">
                            <strong>Termin:</strong> ${td.eventDate || 'Do ustalenia'}<br>
                            ${td.eventLocation ? `<strong>Miejsce:</strong> ${td.eventLocation}` : ''}
                        </div>
                    `;
                }
            }
            // CASE 2: Legacy Section-based Offer
            else if (offer.sections.length > 0) {
                offerSummaryHtml = offer.sections.map(section => {
                    const items = section.items.map(item =>
                        `<li style="margin-bottom: 5px;"><strong>${item.title}</strong>: ${item.price} PLN ${item.quantity > 1 ? `x ${item.quantity}` : ''}</li>`
                    ).join('');
                    return `
                        <div style="margin: 15px 0;">
                            <h4 style="color: #c5a059; margin-bottom: 5px;">${section.title}</h4>
                            <ul style="padding-left: 15px; font-size: 14px; color: #4b5563;">${items}</ul>
                        </div>
                    `;
                }).join('');
            } else {
                offerSummaryHtml = "<p style='color: #6b7280; font-style: italic;'>Szczegółowy wykaz usług znajduje się w załączniku PDF.</p>";
            }

            // PDF Attachment
            const attachments = [];
            if (offer.pdf_url) {
                let absolutePdfUrl = offer.pdf_url;
                if (absolutePdfUrl && !absolutePdfUrl.startsWith('http')) {
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
                    absolutePdfUrl = baseUrl + (absolutePdfUrl.startsWith('/') ? absolutePdfUrl : '/' + absolutePdfUrl);
                }

                attachments.push({
                    filename: `Oferta_${offer.offerNumber || offer.id}.pdf`,
                    path: absolutePdfUrl
                });
            }

            await sendEmail({
                to: recipientEmail,
                subject: `✨ Oferta: ${offer.title} (${offer.offerNumber || `#${offer.id}`})`,
                attachments,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
                        <style>
                            body { font-family: 'Montserrat', sans-serif; color: #333; line-height: 1.5; margin: 0; padding: 0; background: #f3f4f6; }
                            .email-container { max-width: 800px; margin: 20px auto; background: #ffffff; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                            
                            /* Header */
                            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #c5a059; padding-bottom: 20px; margin-bottom: 30px; }
                            .header-content { text-align: left; }
                            .header-title { font-family: 'Playfair Display', serif; color: #1a1a1a; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
                            .header-subtitle { color: #c5a059; font-weight: 600; letter-spacing: 1px; font-size: 13px; margin-top: 5px; text-transform: uppercase; }
                            
                            .my-data { text-align: right; font-size: 11px; color: #555; line-height: 1.4; }
                            .my-data strong { color: #1a1a1a; font-size: 13px; display: block; margin-bottom: 2px; }

                            /* Sections */
                            .section-title { font-family: 'Playfair Display', serif; font-size: 16px; color: #1a1a1a; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 25px; margin-bottom: 10px; font-weight: 700; }
                            
                            /* Event Info Grid */
                            .event-info { background: #f4efe6; padding: 15px; border-radius: 4px; font-size: 12px; display: table; width: 100%; }
                            .event-row { display: table-row; }
                            .event-cell { display: table-cell; width: 50%; padding: 4px; }

                            /* Lists */
                            .feature-list { list-style: none; padding: 0; margin: 0; }
                            .feature-list li { padding-left: 20px; position: relative; margin-bottom: 4px; font-size: 12px; }
                            .feature-list li::before { content: "✓"; position: absolute; left: 0; color: #c5a059; font-weight: bold; }

                            /* Table */
                            .pricing-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
                            .pricing-th { background: #f8f8f8; padding: 10px; border: 1px solid #eee; text-align: center; vertical-align: bottom; font-weight: 600; }
                            .pricing-td { padding: 10px; border: 1px solid #eee; text-align: center; vertical-align: middle; }
                            .pricing-td.left { text-align: left; }
                            
                            .rec-active { background: #f4efe6; border-left: 2px solid #c5a059; border-right: 2px solid #c5a059; }
                            .rec-header { border-top: 2px solid #c5a059; border-left: 2px solid #c5a059; border-right: 2px solid #c5a059; position: relative; }
                            .rec-badge { display: block; background: #c5a059; color: white; padding: 2px 5px; font-size: 9px; margin-bottom: 5px; border-radius: 2px; text-transform: uppercase; }

                            /* Footer */
                            .total-price { text-align: center; padding: 20px; background: #fffcf5; border: 1px solid #fef3c7; border-radius: 8px; margin-top: 30px; }
                            .total-label { font-size: 12px; text-transform: uppercase; color: #92400e; font-weight: 600; }
                            .total-amount { font-size: 24px; color: #1a1a1a; font-weight: 700; margin: 5px 0; }
                            
                            .footer { text-align: center; font-size: 10px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
                        </style>
                    </head>
                    <body>
                        <div class="email-container">
                            <!-- Header -->
                            <table style="width: 100%; border-bottom: 3px solid #c5a059; padding-bottom: 15px; margin-bottom: 20px;">
                                <tr>
                                    <td width="60%" valign="top">
                                        <div class="header-title">${offer.title}</div>
                                        <div class="header-subtitle">${offer.type === 'b2c' ? offer.category || 'Fotografia Okolicznościowa' : 'Oferta Biznesowa'}</div>
                                    </td>
                                    <td width="40%" valign="top" style="text-align: right;">
                                        <div class="my-data">
                                            <strong>Przemysław Właśniewski</strong>
                                            Toruń<br>
                                            Tel: 530 788 694<br>
                                            <a href="mailto:pwlasniewski@gmail.com" style="color: #555; text-decoration: none;">pwlasniewski@gmail.com</a>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Greeting -->
                            <p style="font-size: 13px;">Dzień dobry,</p>
                            <p style="font-size: 13px; margin-bottom: 25px;">Przesyłam przygotowaną ofertę współpracy. Poniżej znajdują się szczegóły pakietów oraz standardy realizacji.</p>

                            <!-- Content Injection -->
                            ${offerSummaryHtml}



                            <!-- PDF Call to Action (Conditional) -->
                            ${offer.pdf_url ? `
                                <div style="text-align: center; margin-top: 30px;">
                                    <p style="font-size: 13px;">Pełna wersja oferty znajduje się w załączniku PDF.</p>
                                    <a href="${offer.pdf_url}" style="display: inline-block; background: #c5a059; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 13px;">Pobierz PDF</a>
                                </div>
                            ` : `
                                <div style="text-align: center; margin-top: 30px; font-style: italic; font-size: 12px; color: #777;">
                                    Powyższe zestawienie zawiera pełny zakres oferty.
                                </div>
                            `}

                            <div class="footer">
                                <p>© ${new Date().getFullYear()} Przemysław Właśniewski Fotografia. Wszystkie prawa zastrzeżone.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });

            // Update offer status
            await prisma.offer.update({
                where: { id: offerId },
                data: { status: 'sent' }
            });

            return NextResponse.json({ success: true, message: 'E-mail został wysłany pomyślnie' });
        } catch (error: any) {
            console.error('Error sending offer email:', error);
            return NextResponse.json({
                error: 'Błąd podczas wysyłania e-maila',
                details: error.message
            }, { status: 500 });
        }
    });
}
