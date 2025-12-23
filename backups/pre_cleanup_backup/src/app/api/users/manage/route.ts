import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import bcrypt from 'bcryptjs';

// PUT update user (password, role, name)
export async function PUT(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');

            if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

            const body = await req.json();
            const { password, name, role } = body;

            const updateData: any = {};
            if (name) updateData.name = name;
            if (role) updateData.role = role;
            if (password) {
                updateData.password_hash = await bcrypt.hash(password, 10);
            }

            const user = await prisma.adminUser.update({
                where: { id: Number(id) },
                data: updateData,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                }
            });

            return NextResponse.json({ success: true, user });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
        }
    });
}

// DELETE user
export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');

            if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

            // Prevent deleting the last admin or self (optional check, but good practice)
            // For now just delete
            await prisma.adminUser.delete({
                where: { id: Number(id) }
            });

            return NextResponse.json({ success: true });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }
    });
}
