// Get current authenticated user - GET /api/auth/me
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        return NextResponse.json({
            success: true,
            user: req.user,
        });
    });
}
