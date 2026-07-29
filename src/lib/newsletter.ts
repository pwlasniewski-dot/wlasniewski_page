import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';

export const NEWSLETTER_CONSENT_VERSION = '2026-07';

type NewsletterDatabase = Pick<PrismaClient, 'emailSubscriber' | 'user'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeNewsletterEmail(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const email = value.trim().toLowerCase();
    return EMAIL_PATTERN.test(email) && email.length <= 254 ? email : null;
}

function consentEvidence(request: Request) {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const ip = (forwarded || request.headers.get('x-real-ip') || 'unknown').slice(0, 64);
    const userAgent = (request.headers.get('user-agent') || 'unknown').slice(0, 255);

    return { ip, userAgent };
}

export async function grantNewsletterConsent(
    db: NewsletterDatabase,
    input: {
        email: string;
        source: string;
        request: Request;
    },
) {
    const email = normalizeNewsletterEmail(input.email);
    if (!email) throw new Error('INVALID_NEWSLETTER_EMAIL');

    const source = input.source.trim().slice(0, 120) || 'website';
    const { ip, userAgent } = consentEvidence(input.request);
    const existing = await db.emailSubscriber.findUnique({
        where: { email },
        select: { unsubscribe_token: true },
    });
    const unsubscribeToken = existing?.unsubscribe_token || crypto.randomUUID();
    const now = new Date();

    return db.emailSubscriber.upsert({
        where: { email },
        create: {
            email,
            source,
            is_active: true,
            subscribed_at: now,
            consent_version: NEWSLETTER_CONSENT_VERSION,
            consent_ip: ip,
            consent_user_agent: userAgent,
            unsubscribe_token: unsubscribeToken,
        },
        update: {
            source,
            is_active: true,
            subscribed_at: now,
            consent_version: NEWSLETTER_CONSENT_VERSION,
            consent_ip: ip,
            consent_user_agent: userAgent,
            unsubscribe_token: unsubscribeToken,
            unsubscribed_at: null,
        },
    });
}

export async function withdrawNewsletterConsent(
    db: NewsletterDatabase,
    input: { token?: string; email?: string },
) {
    const token = typeof input.token === 'string' ? input.token.trim() : '';
    const email = normalizeNewsletterEmail(input.email);

    const subscriber = token
        ? await db.emailSubscriber.findUnique({ where: { unsubscribe_token: token } })
        : email
            ? await db.emailSubscriber.findUnique({ where: { email } })
            : null;

    if (!subscriber) return { changed: false, email: null };

    const now = new Date();
    await db.emailSubscriber.update({
        where: { id: subscriber.id },
        data: {
            is_active: false,
            unsubscribed_at: now,
        },
    });
    await db.user.updateMany({
        where: { email: subscriber.email },
        data: { marketing_consent_at: null },
    });

    return { changed: true, email: subscriber.email };
}
