import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

// Direct password update - no auth required (emergency reset)
// This is for when admin is locked out
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, newPassword, masterKey } = body;

        // Simple master key protection (set in env)
        const expectedKey = process.env.ADMIN_MASTER_KEY || 'WLASNIEWSKI2024RESET';

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
