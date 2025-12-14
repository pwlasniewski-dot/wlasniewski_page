
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSMTPConfig } from "@/lib/email/sender";
import { logSystem } from "@/lib/logger";

export async function POST(request: Request) {
    let body: any = {};
    try {
        body = await request.json();
        const { name, email, message } = body;

        // Validation
        if (!name || !email || !message) {
            await logSystem('WARN', 'CONTACT', 'Contact form validation failed', { name, email, hasMessage: !!message });
            return NextResponse.json(
                { error: "Wszystkie pola są wymagane" },
                { status: 400 }
            );
        }

        const config = await getSMTPConfig();
        const adminEmail = config.user || config.from;

        // Verify SMTP config
        if (!config.host || !config.user || !config.pass) {
            const missing = {
                host: !config.host ? 'MISSING' : 'OK',
                user: !config.user ? 'MISSING' : 'OK',
                pass: !config.pass ? 'MISSING' : 'OK',
                from: config.from
            };
            await logSystem('ERROR', 'CONTACT', 'SMTP configuration incomplete', missing);
            return NextResponse.json(
                { error: "Email nie jest skonfigurowany. Kontakt: p.wlasniewski.foto@gmail.com" },
                { status: 500 }
            );
        }

        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port || 587,
            secure: config.port === 465,
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });

        // Verify connection
        await transporter.verify();

        // Notify Admin
        const result = await transporter.sendMail({
            from: config.from,
            to: adminEmail,
            replyTo: email,
            subject: `Nowa wiadomość od: ${name}`,
            text: `
Imię: ${name}
Email: ${email}
Wiadomość:
${message}
            `,
            html: `
<h3>Nowa wiadomość ze strony</h3>
<p><strong>Imię:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Wiadomość:</strong></p>
<blockquote style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 0;">
    ${message.replace(/\n/g, '<br>')}
</blockquote>
            `,
        });

        await logSystem('INFO', 'CONTACT', 'Contact form email sent successfully', {
            messageId: result.messageId,
            to: adminEmail,
            from: email,
            name: name
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error sending contact email:", error);

        try {
            await logSystem('ERROR', 'CONTACT', 'Email sending failed', {
                errorMessage: error.message || 'Unknown error',
                errorCode: error.code || 'NO_CODE',
                errorCommand: error.command || 'NO_COMMAND',
                senderEmail: body.email || 'NO_EMAIL',
                senderName: body.name || 'NO_NAME'
            });
        } catch (logError) {
            console.error('Failed to log contact error:', logError);
        }

        return NextResponse.json(
            { error: "Błąd wysyłania. Spróbuj ponownie lub skontaktuj się pod: p.wlasniewski.foto@gmail.com" },
            { status: 500 }
        );
    }
}
