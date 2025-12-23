import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import bcrypt from 'bcryptjs';

// GET all users
export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const users = await prisma.adminUser.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    created_at: true,
                    last_login: true,
                },
                orderBy: { created_at: 'desc' }
            });
            return NextResponse.json({ success: true, users });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }
    });
}

// POST create new user
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const { email, password, name, role } = body;

            if (!email || !password) {
                return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
            }

            const existingUser = await prisma.adminUser.findUnique({ where: { email } });
            if (existingUser) {
                return NextResponse.json({ error: 'User already exists' }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.adminUser.create({
                data: {
                    email,
                    password_hash: hashedPassword,
                    name,
                    role: role || 'USER',
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    created_at: true,
                }
            });

            return NextResponse.json({ success: true, user });
        } catch (error) {
            console.error('Create user error:', error);
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }
    });
}
