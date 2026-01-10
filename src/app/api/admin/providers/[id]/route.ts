import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET Single provider details
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return withAuth(request, async (req) => {
        try {
            // Need to await params in Next.js 15+ if accessing async prop, but routes are usually static params or we parse URL
            // Here assuming standard route handler params
            const id = parseInt(params.id);

            if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

            const provider = await prisma.user.findUnique({
                where: { id },
                include: {
                    photographer_profile: true,
                    owned_packages: {
                        include: { service: true }
                    },
                    payouts: {
                        take: 10,
                        orderBy: { created_at: 'desc' }
                    },
                    assigned_bookings: {
                        take: 20,
                        orderBy: { created_at: 'desc' },
                        select: {
                            id: true,
                            client_name: true,
                            date: true,
                            status: true,
                            client_rating: true,  // NEW
                            client_review: true,  // NEW
                            package: true
                        }
                    }
                }
            });

            if (!provider || provider.role !== 'PHOTOGRAPHER') {
                return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, provider });
        } catch (error) {
            console.error('Fetch provider detail error:', error);
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
    });
}
