import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { buildPasswordSetupUrl } from '@/lib/crm/delivery';
import { ensurePasswordSetupToken } from '@/lib/auth/password-setup-token';
import { safeReturnTo } from '@/lib/auth/return-to';

export async function POST(req: NextRequest) {
    try {
        const { email, returnTo } = await req.json();
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail) {
            return NextResponse.json({ error: 'Email jest wymagany' }, { status: 400 });
        }
        const ip = getClientIp(req);
        if (
            !rateLimit(`forgot-password:ip:${ip}`, 5, 15 * 60_000).ok ||
            !rateLimit(`forgot-password:email:${normalizedEmail}`, 3, 15 * 60_000).ok
        ) {
            return NextResponse.json(
                { success: true, message: 'Jeśli adres istnieje, wysłano instrukcje resetowania' },
                { status: 200 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user || user.role !== 'CLIENT' || !user.is_active || user.deleted_at) {
            // We return 200 for security reasons even if user doesn't exist
            return NextResponse.json({ success: true, message: 'Jeśli adres istnieje, wysłano instrukcje resetowania' });
        }

        const resetToken = await ensurePasswordSetupToken(user, 60 * 60 * 1000);

        const resetLink = buildPasswordSetupUrl(resetToken, safeReturnTo(returnTo));

        await sendEmail({
            to: user.email,
            subject: 'Resetowanie hasła - Przemysław Właśniewski Fotografia',
            template: 'password-reset',
            data: {
                name: user.name || 'Użytkowniku',
                resetLink
            }
        });

        return NextResponse.json({ success: true, message: 'Wysłano e-mail z instrukcjami' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}
