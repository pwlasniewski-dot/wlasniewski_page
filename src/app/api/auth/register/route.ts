import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hashPassword, generateToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password } = body;
        // Referral token: priorytet body.referralToken (frontend), fallback do cookie fm_ref_token (landing).
        const referralToken: string | null =
            (typeof body.referralToken === 'string' && body.referralToken.trim()) ||
            req.cookies.get('fm_ref_token')?.value ||
            null;

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

        // Foto-Match referral: jeśli user przyszedł z linku polecającego,
        // podlinkuj rekord referral z świeżo stworzonym userem (status REGISTERED).
        // Voucher zostanie wygenerowany dopiero po zatwierdzeniu profilu.
        if (referralToken) {
            try {
                await prisma.fotoMatchReferral.updateMany({
                    where: {
                        invite_token: referralToken,
                        invited_user_id: null,
                        status: 'PENDING',
                    },
                    data: {
                        invited_user_id: user.id,
                        invited_email: user.email,
                        status: 'REGISTERED',
                    },
                });
            } catch (e) {
                console.error('[REGISTER_REFERRAL_LINK]', (e as any)?.message || e);
            }
        }

        const res = NextResponse.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });
        // Wyczyść cookie referral (już zapisany na koncie).
        if (referralToken) {
            res.cookies.set('fm_ref_token', '', { maxAge: 0, path: '/' });
        }
        return res;

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
