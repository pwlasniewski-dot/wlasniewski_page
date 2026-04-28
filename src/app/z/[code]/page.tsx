import { redirect, notFound } from 'next/navigation';
import { Prisma } from '@prisma/client';
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

    // Defense-in-depth: normalizeShortCode already strips non-alphanum & lowercases,
    // but we still validate the shape before touching the DB.
    if (!/^[a-z0-9]{4,12}$/.test(normalized)) {
        notFound();
    }

    const pattern = `${normalized}%`;
    // Parameterized tagged-template query (Prisma escapes $1 safely).
    const challenges = await prisma.$queryRaw<Array<{ unique_link: string }>>(
        Prisma.sql`SELECT unique_link FROM photo_challenges WHERE LOWER(REPLACE(unique_link, '-', '')) LIKE ${pattern} LIMIT 2`
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
