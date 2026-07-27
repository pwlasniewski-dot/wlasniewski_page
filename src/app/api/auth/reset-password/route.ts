import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/jwt';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        if (!rateLimit(`reset-password:ip:${ip}`, 10, 15 * 60_000).ok) {
            return NextResponse.json({ error: 'Zbyt wiele prób. Spróbuj ponownie później.' }, { status: 429 });
        }

        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token i nowe hasło są wymagane' }, { status: 400 });
        }

        if (password.length < 8 || password.length > 128) {
            return NextResponse.json({ error: 'Hasło musi mieć od 8 do 128 znaków' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                reset_token: token,
                reset_token_expires: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Token jest nieprawidłowy lub wygasł' }, { status: 400 });
        }

        const password_hash = await hashPassword(password);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash,
                reset_token: null,
                reset_token_expires: null,
                password_reset_required: false // Clear forced reset flag after successful password change
            }
        });

        return NextResponse.json({ success: true, message: 'Hasło zostało zmienione' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}
