
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const { ids, action } = body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
            }

            if (!['BLOCK', 'UNBLOCK'].includes(action)) {
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
            }

            const isActive = action === 'UNBLOCK';

            await prisma.user.updateMany({
                where: {
                    id: { in: ids },
                    role: 'PHOTOGRAPHER' // Ensure we only touch providers
                },
                data: {
                    is_active: isActive
                }
            });

            return NextResponse.json({ success: true, message: `Updated ${ids.length} providers` });
        } catch (error) {
            console.error('Bulk manage error:', error);
            return NextResponse.json({ error: 'Failed to update providers' }, { status: 500 });
        }
    });
}
