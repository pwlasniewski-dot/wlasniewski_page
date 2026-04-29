import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
        }

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Nieprawidłowe dane logowania' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        // SECURITY: always reply with the same generic message to avoid email enumeration.
        const genericFail = NextResponse.json(
            { success: false, error: 'Nieprawidłowe dane logowania' },
            { status: 401 }
        );

        if (!user) {
            return genericFail;
        }

        // For 'Foto Wyzwanie' we use password_hash field. SECURITY: must compare via bcrypt,
        // never plain-text equality (was a P0 bug — 2026-04-28).
        const u = user as any;
        if (!u.password_hash) {
            return genericFail;
        }
        const passwordOk = await bcrypt.compare(password, u.password_hash);
        if (!passwordOk) {
            return genericFail;
        }

        const token = sign(
            { userId: user.id, email: user.email, role: 'challenge_user' },
            secret,
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
