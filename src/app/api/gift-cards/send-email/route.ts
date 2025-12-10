import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Gift card ID is required' }, { status: 400 });
        }

        // Fetch gift card
        const giftCard = await prisma.giftCard.findUnique({
            where: { id: parseInt(id) }
        });

        if (!giftCard) {
            return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
        }

        // Prepare email content
        const discountText = giftCard.discount_type === 'percentage'
            ? `${giftCard.amount}% zniżki`
            : `${giftCard.amount} PLN zniżki`;

        const validUntilText = giftCard.valid_until
            ? `Voucher ważny do: ${new Date(giftCard.valid_until).toLocaleDateString('pl-PL')}`
            : 'Voucher bezterminowy';

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 40px 20px; text-center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .card-preview { background: linear-gradient(135deg, #000 0%, #1a1a1a 50%, #886000 100%); border: 3px solid #d4af37; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .card-title { color: #d4af37; font-size: 16px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 15px; }
        .card-name { color: #d4af37; font-size: 32px; font-style: italic; margin: 20px 0; }
        .card-code { background: rgba(0,0,0,0.3); border: 1px solid #d4af37; color: white; padding: 12px 20px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 16px; display: inline-block; margin: 15px 0; }
        .card-discount { color: white; font-size: 20px; font-weight: bold; margin: 15px 0; }
        .card-footer { color: #d4af37; font-size: 11px; letter-spacing: 2px; margin-top: 20px; opacity: 0.8; }
        .instructions { background: #f9f9f9; border-left: 4px solid #d4af37; padding: 20px; margin: 20px 0; }
        .instructions h2 { margin: 0 0 10px; font-size: 18px; color: #333; }
        .instructions p { margin: 8px 0; color: #666; line-height: 1.6; }
        .code-highlight { background: #fffbf0; padding: 3px 8px; border-radius: 4px; font-family: 'Courier New', monospace; color: #886000; font-weight: bold; }
        .footer { padding: 30px; text-align: center; background: #f9f9f9; border-top: 1px solid #e0e0e0; }
        .footer p { margin: 5px 0; color: #999; font-size: 13px; }
        .footer a { color: #d4af37; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎁 Voucher Podarunkowy</h1>
            <p>Przemysław Właśniewski Fotografia</p>
        </div>
        
        <div class="content">
            <p class="greeting">Witaj, <strong>${giftCard.recipient_name}</strong>!</p>
            
            <p>Otrzymałeś/aś wyjątkowy voucher rabatowy na sesję fotograficzną.</p>
            
            <div class="card-preview">
                <div class="card-title">BON PODARUNKOWY</div>
                <div class="card-name">${giftCard.recipient_name}</div>
                <div class="card-code">KOD: ${giftCard.code}</div>
                <div class="card-discount">${discountText.toUpperCase()}</div>
                <div class="card-footer">© PRZEMYSŁAW WŁAŚNIEWSKI FOTOGRAFIA</div>
            </div>
            
            <div class="instructions">
                <h2>Jak skorzystać z vouchera?</h2>
                <p>1. Wybierz termin sesji na stronie <a href="https://wlasniewski.pl/rezerwacja" style="color: #d4af37;">wlasniewski.pl/rezerwacja</a></p>
                <p>2. Podczas rezerwacji wpisz kod: <span class="code-highlight">${giftCard.code}</span></p>
                <p>3. Rabat zostanie automatycznie naliczony</p>
                <p>4. ${validUntilText}</p>
            </div>
            
            ${giftCard.message ? `<div style="margin: 20px 0; padding: 15px; background: #fffbf0; border-radius: 8px; font-style: italic; color: #666;">"${giftCard.message}"</div>` : ''}
            
            <p style="margin-top: 30px; color: #666;">Masz pytania? Skontaktuj się ze mną:</p>
            <p style="color: #666;">📧 <a href="mailto:pwlasniewski@gmail.com" style="color: #d4af37;">pwlasniewski@gmail.com</a></p>
            <p style="color: #666;">📱 <a href="tel:+48530788694" style="color: #d4af37;">+48 530 788 694</a></p>
        </div>
        
        <div class="footer">
            <p><strong>Przemysław Właśniewski Fotografia</strong></p>
            <p><a href="https://wlasniewski.pl">wlasniewski.pl</a></p>
            <p>Toruń, Polska</p>
        </div>
    </div>
</body>
</html>
        `;

        // Send email
        await sendEmail({
            to: giftCard.recipient_email,
            subject: `🎁 Twój Voucher Podarunkowy - ${discountText}`,
            html: htmlContent
        });

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('[Gift Card Email] Error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
