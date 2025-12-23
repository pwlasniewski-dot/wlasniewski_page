
import { NextResponse } from "next/server";

import { getAdminEmail, sendEmail } from "@/lib/email/sender";
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

        const adminEmail = await getAdminEmail();
        if (!adminEmail) {
            throw new Error("Admin email is not configured");
        }

        // Send email using shared utility
        const result = await sendEmail({
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

        const fallbackEmail = await getAdminEmail().catch(() => undefined);
        return NextResponse.json(
            { error: fallbackEmail ? `Błąd wysyłania. Spróbuj ponownie lub skontaktuj się pod: ${fallbackEmail}` : 'Błąd wysyłania wiadomości. Spróbuj ponownie później.' },
            { status: 500 }
        );
    }
}
