/**
 * Admin: szczegóły profilu + akcje.
 *
 * GET    /api/admin/foto-match/profiles/[id]
 * PATCH  /api/admin/foto-match/profiles/[id]
 *   body: { action: 'approve' | 'reject' | 'suspend' | 'reactivate', reason?: string }
 * DELETE /api/admin/foto-match/profiles/[id]  → soft delete (status=DELETED, is_active=false)
 *
 * Akcje:
 *   approve     → status=ACTIVE, is_active=true, verified_at=now, verified_by=admin.id
 *   reject      → status=REJECTED, is_active=false, rejection_reason=...
 *   suspend     → status=SUSPENDED, is_active=false, rejection_reason=...
 *   reactivate  → status=ACTIVE, is_active=true (np. po wyjasnieniu)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import {
    sendProfileApproved,
    sendProfileRejected,
    sendProfileSuspended,
    sendReferralRewarded,
} from '@/lib/foto-match/notifications';
import { tryAwardReferral } from '@/lib/foto-match/referral-reward';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
    return withAuth(request, async () => {
        const { id } = await ctx.params;
        const profileId = Number(id);
        if (!Number.isFinite(profileId)) {
            return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
        }

        const profile = await prisma.fotoMatchProfile.findUnique({
            where: { id: profileId },
            include: {
                user: {
                    select: { id: true, email: true, name: true, phone: true, created_at: true, is_active: true },
                },
                photos: { orderBy: { position: 'asc' } },
            },
        });
        if (!profile) {
            return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
        }
        return NextResponse.json({ profile });
    });
}

const patchSchema = z.object({
    action: z.enum(['approve', 'reject', 'suspend', 'reactivate']),
    reason: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest, ctx: Ctx) {
    return withAuth(request, async (req) => {
        const { id } = await ctx.params;
        const profileId = Number(id);
        if (!Number.isFinite(profileId)) {
            return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
        }
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'VALIDATION_FAILED', issues: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const adminId = req.user?.id ?? null;
        const { action, reason } = parsed.data;

        const updateData: any = {};
        switch (action) {
            case 'approve':
                if (!reason) {
                    // Wymagamy potwierdzenia: selfie + numer telefonu zweryfikowany + oświadczenie 18+
                }
                updateData.status = 'ACTIVE';
                updateData.is_active = true;
                updateData.verified_at = new Date();
                updateData.verified_by = adminId;
                updateData.rejection_reason = null;
                break;
            case 'reject':
                if (!reason) {
                    return NextResponse.json(
                        { error: 'REASON_REQUIRED' },
                        { status: 400 }
                    );
                }
                updateData.status = 'REJECTED';
                updateData.is_active = false;
                updateData.rejection_reason = reason;
                break;
            case 'suspend':
                updateData.status = 'SUSPENDED';
                updateData.is_active = false;
                updateData.rejection_reason = reason ?? 'Zawieszony przez administratora';
                break;
            case 'reactivate':
                updateData.status = 'ACTIVE';
                updateData.is_active = true;
                updateData.rejection_reason = null;
                break;
        }

        const updated = await prisma.fotoMatchProfile.update({
            where: { id: profileId },
            data: updateData,
        });

        // Best-effort: powiadomienia mailowe + auto-reward referral.
        const profileWithUser = await prisma.fotoMatchProfile.findUnique({
            where: { id: profileId },
            select: {
                id: true,
                user_id: true,
                display_name: true,
                rejection_reason: true,
                user: { select: { email: true, name: true } },
            },
        });
        if (profileWithUser?.user) {
            const u = profileWithUser.user;
            if (action === 'approve') {
                void sendProfileApproved({ to: u.email, name: u.name, displayName: profileWithUser.display_name });
                // Auto-reward polecającego (jeśli ten user był zaproszony).
                void tryAwardReferral({ invitedUserId: profileWithUser.user_id, invitedProfileId: profileWithUser.id })
                    .then((res) => {
                        if (res?.referrerEmail && res?.bonusLabel && res?.voucherCode) {
                            return sendReferralRewarded({
                                to: res.referrerEmail,
                                name: res.referrerName,
                                bonusLabel: res.bonusLabel,
                                voucherCode: res.voucherCode,
                                expiresAt: res.expiresAt,
                            });
                        }
                    })
                    .catch((e) => console.error('[REFERRAL_REWARD]', e?.message || e));
            } else if (action === 'reject') {
                void sendProfileRejected({ to: u.email, name: u.name, displayName: profileWithUser.display_name, reason: profileWithUser.rejection_reason });
            } else if (action === 'suspend') {
                void sendProfileSuspended({ to: u.email, name: u.name, reason: profileWithUser.rejection_reason });
            }
        }

        return NextResponse.json({ ok: true, profile: updated });
    });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
    return withAuth(request, async () => {
        const { id } = await ctx.params;
        const profileId = Number(id);
        if (!Number.isFinite(profileId)) {
            return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
        }

        // Soft delete — zachowujemy historię, ale wyłączamy.
        // Hard delete (CASCADE z user_id) tylko ręcznie z DB.
        const updated = await prisma.fotoMatchProfile.update({
            where: { id: profileId },
            data: { status: 'DELETED', is_active: false },
        });
        return NextResponse.json({ ok: true, profile: updated });
    });
}
