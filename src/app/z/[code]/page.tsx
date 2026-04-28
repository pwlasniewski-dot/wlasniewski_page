import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { normalizeShortCode } from '@/lib/photo-challenge/short-code';

interface Props {
    params: Promise<{ code: string }>;
}

/**
 * Short URL redirect: /z/A3F9C2 → /foto-wyzwanie/invite/<full-uuid>
 *
 * This makes the link short, brandable, and credibility-friendly when shared
 * via WhatsApp / Messenger / SMS. Example: https://wlasniewski.pl/z/A3F9C2
 */
export default async function ShortLinkRedirect({ params }: Props) {
    const { code } = await params;
    const normalized = normalizeShortCode(code);

    if (normalized.length < 4) {
        notFound();
    }

    // Look up by prefix on unique_link with dashes stripped.
    // Postgres has no straightforward "stripped startsWith" so we use raw query.
    const challenges = await prisma.$queryRawUnsafe<Array<{ unique_link: string }>>(
        `SELECT unique_link FROM photo_challenges WHERE LOWER(REPLACE(unique_link, '-', '')) LIKE $1 LIMIT 2`,
        `${normalized}%`
    );

    if (!challenges || challenges.length === 0) {
        notFound();
    }

    // If exactly one match: redirect. If collision (extremely unlikely): show ambiguity page.
    if (challenges.length === 1) {
        redirect(`/foto-wyzwanie/invite/${challenges[0].unique_link}`);
    }

    notFound();
}
