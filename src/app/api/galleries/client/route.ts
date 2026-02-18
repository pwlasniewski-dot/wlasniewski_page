import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = extractToken(authHeader);

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Find user to get their email
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Find all galleries where client_email matches OR client_id matches
        const galleries = await prisma.clientGallery.findMany({
            where: {
                is_active: true,
                OR: [
                    { client_email: user.email },
                    { client_id: user.id }
                ]
            },
            include: {
                _count: {
                    select: { photos: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json({
            success: true,
            galleries: galleries.map(g => ({
                id: g.id,
                access_code: g.access_code,
                client_name: g.client_name,
                standard_count: g.standard_count,
                photo_count: g._count.photos,
                expires_at: g.expires_at,
                created_at: g.created_at
            }))
        });

    } catch (error) {
        console.error('Fetch client galleries error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
