export function generateGiftCardEmail(
    recipientName: string,
    code: string,
    value: number,
    theme: string,
    senderName: string,
    message: string,
    logoUrl?: string,
    cardTitle?: string,
    cardDescription?: string
): string {
    const themeConfigs: any = {
        christmas: { bg: '#8b0000', icon: '🎄', title: 'Boże Narodzenie' },
        wosp: { bg: '#dc143c', icon: '💛', title: 'Karta Pomocy' },
        valentines: { bg: '#c71585', icon: '💝', title: 'Walentynki' },
        easter: { bg: '#ffd700', icon: '🐰', title: 'Wielkanoc' },
        halloween: { bg: '#ff8c00', icon: '👻', title: 'Halloween' },
        'mothers-day': { bg: '#9932cc', icon: '💐', title: 'Dzień Matki' },
        'childrens-day': { bg: '#1e90ff', icon: '🎈', title: 'Dzień Dziecka' },
        wedding: { bg: '#dda0dd', icon: '💒', title: 'Ślub' },
        birthday: { bg: '#00ced1', icon: '🎂', title: 'Urodziny' }
    };

    const config = themeConfigs[theme] || themeConfigs.christmas;
    const holidayEmoji = config.icon;
    const backgroundColor = config.bg;

    // Fallback for card title/description
    const displayTitle = cardTitle || 'KARTA PODARUNKOWA';
    const displayDescription = cardDescription || 'Prezent pełen wspomnień';

    return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Twoja Karta Podarunkowa</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <!-- Wrapper -->
                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        
                        <!-- Header / Logo -->
                        <tr>
                            <td align="center" style="padding: 30px 20px; background-color: #1a1a1a;">
                                ${logoUrl ? `<img src="${logoUrl}" alt="Logo" width="120" style="display: block; max-width: 140px; height: auto;">` : '<h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">FOTOGRAFIA</h1>'}
                                <p style="color: #888888; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; margin: 10px 0 0 0;">Przemysław Właśniewski</p>
                            </td>
                        </tr>

                        <!-- Hero Gift Card Visual -->
                        <tr>
                            <td align="center" style="padding: 40px 20px;">
                                <div style="background-color: ${backgroundColor}; border-radius: 20px; width: 440px; min-height: 260px; padding: 30px; color: #ffffff; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.15); position: relative; overflow: hidden;">
                                    
                                    <!-- Decorative Icon -->
                                    <div style="position: absolute; top: 10px; right: 20px; font-size: 60px; opacity: 0.2;">${holidayEmoji}</div>
                                    
                                    <!-- Title -->
                                    <div style="font-size: 22px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">${displayTitle}</div>
                                    <div style="font-size: 13px; opacity: 0.8; margin-bottom: 30px;">${displayDescription}</div>

                                    <!-- Value -->
                                    <div style="margin-bottom: 30px;">
                                        <div style="font-size: 11px; text-transform: uppercase; opacity: 0.7; letter-spacing: 1px;">Wartość karty</div>
                                        <div style="font-size: 48px; font-weight: bold; line-height: 1;">${value} zł</div>
                                    </div>

                                    <!-- Recipient info -->
                                    ${recipientName ? `<div style="font-size: 14px; font-style: italic; opacity: 0.9;">Dla: ${recipientName}</div>` : ''}

                                    <!-- Bottom decoration -->
                                    <div style="position: absolute; bottom: -20px; right: -20px; font-size: 80px; opacity: 0.1;">🎁</div>
                                </div>
                            </td>
                        </tr>

                        <!-- Personalized Message -->
                        ${message ? `
                        <tr>
                            <td align="center" style="padding: 0 40px 30px;">
                                <div style="background-color: #f9f9f9; border-left: 4px solid #d4af37; padding: 20px; text-align: left;">
                                    <p style="margin: 0; font-size: 15px; color: #555555; font-style: italic; line-height: 1.6;">"${message}"</p>
                                    ${senderName ? `<p style="margin: 10px 0 0 0; font-size: 13px; color: #333333; font-weight: bold;">— ${senderName}</p>` : ''}
                                </div>
                            </td>
                        </tr>
                        ` : ''}

                        <!-- The Code - HIGH VISIBILITY -->
                        <tr>
                            <td align="center" style="padding: 20px 40px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fdfdfd; border: 2px dashed #cccccc; border-radius: 12px; padding: 25px;">
                                    <tr>
                                        <td align="center">
                                            <p style="margin: 0 0 10px 0; font-size: 12px; color: #777777; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Twój Indywidualny Kod:</p>
                                            <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; color: #1a1a1a; letter-spacing: 5px; background-color: #eeeeee; padding: 10px 20px; border-radius: 6px; display: inline-block;">${code}</div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Instructions -->
                        <tr>
                            <td align="center" style="padding: 30px 40px;">
                                <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px; text-align: center;">Jak wykorzystać prezent?</h3>
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: left;">
                                    <tr>
                                        <td style="padding: 5px 0; font-size: 14px; color: #555555;">
                                            <strong style="color: #333333;">1.</strong> Skopiuj powyższy kod promocyjny.<br>
                                            <strong style="color: #333333;">2.</strong> Wejdź na stronę <a href="https://wlasniewski.pl/rezerwacja" style="color: #d4af37; text-decoration: none; font-weight: bold;">wlasniewski.pl/rezerwacja</a>.<br>
                                            <strong style="color: #333333;">3.</strong> Wybierz termin i sesję, która Cię interesuje.<br>
                                            <strong style="color: #333333;">4.</strong> Wprowadź kod w polu <strong>"Kod promocyjny"</strong> podczas składania rezerwacji.<br>
                                            <strong style="color: #333333;">5.</strong> Cena zostanie obniżona o wartość Twojego vouchera!
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer Info -->
                        <tr>
                            <td align="center" style="padding: 20px 40px 40px; background-color: #fafafa; border-top: 1px solid #eeeeee;">
                                <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.6;">
                                    Karta jest ważna przez 12 miesięcy od daty zakupu. Voucher można wykorzystać jednorazowo. Nie podlega wymianie na gotówkę.
                                </p>
                                <div style="margin-top: 25px;">
                                    <a href="https://wlasniewski.pl" style="color: #333333; text-decoration: none; font-size: 13px; font-weight: bold;">www.wlasniewski.pl</a>
                                </div>
                            </td>
                        </tr>

                    </table>

                    <!-- Socials / legal footer -->
                    <table border="0" cellpadding="0" cellspacing="0" width="600">
                        <tr>
                            <td align="center" style="padding: 30px 20px; font-size: 11px; color: #999999; line-height: 1.5;">
                                <p style="margin: 0;">Zostałeś odbiorcą tej wiadomości, ponieważ ktoś zakupił dla Ciebie kartę podarunkową u Przemysława Właśniewskiego. Jeśli uważasz, że to pomyłka, prosimy o kontakt.</p>
                                <p style="margin: 10px 0 0 0;">© 2024 Przemysław Właśniewski Fotografia. Wszystkie prawa zastrzeżone.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}
