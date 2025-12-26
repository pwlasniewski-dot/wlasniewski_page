import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'secret-key';

        let decoded: any;
        try {
            decoded = verify(token, secret);
        } catch (err) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        if (decoded.role !== 'challenge_user') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const challenges = await prisma.photoChallenge.findMany({
            where: { invitee_user_id: decoded.userId },
            include: {
                package: true,
                location: true,
                gallery: {
                    select: {
                        is_published: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json({ success: true, challenges });

    } catch (error) {
        console.error('Fetch client challenges error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
