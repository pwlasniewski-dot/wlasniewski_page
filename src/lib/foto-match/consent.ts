/**
 * Walidator Model Release dla Foto-Match.
 *
 * Używany przed publikacją zdjęć z sesji match-pair w portfolio / na stronie.
 * Sprawdza, że obie strony mają aktywny `consent_publish=true` (oraz portfolio gdy publikujemy do portfolio).
 */
import prisma from '@/lib/db/prisma';

export type ConsentScope = 'publish' | 'portfolio' | 'marketing';

export type ConsentCheckResult = {
    ok: boolean;
    missing: Array<{ profile_id: number; scope: ConsentScope }>;
    withdrawn: Array<{ profile_id: number }>;
};

/**
 * Sprawdza czy obie osoby z match-pair mają zgodę publish (lub szerzej).
 */
export async function assertMatchPairCanPublish(
    profileA: number,
    profileB: number,
    scopes: ConsentScope[] = ['publish']
): Promise<ConsentCheckResult> {
    const consents = await prisma.fotoMatchSessionConsent.findMany({
        where: {
            OR: [
                { profile_id: profileA, match_partner_id: profileB },
                { profile_id: profileB, match_partner_id: profileA },
            ],
        },
        orderBy: { signed_at: 'desc' },
    });

    const missing: Array<{ profile_id: number; scope: ConsentScope }> = [];
    const withdrawn: Array<{ profile_id: number }> = [];

    for (const me of [profileA, profileB]) {
        const partner = me === profileA ? profileB : profileA;
        const myConsent = consents.find((c) => c.profile_id === me && c.match_partner_id === partner);

        if (!myConsent) {
            for (const s of scopes) missing.push({ profile_id: me, scope: s });
            continue;
        }
        if (myConsent.withdrawn_at) {
            withdrawn.push({ profile_id: me });
            continue;
        }
        for (const s of scopes) {
            const has =
                (s === 'publish' && myConsent.consent_publish) ||
                (s === 'portfolio' && myConsent.consent_portfolio) ||
                (s === 'marketing' && myConsent.consent_marketing);
            if (!has) missing.push({ profile_id: me, scope: s });
        }
    }

    return { ok: missing.length === 0 && withdrawn.length === 0, missing, withdrawn };
}
