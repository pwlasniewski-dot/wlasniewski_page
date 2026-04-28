import prisma from '@/lib/db/prisma';
import { Metadata } from 'next';
import InviteClient from './InviteClient';
import { deriveShortCode } from '@/lib/photo-challenge/short-code';

interface Props {
    params: Promise<{ unique_link: string }>;
}

async function getChallenge(uniqueLink: string) {
    try {
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link: uniqueLink },
            include: {
                package: true,
                location: true,
            },
        });
        return challenge;
    } catch (error) {
        console.error('Error fetching challenge for metadata:', error);
        return null;
    }
}

/** Mask a contact string so the invitee can verify identity without doxxing the inviter. */
function maskContact(value: string | null | undefined, type: string | null | undefined): string {
    if (!value) return '';
    if (type === 'phone') {
        // "+48 600 100 200" -> "+48 600 *** 200"
        const digits = value.replace(/\D/g, '');
        if (digits.length < 6) return value.replace(/.(?=.{2})/g, '*');
        const last3 = digits.slice(-3);
        const first3 = digits.slice(0, digits.length - 3 - 3);
        return `${first3} *** ${last3}`.trim();
    }
    // email
    const [local, domain] = value.split('@');
    if (!domain) return value;
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { unique_link } = await params;
    const challenge = await getChallenge(unique_link);

    if (!challenge) {
        return {
            title: 'Zaproszenie nie odnalezione | Foto Wyzwanie',
        };
    }

    const title = `🎁 ${challenge.inviter_name} zaprasza Cię na sesję — Wałycz Studio`;
    const description = `Sesja "${challenge.package?.name || 'Foto Wyzwanie'}" jest już opłacona. Zobacz szczegóły, portfolio i opinie. Możesz odrzucić jednym kliknięciem — bez zobowiązań.`;

    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        'https://wlasniewski.pl';
    const ogImage = `${baseUrl}/api/og/challenge/${unique_link}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${baseUrl}/foto-wyzwanie/invite/${unique_link}`,
            siteName: 'Wałycz Studio · wlasniewski.pl',
            locale: 'pl_PL',
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: `Zaproszenie od ${challenge.inviter_name}`,
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

export default async function InvitePage({ params }: Props) {
    const { unique_link } = await params;
    const challenge = await getChallenge(unique_link);

    // Mark as viewed (best-effort, does not block render).
    if (challenge && !challenge.viewed_at) {
        prisma.photoChallenge
            .update({ where: { id: challenge.id }, data: { viewed_at: new Date() } })
            .catch(() => null);
    }

    // Pass as plain object to client component
    const initialData = challenge ? {
        ...challenge,
        // Serialize Date fields to ISO strings for client component boundary
        created_at: challenge.created_at?.toISOString?.() || null,
        acceptance_deadline: challenge.acceptance_deadline?.toISOString?.() || null,
        viewed_at: challenge.viewed_at?.toISOString?.() || null,
        accepted_at: challenge.accepted_at?.toISOString?.() || null,
        rejected_at: challenge.rejected_at?.toISOString?.() || null,
        session_date: challenge.session_date?.toISOString?.() || null,
        completed_at: challenge.completed_at?.toISOString?.() || null,
        // Verification short code (e.g. "A3F9C2") that the inviter can confirm verbally.
        short_code: deriveShortCode(challenge.unique_link),
        // Masked inviter contact so the invitee can verify, without leaking PII.
        inviter_contact_masked: maskContact(challenge.inviter_contact, challenge.inviter_contact_type),
        inviter_contact_type: challenge.inviter_contact_type,
        package: challenge.package ? {
            package_name: challenge.package.name,
            package_description: challenge.package.description || undefined,
            challenge_price: challenge.package.challenge_price,
            base_price: challenge.package.base_price,
            included_items: challenge.package.included_items || undefined,
            accent_color: challenge.package.accent_color || '#d4af37',
        } : undefined,
        location: challenge.location ? {
            location_name: challenge.location.name,
            location_description: challenge.location.description || undefined,
            address: challenge.location.address || undefined,
            google_maps_url: challenge.location.google_maps_url || undefined,
        } : undefined,
    } : null;

    return <InviteClient initialChallenge={initialData as any} uniqueLink={unique_link} />;
}
