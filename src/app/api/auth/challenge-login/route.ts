import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sign } from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        const user = await prisma.challengeUser.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Nieprawidłowe dane logowania' },
                { status: 401 }
            );
        }

        // For 'Foto Wyzwanie' we use password_hash field.
        const u = user as any;
        if (u.password_hash && u.password_hash !== password) {
            return NextResponse.json(
                { success: false, error: 'Nieprawidłowe hasło' },
                { status: 401 }
            );
        }

        const token = sign(
            { userId: user.id, email: user.email, role: 'challenge_user' },
            process.env.JWT_SECRET || 'secret-key',
            { expiresIn: '30d' }
        );

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Challenge login error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
