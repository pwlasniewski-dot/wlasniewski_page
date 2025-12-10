import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET all inquiries
export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const inquiries = await prisma.inquiry.findMany({
                orderBy: { created_at: 'desc' },
            });
            return NextResponse.json({ success: true, inquiries });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
        }
    });
}
