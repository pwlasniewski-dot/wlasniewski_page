import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Direct password update - no auth required (emergency reset)
// This is for when admin is locked out
export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        if (!rateLimit(`emergency-reset:${ip}`, 3, 60 * 60_000).ok) {
            return NextResponse.json({ error: 'Zbyt wiele prób. Spróbuj ponownie później.' }, { status: 429 });
        }
        const body = await request.json();
        const { email, newPassword, masterKey } = body;

        // SECURITY: Master key MUST be set via environment variable.
        // If ADMIN_MASTER_KEY is not set, this endpoint is disabled.
        const expectedKey = process.env.ADMIN_MASTER_KEY;
        if (!expectedKey || expectedKey.length < 32) {
            console.error('[Emergency Reset] ADMIN_MASTER_KEY env var not set — endpoint disabled');
            return NextResponse.json({ error: 'Endpoint niedostępny' }, { status: 503 });
        }

        if (masterKey !== expectedKey) {
            return NextResponse.json({ error: 'Nieprawidłowy klucz' }, { status: 401 });
        }

        if (!email || !newPassword) {
            return NextResponse.json({ error: 'Email i nowe hasło są wymagane' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Hasło musi mieć minimum 8 znaków' }, { status: 400 });
        }

        // Find admin
        const admin = await prisma.adminUser.findUnique({
            where: { email }
        });

        if (!admin) {
            return NextResponse.json({ error: 'Admin nie znaleziony' }, { status: 404 });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.adminUser.update({
            where: { email },
            data: { password_hash: newPasswordHash }
        });

        console.log(`[Admin Password Reset] Password updated for ${email}`);

        return NextResponse.json({
            success: true,
            message: 'Hasło zostało zmienione. Możesz się teraz zalogować.'
        });

    } catch (error) {
        console.error('[Direct Password Update] Error:', error);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}
