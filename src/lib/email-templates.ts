// Elegant email templates for booking confirmations

interface BookingEmailData {
    clientName: string;
    service: string;
    packageName: string;
    date: string;
    time?: string;
    location?: string;
    price: number;
    originalPrice?: number;
    promoCode?: string;
    giftCardCode?: string;
    notes?: string;
    phone?: string;
    email: string;
}

const brandColors = {
    gold: '#d4a853',
    black: '#0a0a0a',
    darkGray: '#18181b',
    lightGray: '#71717a',
    white: '#ffffff',
};

const baseStyles = `
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${brandColors.black}; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${brandColors.darkGray}; }
    .header { background: linear-gradient(135deg, ${brandColors.black} 0%, ${brandColors.darkGray} 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid ${brandColors.gold}; }
    .logo { font-size: 28px; font-weight: 300; color: ${brandColors.white}; letter-spacing: 2px; margin-bottom: 5px; }
    .logo-accent { color: ${brandColors.gold}; font-weight: 600; }
    .tagline { color: ${brandColors.lightGray}; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; }
    .content { padding: 40px 30px; color: ${brandColors.white}; }
    .greeting { font-size: 24px; font-weight: 300; margin-bottom: 20px; }
    .greeting-name { color: ${brandColors.gold}; font-weight: 500; }
    .message { color: ${brandColors.lightGray}; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
    .details-box { background: linear-gradient(180deg, rgba(212, 168, 83, 0.1) 0%, rgba(212, 168, 83, 0.05) 100%); border: 1px solid rgba(212, 168, 83, 0.3); border-radius: 12px; padding: 25px; margin: 30px 0; }
    .details-title { color: ${brandColors.gold}; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; font-weight: 600; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: ${brandColors.lightGray}; font-size: 14px; }
    .detail-value { color: ${brandColors.white}; font-size: 14px; font-weight: 500; text-align: right; }
    .price-highlight { color: ${brandColors.gold}; font-size: 28px; font-weight: 600; }
    .original-price { color: ${brandColors.lightGray}; text-decoration: line-through; font-size: 16px; margin-right: 10px; }
    .discount-badge { background: ${brandColors.gold}; color: ${brandColors.black}; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .notes-box { background: rgba(255,255,255,0.05); border-left: 3px solid ${brandColors.gold}; padding: 15px 20px; margin: 20px 0; }
    .notes-label { color: ${brandColors.gold}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .notes-text { color: ${brandColors.lightGray}; font-size: 14px; line-height: 1.5; }
    .cta-section { text-align: center; padding: 30px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, ${brandColors.gold} 0%, #c49a47 100%); color: ${brandColors.black}; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
    .footer { background: ${brandColors.black}; padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); }
    .footer-text { color: ${brandColors.lightGray}; font-size: 12px; line-height: 1.6; margin-bottom: 15px; }
    .social-links { margin-top: 20px; }
    .social-link { display: inline-block; margin: 0 10px; color: ${brandColors.gold}; text-decoration: none; font-size: 12px; }
    .divider { height: 1px; background: linear-gradient(90deg, transparent, ${brandColors.gold}, transparent); margin: 30px 0; }
`;

