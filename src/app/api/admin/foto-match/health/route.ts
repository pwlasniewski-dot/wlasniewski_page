/**
 * Foto-Match Admin Health Check.
 * GET /api/admin/foto-match/health
 * Zwraca listę "alertów" z konkretnym linkiem akcji.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Alert = {
    severity: 'critical' | 'warning' | 'info';
    code: string;
    label: string;
    count: number;
    href: string;
};

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [
            pendingProfilesOld,
            reportsPending,
            photosFlagged,
            activeNoPhone,
            consentMissing,
        ] = await Promise.all([
            prisma.fotoMatchProfile.count({ where: { status: 'PENDING', created_at: { lt: dayAgo } } }),
            prisma.fotoMatchReport.count({ where: { status: 'PENDING' } }),
            prisma.fotoMatchPhoto.count({ where: { ai_status: 'FLAGGED' } }),
            prisma.fotoMatchProfile.count({ where: { status: 'ACTIVE', is_active: true, phone_verified_at: null } }),
            // Match-pary bez zapisanego consent_publish dla obu stron
            prisma.fotoMatchSwipe.count({
                where: {
                    is_match: true,
                    matched_at: { lt: new Date(now.getTime() - 60 * 60 * 1000) }, // > 1h od match
                },
            }).then(async (matchCount) => {
                if (matchCount === 0) return 0;
                const consents = await prisma.fotoMatchSessionConsent.count({ where: { consent_publish: true, withdrawn_at: null } });
                // przybliżenie: jeśli liczba consentów < liczba match-par * 2, jakieś brakują
                return Math.max(0, matchCount - Math.floor(consents / 2));
            }),
        ]);

        const alerts: Alert[] = [];

        if (pendingProfilesOld > 0) {
            alerts.push({
                severity: 'critical',
                code: 'PROFILES_PENDING_OLD',
                label: `${pendingProfilesOld} profili PENDING > 24h`,
                count: pendingProfilesOld,
                href: '/admin/foto-match/profiles?status=PENDING',
            });
        }
        if (reportsPending > 0) {
            alerts.push({
                severity: 'critical',
                code: 'REPORTS_PENDING',
                label: `${reportsPending} zgłoszeń PENDING`,
                count: reportsPending,
                href: '/admin/foto-match/reports?status=PENDING',
            });
        }
        if (photosFlagged > 0) {
            alerts.push({
                severity: 'warning',
                code: 'PHOTOS_FLAGGED',
                label: `${photosFlagged} zdjęć oflagowanych przez AI`,
                count: photosFlagged,
                href: '/admin/foto-match/photos?status=FLAGGED',
            });
        }
        if (activeNoPhone > 0) {
            alerts.push({
                severity: 'warning',
                code: 'ACTIVE_WITHOUT_PHONE',
                label: `${activeNoPhone} aktywnych profili bez weryfikacji telefonu`,
                count: activeNoPhone,
                href: '/admin/foto-match/profiles?status=ACTIVE',
            });
        }
        if (consentMissing > 0) {
            alerts.push({
                severity: 'info',
                code: 'CONSENT_MISSING',
                label: `${consentMissing} match-par bez Model Release > 1h`,
                count: consentMissing,
                href: '/admin/foto-match/profiles?status=ACTIVE',
            });
        }

        return NextResponse.json({
            ok: true,
            healthy: alerts.length === 0,
            critical: alerts.filter((a) => a.severity === 'critical').length,
            warnings: alerts.filter((a) => a.severity === 'warning').length,
            alerts,
            checked_at: now.toISOString(),
        });
    });
}
