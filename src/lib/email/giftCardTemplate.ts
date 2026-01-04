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
        christmas: { bg: 'linear-gradient(135deg, #8b0000 0%, #d42424 100%)', icon: '🎄', title: 'Boże Narodzenie', color: '#ffffff' },
        wosp: { bg: 'linear-gradient(135deg, #dc143c 0%, #ff4d4d 100%)', icon: '❤️', title: 'WOŚP', color: '#ffffff' },
        valentines: { bg: 'linear-gradient(135deg, #c71585 0%, #ff69b4 100%)', icon: '💝', title: 'Walentynki', color: '#ffffff' },
        easter: { bg: 'linear-gradient(135deg, #ffd700 0%, #fffacd 100%)', icon: '🐰', title: 'Wielkanoc', color: '#5b4d00' },
        halloween: { bg: 'linear-gradient(135deg, #ff8c00 0%, #4b0082 100%)', icon: '👻', title: 'Halloween', color: '#ffffff' },
        'mothers-day': { bg: 'linear-gradient(135deg, #9932cc 0%, #ff69b4 100%)', icon: '💐', title: 'Dzień Matki', color: '#ffffff' },
        'childrens-day': { bg: 'linear-gradient(135deg, #1e90ff 0%, #00bfff 100%)', icon: '🎈', title: 'Dzień Dziecka', color: '#ffffff' },
        wedding: { bg: 'linear-gradient(135deg, #dda0dd 0%, #fdf5e6 100%)', icon: '💒', title: 'Ślub', color: '#4a304a' },
        birthday: { bg: 'linear-gradient(135deg, #00ced1 0%, #f0ffff 100%)', icon: '🎂', title: 'Urodziny', color: '#004d4d' }
    };

    const config = themeConfigs[theme] || themeConfigs.christmas;
    const backgroundColor = config.bg;
    const textColor = config.color;

    const displayTitle = (cardTitle || 'KARTA PODARUNKOWA').toUpperCase();
    const displayDescription = cardDescription || 'Prezent pełen wspomnień i emocji';

    return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Twoja Karta Podarunkowa</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <!-- Wrapper -->
                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #141414; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid #222222;">
                        
                        <!-- Header / Logo -->
                        <tr>
                            <td align="center" style="padding: 40px 20px;">
                                ${logoUrl ? `<img src="${logoUrl}" alt="Logo" width="100" style="display: block; max-width: 120px; height: auto;">` : '<h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 4px; font-weight: 300; text-transform: uppercase;">PRZEMYSŁAW WŁAŚNIEWSKI</h1>'}
                                <p style="color: #666666; font-size: 9px; text-transform: uppercase; letter-spacing: 5px; margin: 15px 0 0 0;">FOTOGRAFIA TORUŃ</p>
                            </td>
                        </tr>

                        <!-- Gift Card Visual -->
                        <tr>
                            <td align="center" style="padding: 0 40px 40px;">
                                <div style="background: ${backgroundColor}; border-radius: 16px; width: 440px; min-height: 260px; padding: 35px; color: ${textColor}; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.3); position: relative; overflow: hidden;">
                                    
                                    <!-- Content -->
                                    <div style="position: relative; z-index: 2;">
                                        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 4px; opacity: 0.7; margin-bottom: 25px;">${config.title}</div>
                                        
                                        <div style="font-size: 20px; font-weight: 900; margin-bottom: 8px; letter-spacing: 1px;">${displayTitle}</div>
                                        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 35px; min-height: 40px; font-weight: 500;">${displayDescription}</div>

                                        <div style="margin-bottom: 30px;">
                                            <div style="font-size: 9px; text-transform: uppercase; opacity: 0.6; letter-spacing: 2px; margin-bottom: 5px;">Wartość vouchera</div>
                                            <div style="font-size: 56px; font-weight: 900; line-height: 1;">${value} zł</div>
                                        </div>

                                        ${recipientName ? `<div style="font-size: 14px; font-style: italic; opacity: 1; font-weight: 600;">Dla: ${recipientName}</div>` : ''}
                                    </div>

                                    <!-- Decorative Icon Background -->
                                    <div style="position: absolute; top: -10px; right: -10px; font-size: 120px; opacity: 0.1;">${config.icon}</div>
                                </div>
                            </td>
                        </tr>

                        <!-- The Code -->
                        <tr>
                            <td align="center" style="padding: 0 40px 40px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1a1a; border: 1px solid #333333; border-radius: 12px; padding: 30px;">
                                    <tr>
                                        <td align="center">
                                            <p style="margin: 0 0 15px 0; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 3px; font-weight: bold;">TWÓJ KOD RABATOWY</p>
                                            <div style="font-family: 'Monaco', 'Consolas', monospace; font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: 8px; background-color: #0a0a0a; padding: 15px 30px; border-radius: 8px; border: 1px solid #444444; display: inline-block; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${code}</div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Message -->
                        ${message ? `
                        <tr>
                            <td align="center" style="padding: 0 40px 40px;">
                                <div style="border-left: 2px solid #gold-500; padding: 0 25px; text-align: left;">
                                    <p style="margin: 0; font-size: 15px; color: #bbbbbb; font-style: italic; line-height: 1.8;">"${message}"</p>
                                    ${senderName ? `<p style="margin: 15px 0 0 0; font-size: 12px; color: #ffffff; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">— ${senderName}</p>` : ''}
                                </div>
                            </td>
                        </tr>
                        ` : ''}

                        <!-- Instructions -->
                        <tr>
                            <td style="padding: 40px; background-color: #0d0d0d;">
                                <h3 style="margin: 0 0 20px 0; color: #ffffff; font-size: 16px; text-transform: uppercase; letter-spacing: 2px;">Jak zrealizować?</h3>
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: left; font-size: 13px; color: #999999; line-height: 1.8;">
                                    <tr>
                                        <td style="padding-bottom: 5px;">1. Skopiuj swój indywidualny kod rabatowy.</td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 5px;">2. Wejdź na <a href="https://wlasniewski.pl/rezerwacja" style="color: #ffffff; text-decoration: underline;">wlasniewski.pl/rezerwacja</a>.</td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 5px;">3. Wybierz dogodny termin i rodzaj sesji.</td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 15px;">4. Użyj kodu w polu "KUPON" podczas podsumowania.</td>
                                    </tr>
                                </table>
                                
                                <!-- INJECT_ACCESS_BUTTON -->

                                <p style="margin: 20px 0 0 0; font-size: 11px; color: #555555; text-align: center; font-style: italic;">Karta ważna przez 12 miesięcy. Realizacja jednorazowa.</p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 40px; border-top: 1px solid #222222;">
                                <a href="https://wlasniewski.pl" style="color: #666666; text-decoration: none; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">www.wlasniewski.pl</a>
                                <p style="margin: 20px 0 0 0; font-size: 10px; color: #444444;">© 2025 PRZEMYSŁAW WŁAŚNIEWSKI FOTOGRAFIA</p>
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