export function generateClientEmail(data: BookingEmailData): string {
    const hasDiscount = data.originalPrice && data.originalPrice > data.price;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Potwierdzenie rezerwacji</title>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Przemysław <span class="logo-accent">Właśniewski</span></div>
            <div class="tagline">Fotografia</div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Cześć, <span class="greeting-name">${data.clientName}</span>!
            </div>
            
            <p class="message">
                Dziękuję za zaufanie i rezerwację sesji fotograficznej! 
                Otrzymałem Twoje zgłoszenie i wkrótce skontaktuję się z Tobą, 
                aby potwierdzić wszystkie szczegóły.
            </p>
            
            <div class="details-box">
                <div class="details-title">✨ Szczegóły rezerwacji</div>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Usługa</td>
                        <td style="color: ${brandColors.white}; font-size: 14px; font-weight: 500; text-align: right; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.service}</td>
                    </tr>
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Pakiet</td>
                        <td style="color: ${brandColors.white}; font-size: 14px; font-weight: 500; text-align: right; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.packageName}</td>
                    </tr>
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">📅 Data</td>
                        <td style="color: ${brandColors.gold}; font-size: 14px; font-weight: 600; text-align: right; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.date}</td>
                    </tr>
                    ${data.time ? `
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">🕐 Godzina</td>
                        <td style="color: ${brandColors.white}; font-size: 14px; font-weight: 500; text-align: right; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.time}</td>
                    </tr>
                    ` : ''}
                    ${data.location ? `
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">📍 Miejsce</td>
                        <td style="color: ${brandColors.white}; font-size: 14px; font-weight: 500; text-align: right; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.location}</td>
                    </tr>
                    ` : ''}
                    ${data.promoCode ? `
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">🏷️ Kod rabatowy</td>
                        <td style="color: ${brandColors.gold}; font-size: 14px; font-weight: 600; text-align: right; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.promoCode}</td>
                    </tr>
                    ` : ''}
                    ${data.giftCardCode ? `
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">🎁 Karta podarunkowa</td>
                        <td style="color: ${brandColors.gold}; font-size: 14px; font-weight: 600; text-align: right; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.giftCardCode}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 15px 0;">💰 Do zapłaty</td>
                        <td style="text-align: right; padding: 15px 0;">
                            ${hasDiscount ? `<span style="color: ${brandColors.lightGray}; text-decoration: line-through; font-size: 16px; margin-right: 10px;">${data.originalPrice} zł</span>` : ''}
                            <span style="color: ${brandColors.gold}; font-size: 28px; font-weight: 600;">${data.price} zł</span>
                        </td>
                    </tr>
                </table>
            </div>
            
            ${data.notes ? `
            <div class="notes-box">
                <div class="notes-label">📝 Twoje uwagi</div>
                <div class="notes-text">${data.notes}</div>
            </div>
            ` : ''}
            
            <div class="divider"></div>
            
            <p class="message" style="font-size: 14px;">
                W przypadku pytań, śmiało napisz do mnie lub zadzwoń. 
                Z niecierpliwością czekam na naszą sesję!
            </p>
            
            <div class="cta-section">
                <a href="tel:+48530788694" class="cta-button">📞 Zadzwoń: 530 788 694</a>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Przemysław Właśniewski — Fotografia<br>
                Tel: +48 530 788 694 | Email: przemyslaw@wlasniewski.pl
            </div>
            <div class="social-links">
                <a href="https://www.facebook.com/przemyslaw.wlasniewski.fotografia" class="social-link">Facebook</a>
                <a href="https://www.instagram.com/wlasniewski.pl/" class="social-link">Instagram</a>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

export function generateAdminEmail(data: BookingEmailData): string {
    const hasDiscount = data.originalPrice && data.originalPrice > data.price;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nowa rezerwacja</title>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
            <div class="logo" style="color: #22c55e;">🎉 Nowa Rezerwacja!</div>
            <div class="tagline" style="color: #86efac;">Otrzymałeś nowe zgłoszenie</div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Klient: <span class="greeting-name">${data.clientName}</span>
            </div>
            
            <div class="details-box" style="border-color: rgba(34, 197, 94, 0.3); background: linear-gradient(180deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);">
                <div class="details-title" style="color: #22c55e;">📋 Dane kontaktowe</div>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Imię i nazwisko</td>
                        <td style="color: ${brandColors.white}; font-size: 14px; font-weight: 600; text-align: right; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.clientName}</td>
                    </tr>
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">📧 Email</td>
                        <td style="color: #60a5fa; font-size: 14px; font-weight: 500; text-align: right; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <a href="mailto:${data.email}" style="color: #60a5fa; text-decoration: none;">${data.email}</a>
                        </td>
                    </tr>
                    ${data.phone ? `
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 10px 0;">📞 Telefon</td>
                        <td style="color: #22c55e; font-size: 14px; font-weight: 600; text-align: right; padding: 10px 0;">
                            <a href="tel:${data.phone}" style="color: #22c55e; text-decoration: none;">${data.phone}</a>
                        </td>
                    </tr>
                    ` : ''}
                </table>
            </div>
            
            <div class="details-box">
                <div class="details-title">📸 Szczegóły sesji</div>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Usługa</td>
                        <td style="color: ${brandColors.white}; font-size: 14px; font-weight: 500; text-align: right; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.service}</td>
                    </tr>
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Pakiet</td>
                        <td style="color: ${brandColors.white}; font-size: 14px; font-weight: 500; text-align: right; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.packageName}</td>
                    </tr>
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">📅 Data</td>
                        <td style="color: ${brandColors.gold}; font-size: 16px; font-weight: 600; text-align: right; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.date}</td>
                    </tr>
                    ${data.time ? `
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">🕐 Godzina</td>
                        <td style="color: ${brandColors.white}; font-size: 14px; font-weight: 500; text-align: right; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.time}</td>
                    </tr>
                    ` : ''}
                    ${data.location ? `
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">📍 Miejsce</td>
                        <td style="color: ${brandColors.white}; font-size: 14px; font-weight: 500; text-align: right; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.location}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
            
            ${data.promoCode || data.giftCardCode || hasDiscount ? `
            <div class="details-box" style="border-color: rgba(251, 191, 36, 0.3);">
                <div class="details-title" style="color: #fbbf24;">💰 Płatność</div>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    ${data.originalPrice ? `
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Cena bazowa</td>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; text-align: right; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.originalPrice} zł</td>
                    </tr>
                    ` : ''}
                    ${data.promoCode ? `
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">🏷️ Kod rabatowy</td>
                        <td style="color: #fbbf24; font-size: 14px; font-weight: 600; text-align: right; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.promoCode}</td>
                    </tr>
                    ` : ''}
                    ${data.giftCardCode ? `
                    <tr>
                        <td style="color: ${brandColors.lightGray}; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">🎁 Karta podarunkowa</td>
                        <td style="color: #fbbf24; font-size: 14px; font-weight: 600; text-align: right; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${data.giftCardCode}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="color: ${brandColors.white}; font-size: 16px; font-weight: 600; padding: 15px 0;">SUMA</td>
                        <td style="color: #22c55e; font-size: 24px; font-weight: 700; text-align: right; padding: 15px 0;">${data.price} zł</td>
                    </tr>
                </table>
            </div>
            ` : `
            <div style="text-align: center; padding: 20px; background: rgba(34, 197, 94, 0.1); border-radius: 12px; margin: 20px 0;">
                <div style="color: ${brandColors.lightGray}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Kwota do zapłaty</div>
                <div style="color: #22c55e; font-size: 36px; font-weight: 700; margin-top: 5px;">${data.price} zł</div>
            </div>
            `}
            
            ${data.notes ? `
            <div class="notes-box">
                <div class="notes-label">📝 Uwagi klienta</div>
                <div class="notes-text">${data.notes}</div>
            </div>
            ` : ''}
            
            <div class="cta-section">
                <a href="https://wlasniewski.pl/admin/bookings" class="cta-button" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white;">
                    👉 Zarządzaj rezerwacją
                </a>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text" style="color: ${brandColors.lightGray};">
                Email wygenerowany automatycznie przez system rezerwacji<br>
                ${new Date().toLocaleString('pl-PL')}
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

// ============================================
// PHOTO CHALLENGE EMAILS
// ============================================

interface ChallengeEmailData {
    inviterName: string;
    inviteeName: string;
    inviterEmail?: string;
    inviteeEmail?: string;
    link: string;
    packageName: string;
    locationName?: string;
    dates?: string[];
}

export function generateChallengeInviteEmail(data: ChallengeEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Zaproszenie do Foto Wyzwania</title>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Foto <span class="logo-accent">Wyzwanie</span></div>
        </div>
        <div class="content">
            <div class="greeting">
                Hej <span class="greeting-name">${data.inviteeName}</span>!
            </div>
            <p class="message">
                <span class="greeting-name">${data.inviterName}</span> rzucił Ci wyzwanie! 🎉<br><br>
                Zaprasza Cię na wspólną sesję fotograficzną. Ma to być prezent dla Was obojga.
            </p>
            <div class="details-box">
                <div class="details-title">📸 Szczegóły Wyzwania</div>
                <div class="detail-row">
                    <span class="detail-label">Pakiet</span>
                    <span class="detail-value">${data.packageName}</span>
                </div>
                ${data.locationName ? `
                <div class="detail-row">
                    <span class="detail-label">Lokalizacja</span>
                    <span class="detail-value">${data.locationName}</span>
                </div>
                ` : ''}
                <div class="cta-section">
                    <a href="${data.link}" class="cta-button">👉 Zobacz i Zaakceptuj</a>
                </div>
            </div>
        </div>
        <div class="footer">
            <div class="footer-text">
                Foto Wyzwanie @ Przemysław Właśniewski
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

export function generateChallengeCreatedEmail(data: ChallengeEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Utworzyłeś wyzwanie!</title>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Foto <span class="logo-accent">Wyzwanie</span></div>
        </div>
        <div class="content">
            <div class="greeting">
                Cześć <span class="greeting-name">${data.inviterName}</span>!
            </div>
            <p class="message">
                Twoje wyzwanie dla <span class="greeting-name">${data.inviteeName}</span> zostało utworzone.<br>
                Wysłaliśmy zaproszenie na podany adres email.
            </p>
            <div class="details-box">
                <div class="details-title">📅 Proponowane Terminy</div>
                ${data.dates?.map(d => `<div class="detail-row"><span class="detail-value">${d}</span></div>`).join('')}
            </div>
            <div class="cta-section">
                <a href="${data.link}" class="cta-button">📊 Sprawdź Status</a>
            </div>
        </div>
        <div class="footer">
            <div class="footer-text">
                Foto Wyzwanie @ Przemysław Właśniewski
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

export function generateChallengeAcceptedEmail(data: ChallengeEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Wyzwanie Zaakceptowane!</title>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Wyzwanie <span class="logo-accent">Zaakceptowane!</span></div>
        </div>
        <div class="content">
            <div class="greeting">
                <span class="greeting-name">${data.inviteeName}</span> przyjął wyzwanie! 🎉
            </div>
            <p class="message">
                Gratulacje! Wasza sesja wkrótce się odbędzie. Skontaktuję się z Wami, aby potwierdzić ostateczny termin.
            </p>
            <div class="cta-section">
                <a href="${data.link}" class="cta-button">📊 Zobacz szczegóły</a>
            </div>
        </div>
        <div class="footer">
             <div class="footer-text">
                Foto Wyzwanie @ Przemysław Właśniewski
            </div>
        </div>
    </div>
</body>
</html>
    `;
}
