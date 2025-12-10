// Login API Route - POST /api/auth/login
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyPassword, generateToken, hashPassword } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Check if this is the first login (no users in database)
        const userCount = await prisma.adminUser.count();

        // If no users exist and credentials match .env, create first admin
        if (userCount === 0) {
            const adminEmail = process.env.ADMIN_EMAIL;
            const adminPassword = process.env.ADMIN_PASSWORD;

            if (email === adminEmail && password === adminPassword) {
                // Create first admin user
                const passwordHash = await hashPassword(password);
                const newUser = await prisma.adminUser.create({
                    data: {
                        email,
                        password_hash: passwordHash,
                        name: 'Administrator',
                    },
                });

                // Generate token
                const token = await generateToken({ id: newUser.id, email: newUser.email });

                return NextResponse.json({
                    success: true,
                    token,
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        name: newUser.name,
                    },
                    message: 'First admin user created successfully',
                });
            }
        }

        // Normal login flow - find user by email
        const user = await prisma.adminUser.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Update last login
        await prisma.adminUser.update({
            where: { id: user.id },
            data: { last_login: new Date() },
        });

        // Generate JWT token
        const token = await generateToken({ id: user.id, email: user.email });

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
