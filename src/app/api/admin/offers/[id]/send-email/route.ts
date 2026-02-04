import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import nodemailer from 'nodemailer';

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
                        include: { items: true }
                    }
                }
            });

            if (!offer) {
                return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
            }

            const recipientEmail = offer.user?.email || offer.client_email;
            if (!recipientEmail) {
                return NextResponse.json({ error: 'No client email found' }, { status: 400 });
            }

            // Email configuration
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });

            // Build offer summary for email
            const offerSummary = offer.sections.map(section => {
                const items = section.items.map(item =>
                    `- ${item.title}: ${item.price} PLN x ${item.quantity}`
                ).join('\n');
                return `\n${section.title}:\n${items}`;
            }).join('\n');

            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: recipientEmail,
                cc: 'pwlasniewski@gmail.com', // Always CC admin
                subject: `Oferta ${offer.offerNumber || `#${offer.id}`}: ${offer.title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Oferta: ${offer.title}</h2>
                        <p><strong>Numer:</strong> ${offer.offerNumber || `#${offer.id}`}</p>
                        <p><strong>Typ:</strong> ${offer.type === 'b2c' ? 'B2C' : 'B2B'}</p>
                        <p><strong>Kategoria:</strong> ${offer.category || 'N/A'}</p>
                        
                        <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #c5a059; margin: 20px 0;">
                            <h3>Zakres usług:</h3>
                            <pre style="white-space: pre-wrap;">${offerSummary}</pre>
                        </div>

                        <p><strong>Cena łączna:</strong> ${offer.total_price} PLN</p>
                        
                        ${offer.pdf_url ? `<p><a href="${offer.pdf_url}" style="display: inline-block; background: #c5a059; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pobierz PDF</a></p>` : ''}
                        
                        <p>W razie pytań proszę o kontakt.</p>
                        <p>Pozdrawiam,<br><strong>Przemysław Właśniewski</strong><br>pwlasniewski@gmail.com</p>
                    </div>
                `
            });

            // Update offer status
            await prisma.offer.update({
                where: { id: offerId },
                data: { status: 'sent' }
            });

            return NextResponse.json({ success: true, message: 'Email sent' });
        } catch (error) {
            console.error('Error sending email:', error);
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }
    });
}
