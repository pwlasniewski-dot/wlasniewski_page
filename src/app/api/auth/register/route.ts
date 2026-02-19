import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hashPassword, generateToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json({ error: 'Hasło nie spełnia wymogów bezpieczeństwa (8 znaków, A-Z, a-z, znak specjalny)' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password_hash: hashedPassword,
                role: 'CLIENT',
                // Self-registered clients start with limited access.
                // Admin must explicitly grant offers/contracts access.
            } as any,
        });

        // Set default permissions for self-registered user (no offers/contracts by default)
        const defaultPerms = JSON.stringify({ galleries: true, bookings: true, gift_cards: true, offers: false, contracts: false });
        await prisma.$executeRawUnsafe(
            `UPDATE users SET permissions = $1::jsonb WHERE id = $2`,
            defaultPerms,
            user.id
        );

        // Auto-login logic
        const token = await generateToken({ id: user.id, email: user.email });

        return NextResponse.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
