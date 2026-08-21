import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { logSystem } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { consumeAnalyticsRateLimit, trustedClientSignal } from '@/lib/analytics/ingestGuard';
import { AERO_SITE } from '@/lib/aeroanaliza/content';
import { aeroInquirySchema } from '@/lib/aeroanaliza/inquiry-schema';
import { Prisma } from '@prisma/client';

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);

export async function POST(request: Request) {
    const origin = request.headers.get('origin');
    if (origin) {
        try {
            const hostname = new URL(origin).hostname.toLowerCase();
            const configuredHosts = [process.env.URL, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL]
                .flatMap(value => {
                    if (!value) return [];
                    try { return [new URL(value).hostname.toLowerCase()]; } catch { return []; }
                });
            const allowedHosts = new Set(['aeroanaliza.pl', 'www.aeroanaliza.pl', 'localhost', '127.0.0.1', ...configuredHosts]);
            const allowed = allowedHosts.has(hostname);
            if (!allowed) return NextResponse.json({ error: 'Niedozwolone źródło zapytania.' }, { status: 403 });
        } catch {
            return NextResponse.json({ error: 'Niedozwolone źródło zapytania.' }, { status: 403 });
        }
    }

    const clientSignal = trustedClientSignal(request.headers);
    let sharedLimitAllowed = true;
    try {
        sharedLimitAllowed = await consumeAnalyticsRateLimit({ signal: `aero-inquiry:${clientSignal}`, cost: 1, limit: 5 });
    } catch (limitError) {
        // Availability fallback only. The process-local limiter below remains
        // active if the shared table or hashing secret is temporarily missing.
        console.warn('[aeroanaliza] Shared inquiry limiter unavailable', limitError);
    }
    if (!sharedLimitAllowed || !rateLimit(`aero-inquiry:${clientSignal}`, 5, 15 * 60_000).ok) {
        return NextResponse.json({ error: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.' }, { status: 429 });
    }

    let parsed: z.infer<typeof aeroInquirySchema>;
    try {
        parsed = aeroInquirySchema.parse(await request.json());
    } catch (error) {
        return NextResponse.json({ error: 'Sprawdź wymagane pola i poprawność adresu e-mail.' }, { status: 400 });
    }

    // Cichy sukces dla botów — bez zapisu i bez wiadomości.
    if (parsed.website) return NextResponse.json({ success: true });

    const notes = [
        parsed.company && `Firma: ${parsed.company}`,
        `Lokalizacja: ${parsed.location}`,
        parsed.objectType && `Obiekt: ${parsed.objectType}`,
        `Termin: ${parsed.timeframe}`,
        `Preferowany kontakt: ${parsed.preferredContact}`,
        parsed.sourcePage && `Strona: ${parsed.sourcePage}`,
        parsed.landingPage && `Landing: ${parsed.landingPage}`,
        parsed.referrer && `Referrer: ${parsed.referrer}`,
        (parsed.utmSource || parsed.utmMedium || parsed.utmCampaign) && `UTM: ${parsed.utmSource || '-'} / ${parsed.utmMedium || '-'} / ${parsed.utmCampaign || '-'}`,
    ].filter(Boolean).join('\n');

    try {
        const inquiryData = {
            name: parsed.name,
            email: parsed.email,
            phone: parsed.phone || null,
            message: parsed.message,
            session_type: parsed.serviceType,
            source: `aeroanaliza:${parsed.utmSource || 'direct'}`,
            notes,
            status: 'new',
        };
        let inquiry;
        try {
            inquiry = await prisma.inquiry.create({ data: { ...inquiryData, external_id: parsed.requestId } });
        } catch (creationError) {
            if (creationError instanceof Prisma.PrismaClientKnownRequestError && creationError.code === 'P2022') {
                // Safe rollout fallback: an inquiry must not be lost when the
                // application reaches an instance before the additive migration.
                // Idempotency becomes effective immediately after migrate deploy.
                await logSystem('WARN', 'CONTACT', 'Aero idempotency column unavailable; saving lead without external_id', {});
                inquiry = await prisma.inquiry.create({ data: inquiryData });
            } else {
                throw creationError;
            }
        }

        const safe = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, escapeHtml(String(value || '—'))])) as Record<string, string>;
        try {
            await sendEmail({
                to: AERO_SITE.email,
                replyTo: parsed.email,
                subject: `[Aero Analiza] ${parsed.serviceType} — ${parsed.location}`.replace(/[\r\n]/g, ' '),
                html: `<h2>Nowe zapytanie Aero Analiza</h2><p><strong>Usługa:</strong> ${safe.serviceType}</p><p><strong>Klient:</strong> ${safe.name}</p><p><strong>Firma:</strong> ${safe.company}</p><p><strong>E-mail:</strong> ${safe.email}</p><p><strong>Telefon:</strong> ${safe.phone}</p><p><strong>Lokalizacja:</strong> ${safe.location}</p><p><strong>Obiekt:</strong> ${safe.objectType}</p><p><strong>Termin:</strong> ${safe.timeframe}</p><p><strong>Preferowany kontakt:</strong> ${safe.preferredContact}</p><hr><p style="white-space:pre-wrap">${safe.message}</p><hr><pre style="white-space:pre-wrap">${escapeHtml(notes)}</pre>`,
            });
        } catch (notificationError) {
            await logSystem('WARN', 'CONTACT', 'Aero lead saved, email notification failed', { inquiryId: inquiry.id, error: notificationError instanceof Error ? notificationError.message : String(notificationError) });
        }

        return NextResponse.json({ success: true, inquiryId: inquiry.id }, { status: 201 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({ success: true, duplicate: true }, { status: 200 });
        }
        await logSystem('ERROR', 'CONTACT', 'Aero lead could not be saved', { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: 'Nie udało się zapisać zapytania. Napisz na pwlasniewski@gmail.com.' }, { status: 500 });
    }
}
