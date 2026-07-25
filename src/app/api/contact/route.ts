
import { NextResponse } from "next/server";

import { getAdminEmail, sendEmail } from "@/lib/email/sender";
import { logSystem } from "@/lib/logger";
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]!));

export async function POST(request: Request) {
    let body: any = {};
    try {
        if (!rateLimit(`contact:${getClientIp(request)}`, 5, 15 * 60_000).ok) {
            return NextResponse.json({ error: 'Zbyt wiele wiadomości. Spróbuj ponownie za 15 minut.' }, { status: 429 });
        }
        body = await request.json();
        const { name, email, message, company, phone, serviceType, lead_source, lead_campaign } = body;

        // Validation
        if (!name || !email || !message) {
            await logSystem('WARN', 'CONTACT', 'Contact form validation failed', { name, email, hasMessage: !!message });
            return NextResponse.json(
                { error: "Wszystkie pola są wymagane" },
                { status: 400 }
            );
        }
        if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string' ||
            name.length > 120 || email.length > 254 || message.length > 5_000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return NextResponse.json({ error: 'Nieprawidłowe dane formularza' }, { status: 400 });
        }

        const safe = { name: escapeHtml(name), email: escapeHtml(email), message: escapeHtml(message), company: escapeHtml(company), phone: escapeHtml(phone), serviceType: escapeHtml(serviceType), leadSource: escapeHtml(lead_source), leadCampaign: escapeHtml(lead_campaign) };

        const adminEmail = await getAdminEmail();
        if (!adminEmail) {
            throw new Error("Admin email is not configured");
        }

        const isB2B = company || serviceType;
        const subjectPrefix = isB2B ? '[B2B RFQ]' : 'Nowa wiadomość od:';

        // Send email using shared utility
        const result = await sendEmail({
            to: adminEmail,
            replyTo: email,
            subject: `${subjectPrefix} ${name.replace(/[\r\n]/g, '')} ${company ? `(${String(company).replace(/[\r\n]/g, '')})` : ''}`,
            text: `
Imię: ${name}
Email: ${email}
${company ? `Firma: ${company}` : ''}
${phone ? `Telefon: ${phone}` : ''}
${serviceType ? `Usługa: ${serviceType}` : ''}
${lead_source && lead_source !== 'direct' ? `🎯 Źródło leadu: ${lead_source.toUpperCase()}${lead_campaign !== 'none' ? ` (kampania: ${lead_campaign})` : ''}` : ''}

Wiadomość:
${message}
            `,
            html: `
<h3>${isB2B ? 'Nowe zapytanie ofertowe (B2B)' : 'Nowa wiadomość ze strony'}</h3>
<p><strong>Imię:</strong> ${safe.name}</p>
<p><strong>Email:</strong> ${safe.email}</p>
${company ? `<p><strong>Firma:</strong> ${safe.company}</p>` : ''}
${phone ? `<p><strong>Telefon:</strong> ${safe.phone}</p>` : ''}
${serviceType ? `<p><strong>Typ usługi:</strong> ${safe.serviceType}</p>` : ''}
${lead_source && lead_source !== 'direct' ? `<p><strong>🎯 Źródło leadu:</strong> <span style="background: #fbbf24; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${safe.leadSource.toUpperCase()}</span> ${lead_campaign !== 'none' ? `(kampania: ${safe.leadCampaign})` : ''}</p>` : ''}
<hr />
<p><strong>Wiadomość:</strong></p>
<blockquote style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 0; white-space: pre-wrap;">
    ${safe.message.replace(/\n/g, '<br>')}
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
