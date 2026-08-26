import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateToken, hashPassword } from '@/lib/auth/jwt';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { safeReturnTo } from '@/lib/crm/delivery';
import { randomUUID } from 'node:crypto';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

export async function POST(req: NextRequest) {
    const correlationId = randomUUID();
    try {
        const ip = getClientIp(req);
        if (!rateLimit(`reset-password:ip:${ip}`, 10, 15 * 60_000).ok) {
            return NextResponse.json({ error: 'Zbyt wiele prób. Spróbuj ponownie później.' }, { status: 429 });
        }

        const { token, password, returnTo } = await req.json();

        if (typeof token !== 'string' || !token || typeof password !== 'string' || !password) {
            return NextResponse.json({ error: 'Token i nowe hasło są wymagane' }, { status: 400 });
        }

        if (password.length < 8 || password.length > 128) {
            return NextResponse.json({ error: 'Hasło musi mieć od 8 do 128 znaków' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                reset_token: token,
            },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Token jest nieprawidłowy lub wygasł' }, { status: 400 });
        }
        const password_hash = await hashPassword(password);
        const now = new Date();
        const changed = await prisma.user.updateMany({
            where: {
                id: user.id,
                reset_token: token,
                reset_token_expires: { gt: now },
                is_active: true,
                deleted_at: null,
                role: 'CLIENT',
            },
            data: {
                password_hash,
                reset_token: null,
                reset_token_expires: null,
                password_reset_required: false,
            },
        });
        if (changed.count !== 1) {
            return NextResponse.json({ error: 'Token jest nieprawidłowy, wygasł lub został już użyty' }, { status: 400 });
        }

        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, email: true, name: true, role: true },
        });
        if (!updatedUser || updatedUser.role !== 'CLIENT') {
            throw new Error('Nie odnaleziono konta po zmianie hasła');
        }

        const destination = safeReturnTo(returnTo);
        let sessionToken: string | null = null;
        try {
            sessionToken = await generateToken({
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                type: 'client',
            });
        } catch (sessionError) {
            await recordAdminIncidentSafely({
                severity: 'P1', category: 'AUTH', reasonCode: 'PASSWORD_RESET_SESSION_FAILED',
                summary: 'Hasło zmieniono, ale nie udało się utworzyć sesji klienta',
                clientId: updatedUser.id, clientEmail: updatedUser.email, correlationId,
                details: { error: sessionError instanceof Error ? sessionError.message : String(sessionError) },
            });
        }

        if (sessionToken) {
            try {
                await prisma.$transaction([
                    prisma.user.update({ where: { id: updatedUser.id }, data: { last_login: new Date() } }),
                    prisma.crmActivity.create({
                        data: {
                            client_id: updatedUser.id, client_email: updatedUser.email, action: 'login',
                            details: JSON.stringify({ source: 'password_setup', correlation_id: correlationId }),
                            ip_address: ip,
                            user_agent: req.headers.get('user-agent')?.substring(0, 500) || null,
                        },
                    }),
                ]);
            } catch (auditError) {
                await recordAdminIncidentSafely({
                    severity: 'P1', category: 'AUTH', reasonCode: 'PASSWORD_RESET_AUDIT_FAILED',
                    summary: 'Hasło i sesję utworzono, ale nie udało się zapisać audytu',
                    clientId: updatedUser.id, clientEmail: updatedUser.email, correlationId,
                    details: { error: auditError instanceof Error ? auditError.message : String(auditError) },
                });
            }
        }

        const response = NextResponse.json({
            success: true,
            message: 'Hasło zostało ustawione. Jesteś zalogowany.',
            token: sessionToken,
            sessionEstablished: Boolean(sessionToken),
            returnTo: destination,
            loginUrl: `/logowanie?returnTo=${encodeURIComponent(destination)}`,
            user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, role: updatedUser.role },
        });
        if (sessionToken) {
            response.cookies.set('client_token', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60,
            });
        }
        return response;
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}
