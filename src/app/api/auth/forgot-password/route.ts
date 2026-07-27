import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email/sender';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
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

        if (!user) {
            // We return 200 for security reasons even if user doesn't exist
            return NextResponse.json({ success: true, message: 'Jeśli adres istnieje, wysłano instrukcje resetowania' });
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                reset_token: resetToken,
                reset_token_expires: resetTokenExpires
            }
        });

        const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}/logowanie/ustaw-nowe-haslo?token=${resetToken}`;

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
