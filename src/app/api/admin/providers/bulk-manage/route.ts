
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

            if (!['BLOCK', 'UNBLOCK', 'SET_COMMISSION'].includes(action)) {
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
            }

            if (action === 'SET_COMMISSION') {
                const { value } = body;
                const commission = parseInt(value);

                if (isNaN(commission) || commission < 0 || commission > 100) {
                    return NextResponse.json({ error: 'Invalid commission value' }, { status: 400 });
                }

                // Update existing profiles
                await prisma.photographerProfile.updateMany({
                    where: {
                        user: {
                            id: { in: ids }
                        }
                    },
                    data: {
                        base_commission: commission
                    }
                });

                // For users without profile (rare but possible), we might need to create one, 
                // but for bulk op, we skip complex logic and just update existing ones.

                return NextResponse.json({ success: true, message: `Updated commission for providers` });
            }

            const isActive = action === 'UNBLOCK';

            await prisma.user.updateMany({
                where: {
                    id: { in: ids },
                    role: 'PHOTOGRAPHER'
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
