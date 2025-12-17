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

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                gift_cards: true,
                orders: {
                    take: 5,
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                gift_cards: user.gift_cards,
                orders: user.orders
            }
        });

    } catch (error) {
        console.error('Fetch user error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
