// Test database connection - GET /api/test-db
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const userCount = await prisma.adminUser.count();
        const settingsCount = await prisma.setting.count();

        return NextResponse.json({
            success: true,
            message: 'Database connection successful',
            userCount,
            settingsCount,
        });
    } catch (error) {
        console.error('Database test error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Database connection failed',
            },
            { status: 500 }
        );
    }
}
