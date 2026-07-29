import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { getAdminEmail, sendEmail } from "@/lib/email/sender";
import { logSystem } from "@/lib/logger";
import { grantNewsletterConsent } from "@/lib/newsletter";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value: unknown) =>
    String(value ?? "").replace(
        /[&<>'"]/g,
        character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!,
    );

const optionalString = (value: unknown, maxLength: number) => {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value !== "string") return null;
    const normalized = value.trim();
    return normalized.length <= maxLength ? normalized : null;
};

export async function POST(request: Request) {
    let body: Record<string, unknown> = {};

    try {
        if (!rateLimit(`contact:${getClientIp(request)}`, 5, 15 * 60_000).ok) {
            return NextResponse.json(
                { error: "Zbyt wiele wiadomości. Spróbuj ponownie za 15 minut." },
                { status: 429 },
            );
        }

        body = await request.json();
        const name = optionalString(body.name, 120);
        const email = optionalString(body.email, 254);
        const message = optionalString(body.message, 5_000);
        const company = optionalString(body.company, 160);
        const phone = optionalString(body.phone, 40);
        const serviceType = optionalString(body.serviceType, 120);
        const leadSource = optionalString(body.lead_source, 120);
        const leadCampaign = optionalString(body.lead_campaign, 120);
        const formContext = optionalString(body.form_context, 20);
        const marketingConsent = body.marketing_consent === true;

        if ([name, email, message, company, phone, serviceType, leadSource, leadCampaign, formContext].includes(null)) {
            return NextResponse.json({ error: "Nieprawidłowe dane formularza" }, { status: 400 });
        }

        if (!name || !message || (!email && !phone)) {
            await logSystem("WARN", "CONTACT", "Contact form validation failed", {
                hasName: Boolean(name),
                hasEmail: Boolean(email),
                hasPhone: Boolean(phone),
                hasMessage: Boolean(message),
            });
            return NextResponse.json(
                { error: "Podaj imię, wiadomość oraz telefon lub email" },
                { status: 400 },
            );
        }

        if (email && !EMAIL_PATTERN.test(email)) {
            return NextResponse.json({ error: "Nieprawidłowy adres email" }, { status: 400 });
        }
        if (marketingConsent && !email) {
            return NextResponse.json(
                { error: "Adres email jest wymagany do zapisu na newsletter" },
                { status: 400 },
            );
        }

        const isB2B = formContext === "b2b";
        const source = leadSource || (isB2B ? "b2b-contact" : "website-contact");
        const notes = [
            company ? `Firma: ${company}` : "",
            leadCampaign && leadCampaign !== "none" ? `Kampania: ${leadCampaign}` : "",
        ].filter(Boolean).join("\n") || null;

        // Najpierw zapisujemy lead. Awaria SMTP nie może powodować utraty klienta.
        const inquiry = await prisma.$transaction(async transaction => {
            const savedInquiry = await transaction.inquiry.create({
                data: {
                    name,
                    email: email || "",
                    phone: phone || null,
                    message,
                    session_type: serviceType || null,
                    source,
                    notes,
                    status: "new",
                },
            });

            if (marketingConsent && email) {
                await grantNewsletterConsent(transaction, {
                    email,
                    source: `${source}-form`,
                    request,
                });
            }

            return savedInquiry;
        });

        const adminEmail = await getAdminEmail();
        if (!adminEmail) {
            await logSystem("WARN", "CONTACT", "Lead saved without notification: admin email is not configured", {
                inquiryId: inquiry.id,
            });
            return NextResponse.json({ success: true, inquiryId: inquiry.id, notificationSent: false });
        }

        const safe = {
            name: escapeHtml(name),
            email: escapeHtml(email || "—"),
            message: escapeHtml(message),
            company: escapeHtml(company),
            phone: escapeHtml(phone),
            serviceType: escapeHtml(serviceType),
            source: escapeHtml(source),
            campaign: escapeHtml(leadCampaign),
            marketingConsent: marketingConsent ? "tak" : "nie",
        };

        try {
            const result = await sendEmail({
                to: adminEmail,
                replyTo: email || undefined,
                subject: `${isB2B ? "[B2B RFQ]" : "Nowe zapytanie:"} ${name.replace(/[\r\n]/g, "")}`,
                html: `
<h3>${isB2B ? "Nowe zapytanie ofertowe B2B" : "Nowe zapytanie fotograficzne"}</h3>
<p><strong>Imię:</strong> ${safe.name}</p>
<p><strong>Email:</strong> ${safe.email}</p>
${company ? `<p><strong>Firma:</strong> ${safe.company}</p>` : ""}
${phone ? `<p><strong>Telefon:</strong> ${safe.phone}</p>` : ""}
${serviceType ? `<p><strong>Usługa:</strong> ${safe.serviceType}</p>` : ""}
<p><strong>Źródło:</strong> ${safe.source}${leadCampaign && leadCampaign !== "none" ? ` (${safe.campaign})` : ""}</p>
<p><strong>Newsletter:</strong> ${safe.marketingConsent}</p>
<hr />
<p><strong>Wiadomość:</strong></p>
<blockquote style="border-left:2px solid #ccc;padding-left:10px;margin-left:0;white-space:pre-wrap">
${safe.message.replace(/\n/g, "<br>")}
</blockquote>`,
            });

            await logSystem("INFO", "CONTACT", "Lead saved and notification sent", {
                inquiryId: inquiry.id,
                messageId: result.messageId,
                source,
            });
            return NextResponse.json({ success: true, inquiryId: inquiry.id, notificationSent: true });
        } catch (notificationError) {
            await logSystem("WARN", "CONTACT", "Lead saved but notification email failed", {
                inquiryId: inquiry.id,
                error: notificationError instanceof Error ? notificationError.message : String(notificationError),
            });
            return NextResponse.json({ success: true, inquiryId: inquiry.id, notificationSent: false });
        }
    } catch (error: unknown) {
        console.error("Error saving contact inquiry:", error);

        try {
            await logSystem("ERROR", "CONTACT", "Contact inquiry failed", {
                errorMessage: error instanceof Error ? error.message : "Unknown error",
                senderEmail: body.email || "NO_EMAIL",
                senderName: body.name || "NO_NAME",
            });
        } catch (logError) {
            console.error("Failed to log contact error:", logError);
        }

        return NextResponse.json(
            { error: "Nie udało się zapisać wiadomości. Spróbuj ponownie później." },
            { status: 500 },
        );
    }
}
