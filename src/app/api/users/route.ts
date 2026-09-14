import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import bcrypt from 'bcryptjs';
import { AdminAccountError, adminAccountInput, lockAdminAccounts } from '@/lib/admin/accounts';

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
            return NextResponse.json({ success: true, users, currentAdminId: req.user!.id }, { headers: { 'Cache-Control': 'private, no-store' } });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }
    });
}

// POST create new user
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { email, password, name, role } = adminAccountInput(await req.json().catch(() => null), true);
            const hashedPassword = await bcrypt.hash(password!, 10);
            const user = await prisma.$transaction(async tx => {
                await lockAdminAccounts(tx, req.user!.id);
                const existing = await tx.adminUser.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
                if (existing) throw new AdminAccountError('Konto z tym adresem e-mail już istnieje.', 409);
                return tx.adminUser.create({ data: { email, password_hash: hashedPassword, name, role: role || 'ADMIN' }, select: { id: true, email: true, name: true, role: true, created_at: true } });
            });

            return NextResponse.json({ success: true, user });
        } catch (error) {
            return NextResponse.json({ error: error instanceof AdminAccountError ? error.message : 'Nie udało się utworzyć konta.' }, { status: error instanceof AdminAccountError ? error.status : 500 });
        }
    });
}
