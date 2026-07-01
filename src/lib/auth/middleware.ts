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

async function resolveAuthenticatedUser(request: NextRequest, queryTokenParam?: string) {
    // Try multiple header names - case variations
    let authHeader = request.headers.get('authorization');
    if (!authHeader) {
        authHeader = request.headers.get('Authorization');
    }
    if (!authHeader) {
        authHeader = request.headers.get('AUTHORIZATION');
    }

    const queryToken = queryTokenParam ? request.nextUrl.searchParams.get(queryTokenParam) : null;
    const token = extractToken(authHeader) || queryToken;

    if (!token) {
        return {
            user: null,
            error: NextResponse.json(
                { error: 'Unauthorized - No token provided' },
                { status: 401 }
            ),
        };
    }

    const payload = await verifyToken(token);

    if (!payload) {
        return {
            user: null,
            error: NextResponse.json(
                { error: 'Unauthorized - Invalid token' },
                { status: 401 }
            ),
        };
    }

    // Verify user exists in database
    const user = await prisma.adminUser.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, name: true }
    });

    if (!user) {
        return {
            user: null,
            error: NextResponse.json(
                { error: 'Unauthorized - User not found' },
                { status: 401 }
            ),
        };
    }

    return { user, error: null };
}
// Middleware to check authentication
export async function requireAuth(request: NextRequest) {
    try {
        const { user, error } = await resolveAuthenticatedUser(request);

        if (error || !user) {
            return error;
        }

        // Attach user to request (for TypeScript typing)
        (request as AuthenticatedRequest).user = user;

        return null; // null = authorized, continue
    } catch (error) {
        console.error('[requireAuth] Error:', error);
        return NextResponse.json(
            { error: 'Internal Authentication Error' },
            { status: 500 }
        );
    }
}

export async function requireAuthWithQueryToken(
    request: NextRequest,
    queryTokenParam: string = 'admin_token'
) {
    try {
        const { user, error } = await resolveAuthenticatedUser(request, queryTokenParam);

        if (error || !user) {
            return error;
        }

        (request as AuthenticatedRequest).user = user;
        return null;
    } catch (error) {
        console.error('[requireAuthWithQueryToken] Error:', error);
        return NextResponse.json(
            { error: 'Internal Authentication Error' },
            { status: 500 }
        );
    }
}

// Helper to use in API routes
export async function withAuth(
    request: NextRequest,
    handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
    const authError = await requireAuth(request);
    if (authError) {
        return authError;
    }

    try {
        return await handler(request as AuthenticatedRequest);
    } catch (error) {
        console.error('[withAuth] Handler error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function withAuthWithQueryToken(
    request: NextRequest,
    handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
    queryTokenParam: string = 'admin_token'
) {
    const authError = await requireAuthWithQueryToken(request, queryTokenParam);
    if (authError) {
        return authError;
    }

    try {
        return await handler(request as AuthenticatedRequest);
    } catch (error) {
        console.error('[withAuthWithQueryToken] Handler error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
