import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyPassword, generateToken } from '@/lib/auth/jwt';
import { logCrmActivity } from '@/lib/crm-activity';
import { logSystem } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || request.headers.get('cf-connecting-ip')
            || 'unknown';
        const ua = request.headers.get('user-agent') || '';

        if (!normalizedEmail || !password) {
            await logSystem('WARN', 'AUTH', 'CLIENT_LOGIN_FAIL_MISSING_FIELDS', { ip, ua, email: normalizedEmail || null });
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                email: true,
                name: true,
                password_hash: true,
                role: true,
                is_active: true,
            },
        });

        if (!user || !user.is_active) {
            await logSystem('WARN', 'AUTH', 'CLIENT_LOGIN_FAIL_INVALID_OR_INACTIVE', { ip, ua, email: normalizedEmail });
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Check password
        const isPasswordValid = await verifyPassword(password, user.password_hash);

        if (!isPasswordValid) {
            await logSystem('WARN', 'AUTH', 'CLIENT_LOGIN_FAIL_BAD_PASSWORD', { ip, ua, email: normalizedEmail, userId: user.id });
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Persist successful login time for admin analytics and client activity views.
        await prisma.user.update({
            where: { id: user.id },
            data: { last_login: new Date() },
        });
        await logSystem('INFO', 'AUTH', 'CLIENT_LOGIN_SUCCESS', { ip, ua, email: normalizedEmail, userId: user.id });

        // Generate JWT token using the same jose system
        const token = await generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            type: 'client',
        });

        // Create response with cookie
        const response = NextResponse.json(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                token,
            },
            { status: 200 }
        );

        // Log CRM activity (await to avoid dropped writes)
        await logCrmActivity({
            clientId: user.id,
            clientEmail: user.email,
            action: 'login',
            details: { name: user.name },
            request,
        });

        // Set secure cookie
        response.cookies.set('client_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
    } catch (error) {
        await logSystem('ERROR', 'AUTH', 'CLIENT_LOGIN_SERVER_ERROR', { error: String(error) });
        console.error('Error during client login:', error);
        return NextResponse.json(
            { error: 'Failed to login' },
            { status: 500 }
        );
    }
}
