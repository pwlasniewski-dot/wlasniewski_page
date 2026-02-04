import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authError = await requireAuth(request);
        if (authError) return authError;

        const templates = await prisma.offer.findMany({
            where: { is_template: true },
            orderBy: { created_at: 'desc' },
            include: {
                sections: {
                    include: { items: true },
                    orderBy: { order: 'asc' }
                }
            }
        });

        return NextResponse.json({ templates });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}
