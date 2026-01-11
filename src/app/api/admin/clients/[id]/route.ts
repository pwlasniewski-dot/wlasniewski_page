
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return withAuth(request, async (req) => {
        try {
            const userId = parseInt(id);

            const client = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    // Full history for the detail modal
                    orders: {
                        orderBy: { created_at: 'desc' },
                        include: {
                            gift_card: true
                        }
                    },
                    assigned_bookings: {
                        orderBy: { date: 'desc' }
                    },
                    assigned_galleries: {
                        orderBy: { created_at: 'desc' },
                        include: {
                            photos: {
                                take: 1 // Just to see if empty
                            }
                        }
                    },
                    baskets: {
                        include: { items: true },
                        orderBy: { updated_at: 'desc' },
                        take: 1
                    }
                }
            });

            if (!client) {
                return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, client });
        } catch (error) {
            console.error('Fetch client details error:', error);
            return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
        }
    });
}
