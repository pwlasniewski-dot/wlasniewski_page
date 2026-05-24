import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyPassword, generateToken } from '@/lib/auth/jwt';
import { logCrmActivity } from '@/lib/crm-activity';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logSystem } from '@/lib/logger';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const ip = getClientIp(req);
        const ua = req.headers.get('user-agent') || '';
        const ipLimit = rateLimit(`login:ip:${ip}`, 20, 15 * 60_000);
        if (!ipLimit.ok) {
            await logSystem('WARN', 'AUTH', 'RATE_LIMIT_IP login', { ip, email, ua });
            return NextResponse.json({ error: 'RATE_LIMITED', message: 'Zbyt wiele prób z tego adresu IP. Spróbuj za 15 minut.' }, { status: 429 });
        }
        const emailLimit = rateLimit(`login:email:${normalizedEmail}`, 5, 15 * 60_000);
        if (!emailLimit.ok) {
            await logSystem('WARN', 'AUTH', 'RATE_LIMIT_EMAIL login', { ip, email, ua });
            return NextResponse.json({ error: 'RATE_LIMITED', message: 'Zbyt wiele nieudanych prób logowania. Spróbuj za 15 minut.' }, { status: 429 });
        }

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                email: true,
                name: true,
                password_hash: true,
                password_reset_required: true,
                deleted_at: true,
            },
        });
        if (!user) {
            await logSystem('WARN', 'AUTH', 'LOGIN_FAIL_USER_NOT_FOUND', { ip, email, ua });
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Soft-deleted users nie moga sie logowac
        if ((user as any).deleted_at) {
            await logSystem('WARN', 'AUTH', 'LOGIN_FAIL_DELETED', { ip, email, ua, userId: user.id });
            return NextResponse.json({ error: 'Konto zostalo usuniete.' }, { status: 410 });
        }

        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            // Record failed login attempt
            await prisma.user.update({
                where: { id: user.id },
                data: { last_failed_login: new Date() }
            });
            await logSystem('WARN', 'AUTH', 'LOGIN_FAIL_BAD_PASSWORD', { ip, email, ua, userId: user.id });
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check if password reset is required (e.g., after security incident)
        if ((user as any).password_reset_required) {
            await logSystem('INFO', 'AUTH', 'LOGIN_BLOCKED_PASSWORD_RESET_REQUIRED', { ip, email, ua, userId: user.id });
            return NextResponse.json({ 
                error: 'PASSWORD_RESET_REQUIRED',
                message: 'Twoje hasło wygasło ze względów bezpieczeństwa. Musisz ustawić nowe hasło.'
            }, { status: 403 });
        }

        // Record successful login attempt
        await prisma.user.update({
            where: { id: user.id },
            data: { last_login: new Date() }
        });
        await logSystem('INFO', 'AUTH', 'LOGIN_SUCCESS', { ip, email, ua, userId: user.id });

        const token = await generateToken({ id: user.id, email: user.email });

        // Log CRM activity
        logCrmActivity({
            clientId: user.id,
            clientEmail: user.email,
            action: 'login',
            details: { name: user.name },
            request: req,
        });

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                last_login: new Date() // Return for immediate UI feedback if needed
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
