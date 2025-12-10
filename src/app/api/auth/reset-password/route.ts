import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// POST: Request password reset (send email with token)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email jest wymagany' }, { status: 400 });
        }

        // Find admin user
        const admin = await prisma.adminUser.findUnique({
            where: { email }
        });

        if (!admin) {
            // Don't reveal if email exists - security best practice
            return NextResponse.json({
                success: true,
                message: 'Jeśli konto istnieje, link resetujący został wysłany na email.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = await bcrypt.hash(resetToken, 10);
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Store token in AdminUser (need to add fields to schema)
        // For now, we'll use a separate table or store in notes field temporarily
        // Better approach: add reset_token and reset_token_expiry to AdminUser model

        // Use production URL
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wlasniewski.pl';
        const resetUrl = `${siteUrl}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #d4af37; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background: #d4af37; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Hasła Admin</h1>
        </div>
        <div class="content">
            <p>Witaj,</p>
            <p>Otrzymaliśmy prośbę o reset hasła do panelu admina.</p>
            <p>Kliknij poniższy przycisk aby zresetować hasło:</p>
            <a href="${resetUrl}" class="button">Resetuj Hasło</a>
            <p>Lub skopiuj link:</p>
            <p style="background: #fff; padding: 10px; border: 1px solid #ddd; word-break: break-all;">${resetUrl}</p>
            <p><strong>Link ważny przez 1 godzinę.</strong></p>
            <p>Jeśli to nie Ty wysłałeś prośbę, zignoruj ten email.</p>
        </div>
        <div class="footer">
            <p>© Przemysław Właśniewski Fotografia</p>
        </div>
    </div>
</body>
</html>
        `;

        // Send email
        await sendEmail({
            to: email,
            subject: 'Reset Hasła Admin - Właśniewski Fotografia',
            html: emailHTML
        });

        // Store token temporarily in database (use Setting table as workaround)
        await prisma.setting.upsert({
            where: { setting_key: `reset_token_${email}` },
            update: {
                setting_value: JSON.stringify({
                    token: resetTokenHash,
                    expiry: resetTokenExpiry.toISOString()
                })
            },
            create: {
                setting_key: `reset_token_${email}`,
                setting_value: JSON.stringify({
                    token: resetTokenHash,
                    expiry: resetTokenExpiry.toISOString()
                })
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Link resetujący został wysłany na email.'
        });

    } catch (error) {
        console.error('[Password Reset] Error:', error);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}

// PUT: Reset password with token
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, token, newPassword } = body;

        if (!email || !token || !newPassword) {
            return NextResponse.json({ error: 'Brakujące dane' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Hasło musi mieć min 8 znaków' }, { status: 400 });
        }

        // Retrieve stored token
        const storedTokenData = await prisma.setting.findUnique({
            where: { setting_key: `reset_token_${email}` }
        });

        if (!storedTokenData || !storedTokenData.setting_value) {
            return NextResponse.json({ error: 'Nieprawidłowy lub wygasły token' }, { status: 400 });
        }

        const { token: tokenHash, expiry } = JSON.parse(storedTokenData.setting_value);

        // Check expiry
        if (new Date() > new Date(expiry)) {
            await prisma.setting.delete({ where: { setting_key: `reset_token_${email}` } });
            return NextResponse.json({ error: 'Token wygasł' }, { status: 400 });
        }

        // Verify token
        const isValid = await bcrypt.compare(token, tokenHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 400 });
        }

        // Update password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await prisma.adminUser.update({
            where: { email },
            data: { password_hash: newPasswordHash }
        });

        // Delete used token
        await prisma.setting.delete({ where: { setting_key: `reset_token_${email}` } });

        return NextResponse.json({
            success: true,
            message: 'Hasło zostało zmienione'
        });

    } catch (error) {
        console.error('[Password Reset] PUT error:', error);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}
