export function generateGiftCardEmail(
    recipientName: string,
    code: string,
    value: number,
    theme: string,
    senderName: string,
    message: string,
    logoUrl?: string
): string {
    const themeColors = {
        christmas: { bg: '#8B0000', accent: '#FFD700' },
        wosp: { bg: '#DC143C', accent: '#FFD700' },
        valentines: { bg: '#C71585', accent: '#FFB6C1' },
        easter: { bg: '#F0E68C', accent: '#9370DB' },
        halloween: { bg: '#FF8C00', accent: '#000' },
        'mothers-day': { bg: '#9932CC', accent: '#FFD700' },
        'childrens-day': { bg: '#1E90FF', accent: '#FFD700' },
        wedding: { bg: '#E6D7E6', accent: '#9932CC' },
        birthday: { bg: '#00CED1', accent: '#FFD700' }
    };

    const colors = themeColors[theme as keyof typeof themeColors] || themeColors.christmas;

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
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #f5f5f5;
                color: #333;
                line-height: 1.6;
            }
            
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            
            .header {
                background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent}33 100%);
                padding: 30px 20px;
                text-align: center;
                color: white;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -10%;
                width: 200px;
                height: 200px;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
            }
            
            .header h1 {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 10px;
                position: relative;
                z-index: 1;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            .header p {
                font-size: 14px;
                opacity: 0.9;
                position: relative;
                z-index: 1;
            }
            
            ${logoUrl ? `
            .logo {
                width: 80px;
                height: 80px;
                margin: 20px auto;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .logo img {
                max-width: 70px;
                max-height: 70px;
                object-fit: contain;
            }
            ` : ''}
            
            .content {
                padding: 40px 20px;
                text-align: center;
            }
            
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #333;
            }
            
            .greeting strong {
                color: ${colors.bg};
                font-size: 20px;
            }
            
            .message-box {
                background: #f9f9f9;
                border-left: 4px solid ${colors.bg};
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 4px;
                font-style: italic;
                color: #666;
            }
            
            .card {
                background: linear-gradient(135deg, ${colors.bg}20, ${colors.accent}20);
                border: 2px solid ${colors.bg};
                border-radius: 12px;
                padding: 30px 20px;
                margin: 30px 0;
                text-align: center;
            }
            
            .card-label {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: ${colors.bg};
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .card-code {
                font-size: 28px;
                font-weight: bold;
                font-family: 'Courier New', monospace;
                color: ${colors.bg};
                letter-spacing: 3px;
                margin: 15px 0;
                padding: 20px;
                background: white;
                border-radius: 8px;
                border: 1px dashed ${colors.bg};
            }
            
            .card-value {
                font-size: 24px;
                font-weight: bold;
                color: ${colors.bg};
                margin-top: 15px;
            }
            
            .instructions {
                background: ${colors.bg}08;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                text-align: left;
                color: #555;
            }
            
            .instructions h3 {
                color: ${colors.bg};
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .instructions ol {
                margin-left: 20px;
                font-size: 13px;
                line-height: 1.8;
            }
            
            .instructions li {
                margin-bottom: 8px;
            }
            
            .cta-button {
                display: inline-block;
                background: ${colors.bg};
                color: white;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: bold;
                font-size: 14px;
                margin: 20px 0;
                transition: opacity 0.3s;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .cta-button:hover {
                opacity: 0.9;
            }
            
            .footer {
                background: #f5f5f5;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #888;
                border-top: 1px solid #eee;
            }
            
            .footer p {
                margin: 5px 0;
            }
            
            .sender-info {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 13px;
                color: #666;
            }
            
            .sender-info strong {
                color: ${colors.bg};
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    border-radius: 0;
                }
                
                .header h1 {
                    font-size: 24px;
                }
                
                .card-code {
                    font-size: 20px;
                    letter-spacing: 2px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>🎁 Karta Podarunkowa</h1>
                <p>Specjalny upominek czeka na Ciebie!</p>
            </div>
            
            <!-- Logo -->
            ${logoUrl ? `
            <div style="text-align: center; padding: 20px 0;">
                <div class="logo">
                    <img src="${logoUrl}" alt="Logo" />
                </div>
            </div>
            ` : ''}
            
            <!-- Content -->
            <div class="content">
                <p class="greeting">Cześć <strong>${recipientName}</strong>! 👋</p>
                
                <p style="margin: 20px 0; color: #555;">
                    Mamy dla Ciebie cudowną niespodziankę – kartę podarunkową o wartości <strong style="color: ${colors.bg};">${value} zł</strong>!
                </p>
                
                ${message ? `
                <div class="message-box">
                    "${message}"
                </div>
                ` : ''}
                
                <!-- Gift Card Display -->
                <div class="card">
                    <div class="card-label">🎉 Twój Kod Promocyjny</div>
                    <div class="card-code">${code}</div>
                    <div class="card-value">Wartość: ${value} zł</div>
                </div>
                
                <!-- Instructions -->
                <div class="instructions">
                    <h3>Jak korzystać z karty?</h3>
                    <ol>
                        <li>Skopiuj powyższy kod promocyjny</li>
                        <li>Przejdź na naszą stronę rezerwacji</li>
                        <li>Wklej kod w polu "Kod promocyjny"</li>
                        <li>Ciesz się zniżką! 🎉</li>
                    </ol>
                </div>
                
                <!-- CTA Button -->
                <a href="https://twojadomena.pl/rezerwacja" class="cta-button">Przejdź do rezerwacji</a>
                
                <div class="sender-info">
                    <p>Tę kartę podarunkową przygotował dla Ciebie: <strong>${senderName || 'Przemysław Właśniewski'}</strong></p>
                    <p style="margin-top: 10px; font-size: 11px; color: #999;">
                        Karta jest ważna jednorazowo. Nie można jej łączyć z innymi promocjami.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p><strong>Fotografia Przemysław Właśniewski</strong></p>
                <p>Dziękujemy za zaufanie!</p>
                <p style="margin-top: 10px; color: #aaa;">© 2024 Wszystkie prawa zastrzeżone</p>
            </div>
        </div>
    </body>
    </html>
    `;
}
