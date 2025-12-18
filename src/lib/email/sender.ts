import nodemailer from 'nodemailer';
import prisma from '@/lib/db/prisma';

// Get SMTP configuration from database or environment variables
export async function getSMTPConfig() {
    try {
        // Find the settings record with SMTP configuration
        // We prioritize columns: smtp_host, smtp_user, smtp_password
        const mainSettings = await prisma.setting.findFirst({
            where: {
                OR: [
                    { smtp_host: { not: null } },
                    { smtp_user: { not: null } }
                ]
            },
            orderBy: { id: 'asc' }
        });

        if (mainSettings) {
            console.log('📬 Loaded SMTP config from DB record ID:', mainSettings.id);
            return {
                host: mainSettings.smtp_host || process.env.SMTP_HOST,
                port: mainSettings.smtp_port || parseInt(process.env.SMTP_PORT || '587'),
                user: mainSettings.smtp_user || process.env.SMTP_USER,
                pass: mainSettings.smtp_password || process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
                from: mainSettings.smtp_from || process.env.SMTP_FROM || mainSettings.smtp_user || process.env.SMTP_USER,
            };
        }

        console.warn('⚠️ No SMTP settings found in database, falling back to environment variables.');
        return {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
        };
    } catch (error) {
        console.error('❌ Error loading SMTP config:', error);
        return {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
        };
    }
}

// Helper to get Admin Email (defaults to SMTP user)
export async function getAdminEmail() {
    try {
        const config = await getSMTPConfig();
        const adminEmail = process.env.ADMIN_EMAIL || config.user || config.from;
        console.log('🔍 getAdminEmail:', { fromEnv: process.env.ADMIN_EMAIL, fromConfig: config.user, final: adminEmail });
        return adminEmail;
    } catch (error) {
        console.error('❌ getAdminEmail error:', error);
        return process.env.ADMIN_EMAIL || undefined;
    }
}

import { logSystem } from '@/lib/logger';

// ... (imports)

// ... (getSMTPConfig function remains same)

// Email transporter configuration (will be initialized lazily)
let transporter: any = null;

async function getTransporter() {
    if (!transporter) {
        const config = await getSMTPConfig();

        // Validate SMTP config
        if (!config.host || !config.user || !config.pass) {
            const missing = {
                host: !config.host ? 'MISSING' : '✓',
                user: !config.user ? 'MISSING' : '✓',
                pass: !config.pass ? 'MISSING' : '✓'
            };
            console.error('❌ SMTP not configured! Missing:', missing);
            await logSystem('ERROR', 'EMAIL', 'SMTP Configuration Missing', missing);
            throw new Error('SMTP not configured. Configure settings in Admin → Settings → Email');
        }

        console.log('🔌 Creating SMTP transporter:', { host: config.host, port: config.port, user: config.user });

        transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465,
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });

        // Try to verify connection
        try {
            await transporter.verify();
            console.log('✅ SMTP connection verified successfully');
        } catch (verifyError: any) {
            console.error('❌ SMTP connection verification failed:', verifyError.message);
            await logSystem('ERROR', 'EMAIL', 'SMTP connection verification failed', {
                error: verifyError.message,
                code: verifyError.code,
                host: config.host,
                port: config.port
            });
            transporter = null;
            throw verifyError;
        }
    }
    return transporter;
}

interface EmailData {
    to: string;
    subject: string;
    replyTo?: string;
    text?: string;
    template?: string;
    data?: Record<string, any>;
    html?: string; // Direct HTML support
}

export async function sendEmail(emailData: EmailData) {
    try {
        const { to, subject, replyTo, text, template, data, html } = emailData;

        // Log attempt
        await logSystem('INFO', 'EMAIL', 'Attempting to send email', { to, subject, replyTo });

        // Get SMTP config (from database or env vars)
        const config = await getSMTPConfig();
        console.log('🔍 SMTP Config loaded:', {
            host: config.host ? '✓' : '✗',
            port: config.port,
            user: config.user ? '✓ (masked)' : '✗',
            pass: config.pass ? '✓ (masked)' : '✗',
            from: config.from
        });

        // Use provided HTML or render from template
        let emailHtml = html;
        if (!emailHtml && template && data) {
            emailHtml = renderTemplate(template, data);
        }

        if (!emailHtml) {
            throw new Error('Either html or template+data must be provided');
        }

        const transport = await getTransporter(); // This might throw SMTP config error
        console.log('📤 Sending email via SMTP to:', to);

        const result = await transport.sendMail({
            from: config.from,
            to,
            subject,
            html: emailHtml,
        });

        console.log('✅ Email sent successfully:', result.messageId);
        await logSystem('INFO', 'EMAIL', 'Email sent successfully', { messageId: result.messageId, to, subject });
        return { success: true, messageId: result.messageId };
    } catch (error: any) {
        console.error('❌ Email send error:', error);
        const errorDetails = {
            message: error.message,
            code: error.code,
            command: error.command,
            to: emailData.to,
            subject: emailData.subject
        };
        console.error('📋 Error details:', errorDetails);
        await logSystem('ERROR', 'EMAIL', 'Email send failed', errorDetails);
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
