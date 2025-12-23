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
    // Match GiftCard.tsx theme configurations with proper gradients
    const themeConfigs: any = {
        christmas: {
            bgGradient: 'linear-gradient(135deg, #8b0000 0%, #dc143c 50%, #228b22 100%)',
            accentColor: '#ffd700',
            icon: '🎄',
            title: 'Boże Narodzenie',
            defaultDescription: 'Życzenia pięknego świąt'
        },
        wosp: {
            bgGradient: 'linear-gradient(135deg, #dc143c 0%, #ff4500 50%, #b8860b 100%)',
            accentColor: '#ffd700',
            icon: '💛',
            title: 'Karta Pomocy',
            defaultDescription: 'Wspieraj co w Tobie dobre'
        },
        valentines: {
            bgGradient: 'linear-gradient(135deg, #c71585 0%, #ff69b4 50%, #8b0000 100%)',
            accentColor: '#ffb6c1',
            icon: '💝',
            title: 'Walentynki',
            defaultDescription: 'Z miłością'
        },
        easter: {
            bgGradient: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #f0e68c 100%)',
            accentColor: '#9370db',
            icon: '🐰',
            title: 'Wielkanoc',
            defaultDescription: 'Wesołych Świąt'
        },
        halloween: {
            bgGradient: 'linear-gradient(135deg, #ff8c00 0%, #ff6347 50%, #000000 100%)',
            accentColor: '#ff8c00',
            icon: '👻',
            title: 'Halloween',
            defaultDescription: 'Straszna zniżka czeka!'
        },
        'mothers-day': {
            bgGradient: 'linear-gradient(135deg, #9932cc 0%, #ff69b4 50%, #9932cc 100%)',
            accentColor: '#ffd700',
            icon: '💐',
            title: 'Dzień Matki',
            defaultDescription: 'Dla najwspanialszej mamy'
        },
        'childrens-day': {
            bgGradient: 'linear-gradient(135deg, #1e90ff 0%, #87ceeb 50%, #da70d6 100%)',
            accentColor: '#ffd700',
            icon: '🎈',
            title: 'Dzień Dziecka',
            defaultDescription: 'Dla małego uśmieszku'
        },
        wedding: {
            bgGradient: 'linear-gradient(135deg, #dda0dd 0%, #ffb6c1 50%, #dda0dd 100%)',
            accentColor: '#9932cc',
            icon: '💒',
            title: 'Ślub',
            defaultDescription: 'Życzenia szczęścia'
        },
        birthday: {
            bgGradient: 'linear-gradient(135deg, #00ced1 0%, #87ceeb 50%, #4169e1 100%)',
            accentColor: '#ffd700',
            icon: '🎂',
            title: 'Urodziny',
            defaultDescription: 'Wiele szczęścia!'
        }
    };

    const config = themeConfigs[theme] || themeConfigs.christmas;
    const displayTitle = cardTitle || 'KARTA PODARUNKOWA';
    const displayDescription = cardDescription || config.defaultDescription;

    return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: #f5f5f5;
                color: #333;
                padding: 20px 0;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
            }
            
            /* Header with logo and photographer info */
            .photographer-header {
                background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
                padding: 30px 20px;
                text-align: center;
                color: white;
            }
            
            .photographer-logo {
                width: 80px;
                height: 80px;
                margin: 0 auto 15px;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                overflow: hidden;
                font-size: 32px;
                font-weight: bold;
                color: #1a1a1a;
            }
            
            .photographer-logo img {
                max-width: 70px;
                max-height: 70px;
                object-fit: contain;
            }
            
            .photographer-name {
                font-size: 18px;
                font-weight: bold;
                letter-spacing: 1px;
                margin-bottom: 5px;
            }
            
            .photographer-title {
                font-size: 12px;
                opacity: 0.8;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            
            /* Main gift card section */
            .gift-card-wrapper {
                padding: 40px 20px;
                background: white;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .gift-card-container {
                position: relative;
                width: 100%;
                max-width: 360px;
                margin: 0 auto 30px;
                border-radius: 28px;
                overflow: hidden;
                box-shadow: 0 18px 45px rgba(0,0,0,0.18);
                background: ${config.bgGradient};
                padding: 32px 28px;
                color: white;
                display: flex;
                flex-direction: column;
                gap: 24px;
                text-align: left;
                box-sizing: border-box;
            }
            
            .gift-card-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .theme-pill {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(255,255,255,0.15);
                border-radius: 999px;
                padding: 6px 12px;
                font-size: 11px;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            
            .theme-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255,255,255,0.8);
            }
            
            .gift-card-icon {
                font-size: 40px;
            }
            
            .gift-card-center {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .gift-card-title {
                font-size: 26px;
                font-weight: 700;
                line-height: 1.3;
                text-shadow: 0 2px 4px rgba(0,0,0,0.25);
            }
            
            .gift-card-description {
                font-size: 14px;
                opacity: 0.9;
                line-height: 1.6;
            }
            
            .recipient-block {
                background: rgba(0,0,0,0.18);
                border-radius: 18px;
                padding: 14px 16px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            
            .recipient-name {
                font-size: 13px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            
            .message-text {
                font-size: 12px;
                opacity: 0.8;
                line-height: 1.5;
                font-style: italic;
            }
            
            .gift-card-bottom {
                display: flex;
                flex-direction: column;
                gap: 18px;
            }
            
            .value-section {
                background: rgba(255,255,255,0.14);
                border-radius: 20px;
                padding: 18px;
                text-align: center;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
            }
            
            .value-label {
                font-size: 11px;
                opacity: 0.8;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 6px;
            }
            
            .value-amount {
                font-size: 36px;
                font-weight: 700;
                text-shadow: 0 3px 6px rgba(0,0,0,0.25);
            }
            
            .code-section {
                background: rgba(255,255,255,0.95);
                border-radius: 12px;
                padding: 14px 18px;
                border: 2px solid rgba(255,255,255,1);
                color: #000;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            
            .code-label {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 2px;
                opacity: 0.75;
                margin-bottom: 10px;
            }
            
            .code-value {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: 700;
                letter-spacing: 3px;
                word-break: break-all;
                text-align: center;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            /* Info section below card */
            .info-section {
                background: #f9f9f9;
                padding: 25px 20px;
                border-top: 1px solid #eee;
            }
            
            .info-title {
                font-size: 16px;
                font-weight: bold;
                color: #333;
                margin-bottom: 15px;
                text-align: center;
            }
            
            .info-text {
                font-size: 14px;
                color: #555;
                line-height: 1.8;
                margin-bottom: 10px;
            }
            
            .info-text strong {
                color: #1a1a1a;
            }
            
            .instructions {
                background: white;
                border: 1px solid #eee;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                text-align: left;
            }
            
            .instructions h4 {
                color: #333;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 10px;
            }
            
            .instructions ol {
                margin-left: 20px;
                font-size: 13px;
                color: #666;
                line-height: 1.8;
            }
            
            .instructions li {
                margin-bottom: 8px;
            }
            
            /* Footer */
            .footer {
                background: #f5f5f5;
                padding: 20px;
                text-align: center;
                font-size: 11px;
                color: #999;
                border-top: 1px solid #eee;
            }
            
            .footer p {
                margin: 5px 0;
            }
            
            .footer-bold {
                color: #555;
                font-weight: bold;
            }
            
            @media (max-width: 480px) {
                .gift-card-container {
                    padding: 26px 22px;
                    max-width: 320px;
                    gap: 20px;
                }
                
                .gift-card-title {
                    font-size: 22px;
                }
                
                .theme-pill {
                    padding: 5px 10px;
                    font-size: 10px;
                }

                .gift-card-icon {
                    font-size: 32px;
                }

                .value-section {
                    padding: 16px;
                }

                .value-amount {
                    font-size: 32px;
                }
                
                .code-value {
                    font-size: 16px;
                    letter-spacing: 2px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Photographer Header -->
            <div class="photographer-header">
                <div class="photographer-logo">
                    ${logoUrl ? `<img src="${logoUrl}" alt="Fotograf Logo" />` : 'PW'}
                </div>
                <div class="photographer-name">PRZEMYSŁAW WŁAŚNIEWSKI</div>
                <div class="photographer-title">📸 Fotografia</div>
            </div>
            
            <!-- Gift Card Section -->
            <div class="gift-card-wrapper">
                <div class="gift-card-container">
                    <!-- Top Section -->
                    <div class="gift-card-top">
                        <div class="theme-pill">
                            <span class="theme-dot"></span>
                            <span>${config.title}</span>
                        </div>
                        <div class="gift-card-icon">${config.icon}</div>
                    </div>
                    
                    <!-- Center Section -->
                    <div class="gift-card-center">
                        <div class="gift-card-title">${displayTitle}</div>
                        <div class="gift-card-description">${displayDescription}</div>
                        ${(recipientName || message) ? `
                        <div class="recipient-block">
                            ${recipientName ? `<div class="recipient-name">Dla ${recipientName}</div>` : ''}
                            ${message ? `<div class="message-text">${message}</div>` : ''}
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Bottom Section -->
                    <div class="gift-card-bottom">
                        <div class="value-section">
                            <div class="value-label">Wartość karty</div>
                            <div class="value-amount">${value} zł</div>
                        </div>
                        
                        <div class="code-section">
                            <div class="code-label">🎉 Kod Promocyjny</div>
                            <div class="code-value">${code}</div>
                        </div>
                    </div>

            <!-- Clear Code Section -->
            <div style="background-color: #ffffff; border: 2px dashed #444; padding: 25px; text-align: center; margin: 0 20px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                 <p style="font-size: 13px; color: #666; text-transform: uppercase; margin-bottom: 8px; font-weight: 600; letter-spacing: 1px;">Twój Kod Rabatowy</p>
                 <p style="font-size: 28px; font-weight: 800; color: #000; letter-spacing: 3px; font-family: 'Courier New', monospace; margin: 10px 0; background: #f0f0f0; display: inline-block; padding: 5px 15px; border-radius: 6px;">${code}</p>
                 <p style="font-size: 15px; color: #444; margin-top: 10px;">Wartość karty: <strong style="color: #000;">${value} zł</strong></p>
            </div>
                </div>
            </div>
            
            <!-- Info Section -->
            <div class="info-section">
                <div class="info-title">Jak korzystać z karty?</div>
                
                <div class="info-text">
                    <strong>Gratulacje!</strong> Właśnie otrzymałeś kartę podarunkową o wartości <strong>${value} zł</strong> od <strong>${senderName || 'Fotografa'}</strong>!
                </div>
                
                <div class="instructions">
                    <h4>Kroki do realizacji:</h4>
                    <ol>
                        <li>Skopiuj powyższy kod promocyjny</li>
                        <li>Przejdź na stronę rezerwacji www.wlasniewski.pl/rezerwacja</li>
                        <li>Wklej kod w polu "Kod promocyjny"</li>
                        <li>Ciesz się swoją sesją fotograficzną! 🎉</li>
                    </ol>
                </div>
                
                <div class="info-text" style="margin-top: 20px; font-size: 12px; color: #888;">
                    <strong>Ważne:</strong> Karta jest ważna przez 12 miesięcy od daty wystawienia. Nie można jej łączyć z innymi promocjami ani zwracać w formie pieniężnej.
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p class="footer-bold">Fotografia Przemysław Właśniewski</p>
                <p style="margin-top: 10px;">Dziękujemy za zaufanie i do zobaczenia!</p>
                <p style="margin-top: 15px; color: #aaa;">© 2024 Wszystkie prawa zastrzeżone</p>
            </div>
        </div>
    </body>
    </html>`;
}
