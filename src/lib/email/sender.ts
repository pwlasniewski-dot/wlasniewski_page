import nodemailer from 'nodemailer';
import prisma from '@/lib/db/prisma';

// Get SMTP configuration from database or environment variables
async function getSMTPConfig() {
    try {
        // Try to get from database first
        const settings = await prisma.setting.findMany({
            where: {
                setting_key: {
                    in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from']
                }
            }
        });

        const config: any = {};
        settings.forEach(s => {
            config[s.setting_key] = s.setting_value;
        });

        // Use database settings if available, fallback to environment variables
        return {
            host: config.smtp_host || process.env.SMTP_HOST,
            port: parseInt(config.smtp_port || process.env.SMTP_PORT || '587'),
            user: config.smtp_user || process.env.SMTP_USER,
            pass: config.smtp_password || process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
            from: config.smtp_from || process.env.SMTP_FROM || process.env.SMTP_USER,
        };
    } catch (error) {
        console.warn('⚠️ Could not load SMTP config from database, using environment variables:', error);
        return {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
        };
    }
}

// Email transporter configuration (will be initialized lazily)
let transporter: any = null;

async function getTransporter() {
    if (!transporter) {
        const config = await getSMTPConfig();
        
        console.log('📧 Initializing SMTP transporter with config:', {
            host: config.host,
            port: config.port,
            user: config.user,
            hasPassword: !!config.pass,
            from: config.from,
        });

        transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465,
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });
    }
    return transporter;
}

interface EmailData {
    to: string;
    subject: string;
    template?: string;
    data?: Record<string, any>;
    html?: string; // Direct HTML support
}

export async function sendEmail(emailData: EmailData) {
    try {
        const { to, subject, template, data, html } = emailData;

        console.log('📧 Sending email to:', to);

        // Get SMTP config (from database or env vars)
        const config = await getSMTPConfig();
        console.log('📧 SMTP Config:', {
            host: config.host,
            port: config.port,
            user: config.user,
            hasPass: !!config.pass,
            from: config.from,
        });

        // Use provided HTML or render from template
        let emailHtml = html;
        if (!emailHtml && template && data) {
            emailHtml = renderTemplate(template, data);
        }

        if (!emailHtml) {
            throw new Error('Either html or template+data must be provided');
        }

        const transport = await getTransporter();
        const result = await transport.sendMail({
            from: config.from,
            to,
            subject,
            html: emailHtml,
        });

        console.log('✅ Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error: any) {
        console.error('❌ Email send error:', {
            message: error.message,
            code: error.code,
            commandsupported: error.commandsupported,
            responseCode: error.responseCode,
            to: emailData.to,
        });
        throw error;
    }
}

function renderTemplate(template: string, data: Record<string, any>): string {
    const templates: Record<string, (data: any) => string> = {
        'challenge-invitation': (d) => `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Foto Wyzwanie!</title>
                    <style>
                        body { font-family: Arial, sans-serif; background: #0f0f0f; color: #fff; }
                        .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 40px; border-radius: 12px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .cta { display: inline-block; background: #d4af37; color: #000; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
                        .package-info { background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37; }
                        .footer { text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; font-size: 12px; color: #888; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="color: #d4af37; margin: 0;">🎉 Foto Wyzwanie!</h1>
                            <p style="font-size: 18px; color: #aaa; margin-top: 10px;">${d.inviterName} zaprasza Cię do udziału w wyzwaniu fotograficznym</p>
                        </div>

                        <div class="package-info">
                            <h2 style="margin-top: 0; color: #d4af37;">📦 Twój pakiet</h2>
                            <p><strong>Nazwa:</strong> ${d.packageName}</p>
                            <p><strong>Cena:</strong> ${d.packagePrice} PLN</p>
                            <p><strong>Opis:</strong> ${d.packageDescription}</p>
                        </div>

                        <p>Wyzwanie ważne jest przez <strong>30 dni</strong>. Po tym czasie zaproszenie wygasa.</p>

                        <div style="text-align: center;">
                            <a href="${d.inviteLink}" class="cta">Przyjrzyj się szczegółom 📸</a>
                        </div>

                        <div class="footer">
                            <p>Wiadomość wysłana przez System Rezerwacji Fotografa</p>
                            <p>© 2024 Wszystkie prawa zastrzeżone</p>
                        </div>
                    </div>
                </body>
            </html>
        `,

        'challenge-accepted': (d) => `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Wyzwanie zaakceptowane!</title>
                    <style>
                        body { font-family: Arial, sans-serif; background: #0f0f0f; color: #fff; }
                        .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 40px; border-radius: 12px; }
                        .success { text-align: center; padding: 30px; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #000; border-radius: 8px; margin: 30px 0; }
                        .info-box { background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37; }
                        .cta { display: inline-block; background: #d4af37; color: #000; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
                        .footer { text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; font-size: 12px; color: #888; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="success">
                            <h1 style="margin: 0; font-size: 32px;">🎉 Hurra!</h1>
                            <p style="margin: 10px 0 0 0; font-size: 18px;">Wyzwanie zostało zaakceptowane</p>
                        </div>

                        <div class="info-box">
                            <h2 style="margin-top: 0;">📅 Szczegóły sesji</h2>
                            <p><strong>Data:</strong> ${d.sessionDate}</p>
                            <p><strong>Godzina:</strong> ${d.sessionTime}</p>
                            <p><strong>Lokalizacja:</strong> ${d.location}</p>
                        </div>

                        <p>Dziękujemy za potwierdzenie! Czekamy na Ciebie w zaplanowanym terminie.</p>

                        <div style="text-align: center;">
                            <a href="${d.galleryLink}" class="cta">Przejrzyj swoją galerię 📸</a>
                        </div>

                        <div class="info-box">
                            <h3 style="margin-top: 0;">Co dalej?</h3>
                            <ol>
                                <li>Potwierdź obecność w dniu sesji</li>
                                <li>Przygotuj się do sesji fotograficznej</li>
                                <li>Zdobądź wspaniałe zdjęcia!</li>
                                <li>Podziel się zdjęciami ze znajomymi</li>
                            </ol>
                        </div>

                        <div class="footer">
                            <p>Wiadomość wysłana przez System Rezerwacji Fotografa</p>
                            <p>© 2024 Wszystkie prawa zastrzeżone</p>
                        </div>
                    </div>
                </body>
            </html>
        `,
    };

    const templateFn = templates[template];
    if (!templateFn) {
        console.error(`Template not found: ${template}`);
        return '<p>Template not found</p>';
    }

    return templateFn(data);
}
