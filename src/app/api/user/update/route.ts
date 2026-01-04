import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = extractToken(authHeader);

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, phone, currentPassword, newPassword } = body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;

        // If email is changing, check if unique
        if (email && email !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return NextResponse.json({ error: 'Email jest już zajęty' }, { status: 400 });
            }
            updateData.email = email;
        }

        // If password is changing
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Aktualne hasło jest wymagane do zmiany' }, { status: 400 });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                return NextResponse.json({ error: 'Aktualne hasło jest nieprawidłowe' }, { status: 400 });
            }

            // Server-side validation for new password
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return NextResponse.json({ error: 'Nowe hasło nie spełnia wymogów bezpieczeństwa' }, { status: 400 });
            }

            updateData.password_hash = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                phone: updatedUser.phone
            }
        });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
