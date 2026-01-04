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

    const { generateGiftCardEmail } = await import('./giftCardTemplate');

    const html = generateGiftCardEmail(
        recipientName || customerName,
        giftCard.code,
        Math.round(giftCard.value || giftCard.amount),
        theme || giftCard.theme || 'gold',
        senderName || 'Fotograf',
        message || '',
        logoUrl,
        giftCard.card_title,
        giftCard.card_description
    );

    // Add access button to the HTML (injecting into the template)
    const finalHtml = html.replace(
        '<!-- INJECT_ACCESS_BUTTON -->',
        `<div style="margin-top: 30px; text-align: center;">
            <a href="${accessUrl}" style="display: inline-block; background: #d4af37; color: #000; padding: 18px 45px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; text-transform: uppercase; letter-spacing: 2px;">
                POBIERZ WERSJĘ DO DRUKU
            </a>
        </div>`
    );

    return sendEmail({
        to: customerEmail,
        subject: `🎁 Twoja Karta Podarunkowa od PRZEMYSŁAW WŁAŚNIEWSKI FOTOGRAFIA`,
        html: finalHtml
    }).then(async () => {
        // Send to admin
        try {
            const { getAdminEmail } = await import('./sender');
            const adminEmail = await getAdminEmail();
            if (adminEmail) {
                await sendEmail({
                    to: adminEmail,
                    subject: `[KOPIA] 🔑 Dostęp do karty podarunkowej dla ${customerName}`,
                    html: finalHtml
                });
            }
        } catch (error) {
            console.error('Failed to send admin copy:', error);
        }

        // Jeśli podano email odbiorcy, wyślij mu również tę samą kartę premium
        if (recipientEmail && recipientName && recipientEmail !== customerEmail) {
            try {
                await sendEmail({
                    to: recipientEmail,
                    subject: `🎁 Otrzymałeś(aś) Kartę Podarunkową od ${senderName || customerName}!`,
                    html: finalHtml
                });
            } catch (recipientErr) {
                console.error('Failed to send gift card email to recipient:', recipientErr);
            }
        }
    });
}
