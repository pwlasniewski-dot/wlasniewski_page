import { NextRequest, NextResponse } from 'next/server';
import { extractToken, generateToken, verifyToken } from '@/lib/auth/jwt';

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

    const gallerySession = request.cookies.get(cookieName(gallery.id))?.value;
    if (gallerySession) {
        const decoded = await verifyToken(gallerySession);
        if (decoded?.id === gallery.id && decoded.type === `gallery:${gallery.id}`) {
            return { allowed: true, reason: 'gallery-session' };
        }
    }

    const accountToken = extractToken(request.headers.get('authorization'))
        || request.cookies.get('client_token')?.value
        || request.cookies.get('user_token')?.value
        || request.cookies.get('admin_token')?.value;

    if (accountToken) {
        const decoded = await verifyToken(accountToken);
        const emailMatches = decoded?.email?.toLowerCase() === gallery.client_email.toLowerCase();
        const idMatches = !!gallery.client_id && decoded?.id === gallery.client_id;
        const privileged = decoded?.role === 'ADMIN' || decoded?.role === 'PHOTOGRAPHER';
        if (decoded && (emailMatches || idMatches || privileged)) {
            return { allowed: true, reason: 'owner' };
        }
    }

    const configuredPassword = (gallery.group_password || '').trim();
    const providedPassword = (request.headers.get('x-gallery-password') || '').trim();
    if (configuredPassword && providedPassword && providedPassword === configuredPassword) {
        return { allowed: true, reason: 'share-password' };
    }

    return { allowed: false, reason: 'denied' };
}

export async function attachIndividualGallerySession(
    response: NextResponse,
    gallery: Pick<GalleryAccessRecord, 'id' | 'access_code' | 'client_email'>,
) {
    const token = await generateToken({
        id: gallery.id,
        email: gallery.client_email,
        type: `gallery:${gallery.id}`,
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
