import nodemailer from 'nodemailer';
import prisma from '@/lib/db/prisma';
import { logSystem } from '@/lib/logger';
import { brandColors, baseStyles } from '@/lib/email-templates';

// Get SMTP configuration from database or environment variables
export async function getSMTPConfig() {
    try {
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
            return {
                host: mainSettings.smtp_host || process.env.SMTP_HOST,
                port: mainSettings.smtp_port || parseInt(process.env.SMTP_PORT || '587'),
                user: mainSettings.smtp_user || process.env.SMTP_USER,
                pass: mainSettings.smtp_password || process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
                from: mainSettings.smtp_from || process.env.SMTP_FROM || mainSettings.smtp_user || process.env.SMTP_USER,
            };
        }

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

export async function getAdminEmail() {
    try {
        const config = await getSMTPConfig();
        return process.env.ADMIN_EMAIL || config.user || config.from;
    } catch (error) {
        return process.env.ADMIN_EMAIL || undefined;
    }
}

let transporter: any = null;

async function getTransporter() {
    if (!transporter) {
        const config = await getSMTPConfig();
        if (!config.host || !config.user || !config.pass) {
            throw new Error('SMTP not configured.');
        }

        transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465,
            auth: {
                user: config.user,
                pass: config.pass,
            },
            // Never accept an untrusted SMTP certificate: it could expose client data in transit.
            tls: {
                rejectUnauthorized: true
            }
        });

        await transporter.verify();
    }
    return transporter;
}

interface EmailData {
    to: string;
    subject: string;
    replyTo?: string;
    bcc?: string;
    text?: string;
    template?: string;
    data?: Record<string, any>;
    html?: string;
    attachments?: any[];
}

