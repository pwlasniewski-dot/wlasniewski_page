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
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
        }

        let decoded: any;
        try {
            decoded = verify(token, secret);
        } catch (err) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        if (decoded.role !== 'challenge_user') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // Pobierz user zeby znać email (do wyzwań jako inviter)
        const me = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, name: true, email: true },
        });
        if (!me) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const challenges = await prisma.photoChallenge.findMany({
            where: {
                OR: [
                    { invitee_user_id: decoded.userId },
                    ...(me?.email ? [
                        { inviter_email: me.email },
                        { inviter_contact: me.email },
                    ] : []),
                ],
            },
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

        // Dorzuć pole `role` żeby UI mogło pokazać "Zapraszasz" vs "Zaproszony/a"
        const enriched = challenges.map((ch) => ({
            ...ch,
            role: ch.invitee_user_id === decoded.userId ? 'invitee' : 'inviter',
        }));

        return NextResponse.json({ success: true, user: me, challenges: enriched });

    } catch (error) {
        console.error('Fetch client challenges error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
