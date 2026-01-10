import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET all providers (users with PHOTOGRAPHER role)
export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const providers = await prisma.user.findMany({
                where: {
                    role: 'PHOTOGRAPHER'
                },
                include: {
                    photographer_profile: true,
                    owned_packages: {
                        include: { service: true }
                    },
                    _count: {
                        select: { assigned_bookings: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            const providersWithStats = providers.map(p => {
                // Deduplicate categories based on packages
                const cats = new Set(p.owned_packages.map(pkg => pkg.service.name));

                return {
                    id: p.id,
                    name: p.name,
                    email: p.email,
                    is_active: p.is_active,
                    packages_count: p.owned_packages.length,
                    bookings_count: p._count.assigned_bookings,
                    commission_rate: p.photographer_profile?.base_commission || 15,
                    bio: p.photographer_profile?.bio || '',
                    joined_at: p.created_at,
                    rating: p.photographer_profile?.rating || 0,
                    categories: Array.from(cats)
                };
            });

            return NextResponse.json({ success: true, providers: providersWithStats });
        } catch (error) {
            console.error('Fetch providers error:', error);
            return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
        }
    });
}
