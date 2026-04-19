import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyPassword, generateToken } from '@/lib/auth/jwt';
import { logCrmActivity } from '@/lib/crm-activity';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            // Record failed login attempt
            await prisma.user.update({
                where: { id: user.id },
                data: { last_failed_login: new Date() }
            });
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Record successful login attempt
        await prisma.user.update({
            where: { id: user.id },
            data: { last_login: new Date() }
        });

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
