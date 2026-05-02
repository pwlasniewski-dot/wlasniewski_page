/**
 * Auth helper for photographer panel & their bookings.
 * Akceptuje token JWT z User (CLIENT/PHOTOGRAPHER/ADMIN) — przez AuthContext (login klienta).
 * Zwraca usera tylko gdy ma role PHOTOGRAPHER lub ADMIN.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, extractToken } from './jwt';
import prisma from '@/lib/db/prisma';

export type PhotographerAuth = {
    id: number;
    email: string;
    name: string | null;
    role: string;
    photographer_profile_id: number | null;
    isAdmin: boolean;
};

export async function getPhotographerAuth(request: NextRequest): Promise<PhotographerAuth | null> {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = extractToken(authHeader);
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, name: true, role: true, photographer_profile_id: true, is_active: true },
    });
    if (!user || !user.is_active) return null;
    if (user.role !== 'PHOTOGRAPHER' && user.role !== 'ADMIN') return null;

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        photographer_profile_id: user.photographer_profile_id,
        isAdmin: user.role === 'ADMIN',
    };
}

export function unauthorized() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
