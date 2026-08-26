import { NextRequest, NextResponse } from 'next/server';
import { extractToken, generateToken, verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { isClientRecordOwner, isVerifiedAdminIdentity } from '@/lib/auth/document-access';
import { galleryShareSessionType, matchesGalleryShareSession } from '@/lib/galleries/share-session';

type GalleryAccessRecord = {
    id: number;
    access_code: string;
    gallery_mode: string;
    client_id: number | null;
    client_email: string;
    group_password: string | null;
};

const COOKIE_PREFIX = 'gallery_access_';
const COOKIE_MAX_AGE_SECONDS = 12 * 60 * 60;

export type GalleryAccessDecision = {
    allowed: boolean;
    reason: 'owner' | 'share-password' | 'gallery-session' | 'group-gallery' | 'denied';
};

function cookieName(galleryId: number) {
    return `${COOKIE_PREFIX}${galleryId}`;
}

export async function authorizeIndividualGallery(
    request: NextRequest,
    gallery: GalleryAccessRecord,
): Promise<GalleryAccessDecision> {
    if (gallery.gallery_mode === 'GROUP') {
        return { allowed: false, reason: 'group-gallery' };
    }

    const configuredPassword = (gallery.group_password || '').trim();
    const gallerySession = request.cookies.get(cookieName(gallery.id))?.value;
    if (gallerySession && configuredPassword) {
        const decoded = await verifyToken(gallerySession);
        const expectedType = galleryShareSessionType(gallery.id, configuredPassword);
        // The HMAC fingerprint binds the session to the current password. A
        // rotation/removal invalidates previously issued cookies immediately.
        if (decoded?.id === gallery.id && matchesGalleryShareSession(decoded.type, expectedType)) {
            return { allowed: true, reason: 'gallery-session' };
        }
    }

    const accountTokens = [
        extractToken(request.headers.get('authorization')),
        request.cookies.get('client_token')?.value || null,
        request.cookies.get('user_token')?.value || null,
        request.cookies.get('admin_token')?.value || null,
    ].filter((value): value is string => Boolean(value));

    for (const accountToken of accountTokens) {
        const decoded = await verifyToken(accountToken);
        const admin = decoded?.type === 'admin' && decoded.role === 'ADMIN'
            ? await prisma.adminUser.findUnique({
                where: { id: decoded.id },
                select: { id: true, email: true, role: true },
            })
            : null;
        if (decoded && isVerifiedAdminIdentity(decoded, admin)) {
            return { allowed: true, reason: 'owner' };
        }
        if (decoded) {
            const activeClient = await revalidateActiveClient(decoded);
            if (activeClient && isClientRecordOwner(gallery, activeClient)) {
                return { allowed: true, reason: 'owner' };
            }
        }
    }

    const providedPassword = (request.headers.get('x-gallery-password') || '').trim();
    if (configuredPassword && providedPassword && providedPassword === configuredPassword) {
        return { allowed: true, reason: 'share-password' };
    }

    return { allowed: false, reason: 'denied' };
}

export async function attachIndividualGallerySession(
    response: NextResponse,
    gallery: Pick<GalleryAccessRecord, 'id' | 'access_code' | 'client_email' | 'group_password'>,
    access: GalleryAccessDecision,
) {
    if (access.reason !== 'share-password' && access.reason !== 'gallery-session') return;
    const configuredPassword = (gallery.group_password || '').trim();
    if (!configuredPassword) return;

    const token = await generateToken({
        id: gallery.id,
        email: gallery.client_email,
        type: galleryShareSessionType(gallery.id, configuredPassword),
    });

    response.cookies.set(cookieName(gallery.id), token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE_SECONDS,
        path: `/api/galleries/${gallery.access_code}`,
    });
}

export function galleryAccessDenied(decision: GalleryAccessDecision) {
    const isGroup = decision.reason === 'group-gallery';
    return NextResponse.json(
        {
            success: false,
            code: isGroup ? 'GROUP_AUTH_REQUIRED' : 'GALLERY_AUTH_REQUIRED',
            error: isGroup
                ? 'Ta galeria wymaga logowania uczestnika.'
                : 'Zaloguj się jako właściciel albo podaj hasło galerii.',
        },
        { status: 401 },
    );
}
