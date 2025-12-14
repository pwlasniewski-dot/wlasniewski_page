import { sendEmail } from './sender';
import prisma from '@/lib/db/prisma';

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

    // Fetch logo from settings
    let logoUrl = '';
    try {
        const logoSetting = await prisma.setting.findFirst({
            where: { setting_key: 'logo_url' }
        });
        if (logoSetting?.setting_value) {
            // Ensure absolute URL
            logoUrl = logoSetting.setting_value.startsWith('http')
                ? logoSetting.setting_value
                : `${process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}${logoSetting.setting_value}`;
        }
    } catch (error) {
        console.error('Error fetching logo:', error);
    }

    const html = `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .logo { margin-bottom: 20px; }
            .logo img { max-width: 100px; height: auto; }
            .photographer-name { font-size: 18px; font-weight: bold; letter-spacing: 1px; margin: 15px 0 5px 0; }
            .photographer-title { font-size: 12px; color: #ddd; letter-spacing: 2px; }
            .content { padding: 20px 0; }
            .button { display: inline-block; background: #FFD700; color: black; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .info { background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #FFD700; }
            .code-box { background: #f0f0f0; padding: 15px; border-radius: 6px; text-align: center; font-family: monospace; font-size: 18px; font-weight: bold; color: #FFD700; margin: 15px 0; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="Logo" /></div>` : ''}
                <div class="photographer-name">PRZEMYSŁAW WŁAŚNIEWSKI</div>
                <div class="photographer-title">📸 FOTOGRAFIA</div>
            </div>

            <div class="content">
                <p>Cześć <strong>${customerName}</strong>,</p>

                <p>Dziękujemy za zakup! Twoja karta podarunkowa o wartości <strong>${giftCard.value || giftCard.amount} PLN</strong> jest już gotowa!</p>

                ${recipientName ? `
                <div class="info" style="background: #fffbea; border-left-color: #FFD700;">
                    <p style="margin-top: 0;"><strong>🎁 Informacja o odbiorcy:</strong></p>
                    <p style="margin: 10px 0;">Karta przewidziana dla: <strong>${recipientName}</strong></p>
                    ${recipientEmail ? `<p style="margin: 10px 0;">Email odbiorcy: <strong>${recipientEmail}</strong></p>` : ''}
                    ${senderName ? `<p style="margin: 10px 0;">Od: <strong>${senderName}</strong></p>` : ''}
                    ${message ? `<p style="margin: 10px 0;"><em>"${message}"</em></p>` : ''}
                </div>
                ` : ''}

                <h3>🎁 Kod Promocyjny:</h3>
                <div class="code-box">${giftCard.code}</div>

                <div class="info">
                    <p><strong>⏰ Ważność:</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>30 dni dostępu do karty podarunkowej online</li>
                        <li>12 miesięcy do wykorzystania kodu promocyjnego</li>
                    </ul>
                </div>

                <p><strong>Możesz teraz:</strong></p>
                <ul>
                    <li>✅ Wydrukować kartę w wysokiej jakości</li>
                    <li>📧 Wysłać kartę mailem komuś bliskim</li>
                    <li>🔗 Udostępnić link do karty</li>
                </ul>

                <p style="margin: 30px 0; text-align: center;">
                    <a href="${accessUrl}" class="button">📲 Przejdź do Mojej Karty</a>
                </p>

                <div class="info">
                    <p><strong>Jak wykorzystać kod?</strong></p>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Skontaktuj się z fotografem</li>
                        <li>Umów sesję fotograficzną</li>
                        <li>Podaj kod promocyjny przy rezerwacji</li>
                        <li>Ciesz się wspaniałymi zdjęciami! 📸</li>
                    </ol>
                </div>
            </div>

            <div class="footer">
                <p>Ta karta jest ważna przez 30 dni. Link do karty wygasa po tym okresie.</p>
                <p>© ${new Date().getFullYear()} PRZEMYSŁAW WŁAŚNIEWSKI FOTOGRAFIA</p>
                <p>Email: <a href="mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'kontakt@wlasniewski.pl'}">${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'kontakt@wlasniewski.pl'}</a></p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: customerEmail,
        subject: `🎁 Twoja Karta Podarunkowa od PRZEMYSŁAW WŁAŚNIEWSKI FOTOGRAFIA`,
        html
    }).then(async () => {
        // Send to admin
        try {
            const { getAdminEmail } = await import('./sender');
            const adminEmail = await getAdminEmail();
            if (adminEmail) {
                await sendEmail({
                    to: adminEmail,
                    subject: `[KOPIA] 🔑 Dostęp do karty podarunkowej dla ${customerName}`,
                    html: html
                });
            }
        } catch (error) {
            console.error('Failed to send admin copy:', error);
        }

        // Jeśli podano email odbiorcy, wyślij mu również kopię karty
        if (recipientEmail && recipientName) {
            const recipientHtml = `
            <!DOCTYPE html>
            <html lang="pl">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; background: #f5f5f5; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
                    .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
                    .logo { margin-bottom: 20px; }
                    .logo img { max-width: 100px; height: auto; }
                    .photographer-name { font-size: 18px; font-weight: bold; letter-spacing: 1px; margin: 15px 0 5px 0; }
                    .photographer-title { font-size: 12px; color: #ddd; letter-spacing: 2px; }
                    .content { padding: 20px 0; }
                    .button { display: inline-block; background: #FFD700; color: black; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
                    .info { background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #FFD700; }
                    .code-box { background: #f0f0f0; padding: 15px; border-radius: 6px; text-align: center; font-family: monospace; font-size: 18px; font-weight: bold; color: #FFD700; margin: 15px 0; }
                    .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="Logo" /></div>` : ''}
                        <div class="photographer-name">PRZEMYSŁAW WŁAŚNIEWSKI</div>
                        <div class="photographer-title">📸 FOTOGRAFIA</div>
                    </div>

                    <div class="content">
                        <p>Cześć <strong>${recipientName}</strong>,</p>

                        <p>Dostałeś(-aś) wyjątkowy prezent! Karta podarunkowa na sesję fotograficzną o wartości <strong>${giftCard.value || giftCard.amount} PLN</strong>! 🎁</p>

                        ${senderName ? `<p><em>Kartę przesyła: <strong>${senderName}</strong></em></p>` : ''}
                        ${message ? `<div class="info" style="background: #fffbea;">
                            <p style="margin: 0;"><em>"${message}"</em></p>
                        </div>` : ''}

                        <h3>🎁 Twój Kod Promocyjny:</h3>
                        <div class="code-box">${giftCard.code}</div>

                        <div class="info">
                            <p><strong>⏰ Ważność:</strong></p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>30 dni dostępu do karty podarunkowej online</li>
                                <li>12 miesięcy do wykorzystania kodu promocyjnego</li>
                            </ul>
                        </div>

                        <p><strong>Możesz teraz:</strong></p>
                        <ul>
                            <li>✅ Wydrukować kartę w wysokiej jakości</li>
                            <li>📧 Wysłać kartę mailem dalej</li>
                            <li>🔗 Udostępnić link do karty</li>
                        </ul>

                        <p style="margin: 30px 0; text-align: center;">
                            <a href="${accessUrl}" class="button">📲 Przejdź do Mojej Karty</a>
                        </p>

                        <div class="info">
                            <p><strong>Jak wykorzystać kod?</strong></p>
                            <ol style="margin: 10px 0; padding-left: 20px;">
                                <li>Skontaktuj się z fotografem</li>
                                <li>Umów sesję fotograficzną</li>
                                <li>Podaj kod promocyjny przy rezerwacji</li>
                                <li>Ciesz się wspaniałymi zdjęciami! 📸</li>
                            </ol>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Ta karta jest ważna przez 30 dni. Link do karty wygasa po tym okresie.</p>
                        <p>© ${new Date().getFullYear()} PRZEMYSŁAW WŁAŚNIEWSKI FOTOGRAFIA</p>
                        <p>Email: <a href="mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'kontakt@wlasniewski.pl'}">${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'kontakt@wlasniewski.pl'}</a></p>
                    </div>
                </div>
            </body>
            </html>
            `;

            try {
                await sendEmail({
                    to: recipientEmail,
                    subject: `🎁 Otrzymałeś(aś) Kartę Podarunkową od ${senderName || 'Fotografa'}!`,
                    html: recipientHtml
                });
                console.log(`Gift card email sent to recipient: ${recipientEmail}`);
            } catch (recipientErr) {
                console.error('Failed to send gift card email to recipient:', recipientErr);
            }
        }
    });
}
