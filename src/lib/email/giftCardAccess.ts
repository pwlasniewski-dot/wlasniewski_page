import { sendEmail } from './sender';
import prisma from '@/lib/db/prisma';

const themeConfigs: Record<string, { bgGradient: string; accentColor: string; textColor: string }> = {
    christmas: { bgGradient: 'linear-gradient(135deg, #7f1d1d 0%, #064e3b 100%)', accentColor: '#fca5a5', textColor: '#ffffff' },
    wosp: { bgGradient: 'linear-gradient(135deg, #dc2626 0%, #b45309 100%)', accentColor: '#fcd34d', textColor: '#ffffff' },
    valentines: { bgGradient: 'linear-gradient(135deg, #831843 0%, #7f1d1d 100%)', accentColor: '#fbcfe8', textColor: '#ffffff' },
    easter: { bgGradient: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)', accentColor: '#9333ea', textColor: '#ffffff' },
    halloween: { bgGradient: 'linear-gradient(135deg, #7c2d12 0%, #000000 50%, #7c2d12 100%)', accentColor: '#fdba74', textColor: '#ffffff' },
    'mothers-day': { bgGradient: 'linear-gradient(135deg, #7e22ce 0%, #db2777 100%)', accentColor: '#fef08a', textColor: '#ffffff' },
    'childrens-day': { bgGradient: 'linear-gradient(135deg, #2563eb 0%, #a855f7 50%, #db2777 100%)', accentColor: '#fde047', textColor: '#ffffff' },
    wedding: { bgGradient: 'linear-gradient(135deg, #d8b4fe 0%, #fbcfe8 100%)', accentColor: '#7e22ce', textColor: '#1f2937' },
    birthday: { bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #9333ea 100%)', accentColor: '#fef08a', textColor: '#ffffff' },
    gold: { bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', accentColor: '#d4af37', textColor: '#ffffff' } // Default
};

export async function sendGiftCardAccessEmail(
    customerEmail: string,
    customerName: string,
    giftCard: any,
    accessToken: string,
    recipientName?: string,
    recipientEmail?: string,
    senderName?: string,
    message?: string,
    orderId?: number,
    theme: string = 'gold'
) {
    const accessUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}/karta-podarunkowa/dostep/${accessToken}`;

    // Resolve theme config
    const safeTheme = theme && themeConfigs[theme] ? theme : 'gold';
    const config = themeConfigs[safeTheme];

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
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #000000; color: #ffffff; margin: 0; padding: 0; }
            .wrapper { width: 100%; background-color: #050505; padding: 40px 0; }
            .container { max-width: 600px; margin: 0 auto; background: #111111; border: 1px solid #333; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
            .header { background: #000; padding: 40px; text-align: center; border-bottom: 2px solid #222; }
            .logo img { max-width: 160px; height: auto; display: block; margin: 0 auto; }
            .title { color: #d4af37; font-size: 28px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-top: 25px; }
            .content { padding: 40px; text-align: center; }
            .greeting { font-size: 22px; color: #ffffff; margin-bottom: 25px; font-weight: 500; }
            .text { color: #dddddd; font-size: 16px; line-height: 1.8; margin-bottom: 35px; }
            
            /* Virtual Card Design */
            .gift-card {
                background: ${config.bgGradient};
                border: 2px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                padding: 40px;
                text-align: center;
                margin: 35px 0;
                position: relative;
                box-shadow: 0 10px 30px rgba(0,0,0, 0.4);
                color: ${config.textColor};
            }
            .gift-card-title { color: ${config.textColor}; opacity: 0.9; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; font-weight: bold; margin-bottom: 15px; }
            .gift-card-value { color: ${config.accentColor}; font-size: 56px; font-weight: 800; margin: 15px 0; text-shadow: 0 2px 15px rgba(0,0,0,0.3); }
            .gift-card-code { 
                background: rgba(0,0,0,0.6); 
                color: #ffffff; 
                font-family: 'Consolas', 'Monaco', monospace; 
                font-size: 28px; 
                font-weight: bold;
                letter-spacing: 4px; 
                padding: 20px; 
                border-radius: 12px; 
                border: 2px dashed ${config.accentColor};
                display: inline-block;
                margin-top: 20px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            }

            /* Button */
            .button { 
                display: inline-block; 
                background: #d4af37; 
                color: #000000; 
                padding: 20px 50px; 
                font-size: 18px; 
                font-weight: 800; 
                text-decoration: none; 
                border-radius: 50px; 
                text-transform: uppercase; 
                letter-spacing: 1px;
                transition: all 0.3s;
                box-shadow: 0 5px 25px rgba(212, 175, 55, 0.4);
                margin-top: 20px;
            }
            .button:hover { background: #eeca56; box-shadow: 0 8px 30px rgba(212, 175, 55, 0.6); transform: translateY(-2px); }
            
            .info-box { background: #1a1a1a; border-radius: 12px; padding: 25px; text-align: left; margin: 40px 0; border-left: 4px solid #d4af37; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 12px; }
            .info-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
            .info-label { color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
            .info-val { color: #fff; font-size: 16px; font-weight: 500; }
            
            .footer { background: #050505; padding: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #222; line-height: 1.6; }
            .footer a { color: #888; text-decoration: none; border-bottom: 1px dotted #666; }
        </style>
    </head>
    <body style="background-color: #050505;">
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="Logo" /></div>` : ''}
                    <div class="title">Karta Podarunkowa</div>
                </div>

                <div class="content">
                    <div class="greeting">Cześć ${customerName}!</div>
                    <div class="text">
                        Twój zakup został potwierdzony. Oto Twoja ekskluzywna karta podarunkowa na usługi fotograficzne.
                    </div>

                    <div class="info-box">
                        <div class="info-row">
                            <span class="info-label">Numer Zamówienia</span>
                            <span class="info-val">#${orderId || 'N/A'}</span>
                        </div>
                        ${recipientName ? `
                        <div class="info-row">
                            <span class="info-label">Dla kogo</span>
                            <span class="info-val">${recipientName}</span>
                        </div>` : ''}                       ${senderName ? `
                        <div class="info-row">
                            <span class="info-label">Od kogo</span>
                            <span class="info-val">${senderName}</span>
                        </div>` : ''}
                        ${message ? `
                        <div class="info-row" style="display: block; margin-top: 10px; border-top: 1px solid #333; padding-top: 10px;">
                            <span class="info-label">Wiadomość</span>
                            <div class="info-val" style="margin-top: 5px; font-style: italic;">"${message}"</div>
                        </div>` : ''}
                    </div>

                    <div class="gift-card">
                        <div class="gift-card-title">Wartość Karty</div>
                        <div class="gift-card-value">${giftCard.value || giftCard.amount} PLN</div>
                        <div class="gift-card-title" style="margin-top: 20px;">Twój Unikalny Kod</div>
                        <div class="gift-card-code">${giftCard.code}</div>
                        <p style="color: #666; font-size: 10px; margin-top: 15px;">KOD WAŻNY PRZEZ 12 MIESIĘCY</p>
                    </div>

                    <a href="${accessUrl}" class="button">🖨️ Pobierz Wersję do Druku</a>

                    <div class="text" style="font-size: 12px; margin-top: 30px; color: #666;">
                        Kliknij przycisk powyżej, aby zobaczyć pełną wersję karty przygotowaną do wydruku w wysokiej jakości.
                    </div>
                </div>

                <div class="footer">
                    <p>© PRZEMYSŁAW WŁAŚNIEWSKI FOTOGRAFIA</p>
                    <p>Potrzebujesz pomocy? <a href="mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'kontakt@wlasniewski.pl'}">Napisz do nas</a></p>
                </div>
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
                    subject: `[KOPIA] 🔑 Dostęp do karty podarunkowej dla ${customerName} `,
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
                
                ${message ? `
                <div class="info" style="background: #fffbea;">
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
                    subject: `🎁 Otrzymałeś(aś) Kartę Podarunkową od ${senderName || 'Fotografa'} !`,
                    html: recipientHtml
                });
                console.log(`Gift card email sent to recipient: ${recipientEmail} `);
            } catch (recipientErr) {
                console.error('Failed to send gift card email to recipient:', recipientErr);
            }
        }
    });
}
