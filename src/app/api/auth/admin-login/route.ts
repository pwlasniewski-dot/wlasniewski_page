
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyPassword, generateToken } from '@/lib/auth/jwt';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const ip = getClientIp(req);
        if (!rateLimit(`admin-login:ip:${ip}`, 10, 15 * 60_000).ok ||
            !rateLimit(`admin-login:email:${normalizedEmail}`, 5, 15 * 60_000).ok) {
            return NextResponse.json({ error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' }, { status: 429 });
        }

        const admin = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
        // Also allow finding by name for flexibility if needed, but email is safer

        if (!admin) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isValid = await verifyPassword(password, admin.password_hash);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate token with role: ADMIN
        const token = await generateToken({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            type: 'admin' // Explicit type to differentiate from users
        });

        const response = NextResponse.json({
            success: true,
            token,
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role
            }
        });

        // Set HttpOnly cookie for Next.js middleware and direct browser routes (like PDF download)
        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return response;

    } catch (error) {
        console.error('Admin Login error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