export async function sendEmail(emailData: EmailData) {
    try {
        const { to, subject, template, data, html, attachments, replyTo, bcc } = emailData;
        const config = await getSMTPConfig();

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
            replyTo,
            bcc,
            subject,
            html: emailHtml,
            attachments
        });

        await logSystem('INFO', 'EMAIL', 'Email sent successfully', { messageId: result.messageId, to, subject });
        return { success: true, messageId: result.messageId };
    } catch (error: any) {
        await logSystem('ERROR', 'EMAIL', 'Email send failed', { error: error.message, to: emailData.to });
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
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Foto <span class="logo-accent">Wyzwanie</span></div>
        </div>
        <div class="content">
            <div class="greeting">Hej, ${d.inviteeName}!</div>
            <p>Masz nowe zaproszenie od <strong>${d.inviterName}</strong>!</p>
            <div style="background: #1a1a1a; border: 2px solid #9f7a16; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <p style="color: #9f7a16; margin-bottom: 5px;">Zaproszenie od:</p>
                <div style="font-size: 24px; font-weight: bold; color: white;">${d.inviterName}</div>
                <div style="font-size: 18px; color: #9f7a16; font-family: monospace;">${d.inviterPhone}</div>
            </div>
            <div class="cta-section">
                <a href="${d.inviteLink}" class="cta-button">Sprawdź szczegóły 📸</a>
            </div>
        </div>
    </div>
</body>
</html>`,
        'challenge-accepted-inviter': (d) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="border-color: #22c55e;">
            <div class="logo">Wyzwanie <span class="logo-accent" style="color: #22c55e;">Zaakceptowane!</span></div>
        </div>
        <div class="content">
            <div class="greeting">Świetne wieści, ${d.inviterName}!</div>
            <p>Twoje wyzwanie dla <strong>${d.inviteeName}</strong> zostało zaakceptowane.</p>
            <div class="details-box" style="border-color: rgba(34, 197, 94, 0.3);">
                <p>📅 Data: ${d.sessionDate}</p>
                <p>🕐 Godzina: ${d.sessionTime}</p>
                <p>📍 Lokalizacja: ${d.location}</p>
            </div>
            <p>Sesja została oficjalnie potwierdzona w kalendarzu.</p>
        </div>
    </div>
</body>
</html>`,
        'challenge-accepted-invitee': (d) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="border-color: #22c55e;">
            <div class="logo">Rezerwacja <span class="logo-accent" style="color: #22c55e;">Potwierdzona</span></div>
        </div>
        <div class="content">
            <div class="greeting">Cześć ${d.inviteeName},</div>
            <p>Termin sesji od <strong>${d.inviterName}</strong> jest zarezerwowany. Voucher i plik kalendarza znajdziesz w załącznikach do tego maila.</p>
            <div class="details-box" style="border-color: rgba(34, 197, 94, 0.3);">
                <p>📅 Data: <strong>${d.sessionDate}</strong></p>
                <p>🕐 Godzina: <strong>${d.sessionTime}</strong></p>
                <p>📍 Lokalizacja: ${d.location}</p>
            </div>
            <p style="margin-top: 24px;"><strong>Załączniki w tym mailu:</strong></p>
            <ul style="color: #444; line-height: 1.8;">
                <li>📄 <strong>Voucher PDF</strong> — A4, z kodem QR i kodem weryfikacyjnym</li>
                <li>📅 <strong>Plik .ics</strong> — kliknij, aby dodać sesję do kalendarza (Google / Apple / Outlook)</li>
            </ul>
            ${d.panelLink ? `
            <div class="cta-section" style="margin-top: 24px;">
                <a href="${d.panelLink}" class="cta-button" style="background: #d4af37; color: black;">Otwórz mój panel</a>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 12px; text-align: center;">
                1 kliknięcie — logujemy Cię automatycznie. Bez hasła. Link ważny 60 dni.
            </p>` : ''}
            <p style="font-size: 13px; color: #666; margin-top: 20px;">
                Dzień przed sesją otrzymasz krótkie przypomnienie z dokładnym miejscem zbiórki i kontaktem awaryjnym.
            </p>
        </div>
    </div>
</body>
</html>`,
        'challenge-payment-received-invitee': (d) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="border-color: #d4af37;">
            <div class="logo">Masz <span class="logo-accent" style="color: #d4af37;">Zaproszenie</span> 🎁</div>
        </div>
        <div class="content">
            <div class="greeting">Cześć ${d.inviteeName},</div>
            <p><strong>${d.inviterName}</strong> opłacił dla Ciebie sesję fotograficzną w pakiecie <strong>${d.packageName}</strong>.</p>
            <p>Sesja jest <strong>w pełni opłacona z góry</strong> — Ty wybierasz tylko termin i akceptujesz zaproszenie. Możesz też je odrzucić jednym kliknięciem (bez zobowiązań).</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${d.inviteLink}" style="display: inline-block; background: #d4af37; color: #1a1a1a; padding: 14px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 16px;">
                    Zobacz zaproszenie →
                </a>
            </div>
            <p style="font-size: 13px; color: #666;">
                Link do zaproszenia: <br>
                <a href="${d.inviteLink}" style="color: #d4af37; word-break: break-all;">${d.inviteLink}</a>
            </p>
        </div>
    </div>
</body>
</html>`,
        'challenge-payment-received-inviter': (d) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="border-color: #22c55e;">
            <div class="logo">Płatność <span class="logo-accent" style="color: #22c55e;">Potwierdzona</span> ✅</div>
        </div>
        <div class="content">
            <div class="greeting">Cześć ${d.inviterName},</div>
            <p>Twoja płatność za sesję <strong>${d.packageName}</strong> dla <strong>${d.inviteeName}</strong> została pomyślnie zarejestrowana.</p>
            <div class="details-box" style="border-color: rgba(34, 197, 94, 0.3);">
                <p>💰 Kwota: <strong>${d.amount} PLN</strong></p>
                <p>📨 Status: zaproszenie wysłane do ${d.inviteeName}</p>
            </div>
            <p>Zaproszony otrzymał właśnie e-mail z linkiem do akceptacji terminu. Powiadomię Cię, gdy zaakceptuje lub odrzuci zaproszenie.</p>
            <p style="font-size: 13px; color: #666; margin-top: 20px;">
                W razie pytań: pwlasniewski@gmail.com &nbsp;·&nbsp; +48 530 788 694
            </p>
        </div>
    </div>
</body>
</html>`,
        'challenge-rejected': (d) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="border-color: #ef4444;">
            <div class="logo">Wyzwanie <span class="logo-accent" style="color: #ef4444;">Odrzucone</span></div>
        </div>
        <div class="content">
            <div class="greeting">Hej, ${d.inviterName}</div>
            <p>Twoje wyzwanie dla ${d.inviteeName} nie zostało zaakceptowane. Termin został zwolniony.</p>
            <div class="details-box" style="border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05);">
                <p>Jeśli dokonałeś opłaty, skontaktuj się ze mną bezpośrednio w celu ustalenia zwrotu.</p>
            </div>
        </div>
    </div>
</body>
</html>`,
        'challenge-rejected-admin': (d) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="border-color: #f97316;">
            <div class="logo">Wymagany <span class="logo-accent" style="color: #f97316;">ZWROT</span></div>
        </div>
        <div class="content">
            <div class="greeting">Cześć Przemek,</div>
            <p>Wyzwanie zostało <strong>odrzucone</strong> przez zaproszonego. Należy dokonać zwrotu środków dla zapraszającego.</p>
            <div class="details-box" style="border-color: rgba(249, 115, 22, 0.3); background: rgba(249, 115, 22, 0.05);">
                <p>👤 Zapraszający: <strong>${d.inviterName}</strong> (${d.inviterEmail})</p>
                <p>👤 Zaproszony: <strong>${d.inviteeName}</strong></p>
                <p>💰 Kwota do zwrotu: <strong>${d.amount} PLN</strong></p>
                <p>💳 ID Płatności: <strong>${d.paymentId || 'Brak'}</strong></p>
            </div>
            <p>Termin został automatycznie zwolniony w kalendarzu.</p>
        </div>
    </div>
</body>
</html>`,
        'challenge-photos-ready': (d) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="border-color: # gold-500;">
            <div class="logo">Twoje Zdjęcia są <span class="logo-accent" style="color: #d4af37;">GOTOWE!</span> 📸</div>
        </div>
        <div class="content">
            <div class="greeting">Cześć ${d.inviteeName}!</div>
            <p>Mam świetną wiadomość! Zdjęcia z Twojego Foto Wyzwania od <strong>${d.inviterName}</strong> są już gotowe i czekają na Ciebie w prywatnym panelu.</p>
            <div class="details-box" style="border-color: rgba(212, 175, 55, 0.3); background: rgba(212, 175, 55, 0.05);">
                <p>✨ Sesja: <strong>${d.packageName}</strong></p>
                <p>� Wystarczy jedno kliknięcie — zalogujemy Cię automatycznie.</p>
            </div>
            <div class="cta-section">
                <a href="${d.loginLink}" class="cta-button" style="background: #d4af37; color: black;">Otwórz panel i zobacz zdjęcia 🖼️</a>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
                Link jest ważny 30 dni i prowadzi tylko do Twojego konta. Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:<br>
                <span style="word-break: break-all; color: #888;">${d.loginLink}</span>
            </p>
        </div>
    </div>
</body>
</html>`,
        'challenge-payment-confirmed-inviter': (d) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="border-color: #22c55e;">
            <div class="logo">Płatność <span class="logo-accent" style="color: #22c55e;">Potwierdzona!</span> ✅</div>
        </div>
        <div class="content">
            <div class="greeting">Dzięki, ${d.inviterName}!</div>
            <p>Twoja płatność za Foto Wyzwanie dla <strong>${d.inviteeName}</strong> została zaksięgowana. Zaproszenie jest już u adresata!</p>
            
            <div class="details-box" style="border-color: rgba(34, 197, 94, 0.3); background: rgba(34, 197, 94, 0.05);">
                <p>🎁 <strong>Twoja nagroda:</strong> Twoja para otrzyma pełną kolekcję cyfrową w cenie wyzwania!</p>
                <p>📸 <strong>Sesja:</strong> ${d.packageName}</p>
            </div>

            <h3 style="color: white; margin-top: 30px;">Co dalej?</h3>
            <p>Polecam założyć konto (lub zalogować się), aby śledzić status wyzwania. Dowiesz się natychmiast, gdy <strong>${d.inviteeName}</strong> zaakceptuje termin!</p>

            <div class="cta-section">
                <a href="${d.loginLink}" class="cta-button" style="background: white; color: black; border: 1px solid #ccc;">Śledź status w panelu 🔎</a>
            </div>
            
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
                Link do Twojego wyzwania: <br>
                <a href="${d.inviteLink}" style="color: #9f7a16;">${d.inviteLink}</a>
            </p>
        </div>
    </div>
</body>
</html>`,
        'welcome-client': (d) => {
            const { generateWelcomeClientEmail } = require('@/lib/email-templates');
            return generateWelcomeClientEmail(d);
        },
        'password-reset': (d) => {
            const { generatePasswordResetEmail } = require('@/lib/email-templates');
            return generatePasswordResetEmail(d);
        },
        'foto-match-submitted': (d) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="container">
    <div class="header"><div class="logo">Foto <span class="logo-accent">Match</span></div></div>
    <div class="content">
        <div class="greeting">Cześć ${d.name || 'na pokładzie'} 👋</div>
        <p>Twój profil został przesłany do weryfikacji. Sprawdzamy ręcznie każdą zgłoszenie — to zwykle zajmuje do 48 godzin w dni robocze.</p>
        <p>Otrzymasz osobnego maila gdy profil zostanie zatwierdzony.</p>
        <div class="cta-section"><a href="${d.profileUrl}" class="cta-button">Otwórz mój profil</a></div>
        <p style="color:#888;font-size:13px">Jeśli czegoś brakuje (np. dokumentu tożsamości), poprosimy o uzupełnienie.</p>
    </div>
</div></body></html>`,
        'foto-match-approved': (d) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="container">
    <div class="header" style="border-color:#22c55e"><div class="logo">Foto <span class="logo-accent" style="color:#22c55e">Match</span></div></div>
    <div class="content">
        <div class="greeting">Cześć ${d.name || ''} 🎉</div>
        <p>Twój profil <strong>${d.displayName}</strong> został zaakceptowany! Od teraz jesteś widoczna(y) dla innych uczestników Foto-Match w Twojej okolicy.</p>
        <div class="cta-section"><a href="${d.discoverUrl}" class="cta-button">Zobacz dopasowania 💞</a></div>
        <p style="margin-top:20px"><a href="${d.referUrl}" style="color:#9f7a16">💌 Polec znajomych i odbierz bonus</a></p>
    </div>
</div></body></html>`,
        'foto-match-rejected': (d) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="container">
    <div class="header" style="border-color:#ef4444"><div class="logo">Foto <span class="logo-accent" style="color:#ef4444">Match</span></div></div>
    <div class="content">
        <div class="greeting">Cześć ${d.name || ''}</div>
        <p>Twój profil <strong>${d.displayName}</strong> wymaga zmian zanim go zaakceptujemy.</p>
        ${d.reason ? `<div style="background:#1a1a1a;border-left:4px solid #ef4444;padding:15px;margin:20px 0;border-radius:6px"><strong>Powód:</strong><br>${d.reason}</div>` : ''}
        <p>Możesz edytować swój profil i ponownie wysłać do weryfikacji.</p>
        <div class="cta-section"><a href="${d.profileUrl}" class="cta-button">Edytuj profil</a></div>
    </div>
</div></body></html>`,
        'foto-match-suspended': (d) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="container">
    <div class="header" style="border-color:#f59e0b"><div class="logo">Foto <span class="logo-accent" style="color:#f59e0b">Match</span></div></div>
    <div class="content">
        <div class="greeting">Cześć ${d.name || ''}</div>
        <p>Twój profil w Foto-Match został zawieszony${d.reason ? ` z powodu: <strong>${d.reason}</strong>` : ''}.</p>
        <p>Profil nie jest obecnie widoczny dla innych. Skontaktuj się z nami, jeśli uważasz że to pomyłka.</p>
        <div class="cta-section"><a href="mailto:${d.contactEmail || 'pwlasniewski@gmail.com'}" class="cta-button">Napisz do nas</a></div>
    </div>
</div></body></html>`,
        'foto-match-referral-rewarded': (d) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="container">
    <div class="header" style="border-color:#fbbf24"><div class="logo">🎁 <span class="logo-accent" style="color:#fbbf24">Bonus przyznany!</span></div></div>
    <div class="content">
        <div class="greeting">Cześć ${d.name || ''} 🎉</div>
        <p>Twoja polecona osoba dołączyła do Foto-Match — dostajesz <strong>${d.bonusLabel}</strong> rabatu na pierwszą sesję.</p>
        <div style="background:#1a1a1a;border:2px dashed #fbbf24;padding:20px;border-radius:12px;margin:20px 0;text-align:center">
            <p style="color:#888;font-size:12px;margin:0 0 6px">TWÓJ KOD VOUCHERA</p>
            <div style="font-size:28px;font-weight:bold;letter-spacing:2px;color:#fbbf24;font-family:monospace">${d.voucherCode}</div>
            ${d.expiresAt ? `<p style="color:#888;font-size:12px;margin:8px 0 0">Ważny do ${d.expiresAt}</p>` : ''}
        </div>
        <div class="cta-section"><a href="${d.bookingUrl}" class="cta-button">Zarezerwuj sesję</a></div>
    </div>
</div></body></html>`,
        'booking-deposit-paid': (d) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="container">
    <div class="header"><div class="logo">✅ <span class="logo-accent">Zaliczka zaksięgowana</span></div></div>
    <div class="content">
        <div class="greeting">Cześć ${d.name}</div>
        <p>Otrzymaliśmy Twoją zaliczkę w wysokości <strong>${d.deposit_amount_pln} zł</strong>. Sesja jest wstępnie potwierdzona.</p>
        <p><strong>Pozostała kwota: ${d.remaining_amount_pln} zł</strong></p>
        <p>Termin wpłaty dopłaty: <strong>${d.remaining_due_at}</strong> (sesja ${d.session_date}).</p>
        <p>Kilka dni przed terminem wyślemy przypomnienie z linkiem do płatności.</p>
    </div>
</div></body></html>`,
        'booking-payment-reminder': (d) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="container">
    <div class="header" style="border-color:#fbbf24"><div class="logo">⏰ <span class="logo-accent" style="color:#fbbf24">Przypomnienie o dopłacie</span></div></div>
    <div class="content">
        <div class="greeting">Cześć ${d.name}</div>
        <p>Przypominamy, że pozostała dopłata za Twoją sesję wynosi <strong>${d.remaining_amount_pln} zł</strong>.</p>
        <p>Termin wpłaty: <strong>${d.remaining_due_at}</strong> (sesja ${d.session_date}).</p>
        ${d.paymentUrl ? `<div class="cta-section"><a href="${d.paymentUrl}" class="cta-button">Zapłać teraz</a></div>` : '<p>Skontaktuj się z nami, aby otrzymać link do płatności.</p>'}
    </div>
</div></body></html>`,
    };

    const templateFn = templates[template];
    return templateFn ? templateFn(data) : '<p>Template not found</p>';
}
