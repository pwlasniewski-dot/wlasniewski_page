// Test database connection - GET /api/test-db
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
    try {
        // Test query
        const userCount = await prisma.adminUser.count();

        // Get all settings
        const settings = await prisma.setting.findMany();

        return NextResponse.json({
            success: true,
            message: 'Database connection successful (Prisma + SQLite)',
            userCount,
            settingsCount: settings.length,
            settings,
        });
    } catch (error: any) {
        console.error('Database test error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Database connection failed',
                details: error.message,
            },
            { status: 500 }
        );
    }
}
