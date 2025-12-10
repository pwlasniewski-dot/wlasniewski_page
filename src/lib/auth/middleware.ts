// Auth middleware for API routes
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, extractToken } from './jwt';
import prisma from '@/lib/db/prisma';

export interface AuthenticatedRequest extends NextRequest {
    user?: {
        id: number;
        email: string;
        name: string | null;
    };
}

// Middleware to check authentication
export async function requireAuth(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

    if (!token) {
        return NextResponse.json(
            { error: 'Unauthorized - No token provided' },
            { status: 401 }
        );
    }

    const payload = await verifyToken(token);

    if (!payload) {
        return NextResponse.json(
            { error: 'Unauthorized - Invalid token' },
            { status: 401 }
        );
    }

    // Verify user exists in database
    const user = await prisma.adminUser.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, name: true }
    });

    if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized - User not found' },
            { status: 401 }
        );
    }

    // Attach user to request (for TypeScript typing)
    (request as AuthenticatedRequest).user = user;

    return null; // null = authorized, continue
}

// Helper to use in API routes
export async function withAuth(
    request: NextRequest,
    handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    return handler(request as AuthenticatedRequest);
}
