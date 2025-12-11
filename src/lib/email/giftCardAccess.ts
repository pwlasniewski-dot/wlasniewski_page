import { sendEmail } from './sender';

export async function sendGiftCardAccessEmail(
    customerEmail: string,
    customerName: string,
    giftCard: any,
    accessToken: string,
    recipientName?: string,
    recipientEmail?: string,
    senderName?: string,
    message?: string
) {
    const accessUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}/karta-podarunkowa/dostep/${accessToken}`;

    const html = `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
            .header { background: #8B0000; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { padding: 20px 0; }
            .button { display: inline-block; background: #FFD700; color: black; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .info { background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎁 Twoja Karta Podarunkowa Czeka!</h1>
                <p>Dziękujemy za zakup</p>
            </div>

            <div class="content">
                <p>Cześć <strong>${customerName}</strong>,</p>

                <p>Twoja karta podarunkowa o wartości <strong>${giftCard.value || giftCard.amount} PLN</strong> jest już gotowa!</p>

                <div class="info">
                    <p><strong>Kod promocyjny:</strong> ${giftCard.code}</p>
                    <p>Karta jest ważna przez 12 miesięcy od daty zakupu.</p>
                </div>

                <p>Możesz teraz:</p>
                <ul>
                    <li>Wydrukować kartę</li>
                    <li>Wysłać kartę mailem komuś bliskim</li>
                    <li>Udostępnić kod promocyjny</li>
                </ul>

                <p style="text-align: center; margin: 30px 0;">
                    <a href="${accessUrl}" class="button">Przejdź do Mojej Karty →</a>
                </p>

                <div class="info">
                    <p><strong>⚠️ Ważne:</strong> Dostęp do karty jest dostępny przez 30 dni. Upewnij się, że pobierzesz lub wyślesz kartę w tym czasie.</p>
                </div>

                <p>Jeśli masz pytania, skontaktuj się z nami na <strong>kontakt@wlasniewski.pl</strong></p>
            </div>

            <div class="footer">
                <p>Fotografia Przemysław Właśniewski</p>
                <p>© 2024 Wszystkie prawa zastrzeżone</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        await sendEmail({
            to: customerEmail,
            subject: `✅ Twoja Karta Podarunkowa jest gotowa - ${giftCard.code}`,
            html
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to send access email:', error);
        throw error;
    }
}
