
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSMTPConfig } from "@/lib/email/sender";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, message } = body;

        // Validation
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: "Wszystkie pola są wymagane" },
                { status: 400 }
            );
        }

        const config = await getSMTPConfig();
        // @ts-ignore
        const adminEmail = config.auth?.user || config.from;

        const transporter = nodemailer.createTransport(config as any);

        // Notify Admin
        await transporter.sendMail({
            from: config.from,
            to: adminEmail, // Send to admin
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error sending contact email:", error);
        return NextResponse.json(
            { error: "Wystąpił błąd podczas wysyłania wiadomości." },
            { status: 500 }
        );
    }
}
