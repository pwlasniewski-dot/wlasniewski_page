import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import bcrypt from 'bcryptjs';
import { AdminAccountError, adminAccountId, adminAccountInput, lockAdminAccounts, protectAdminAccount } from '@/lib/admin/accounts';

function failure(error: unknown) {
    return NextResponse.json({ error: error instanceof AdminAccountError ? error.message : 'Nie udało się zmienić konta.' }, { status: error instanceof AdminAccountError ? error.status : 500 });
}

export async function PUT(request: NextRequest) {
    return withAuth(request, async req => {
        try {
            const id = adminAccountId(request.nextUrl.searchParams.get('id'));
            const { name, role, password } = adminAccountInput(await req.json().catch(() => null), false);
            const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
            const user = await prisma.$transaction(async tx => {
                await lockAdminAccounts(tx, req.user!.id);
                const target = await tx.adminUser.findUnique({ where: { id }, select: { role: true } });
                if (!target) throw new AdminAccountError('Nie znaleziono konta.', 404);
                await protectAdminAccount(tx, req.user!.id, id, role || target.role);
                return tx.adminUser.update({ where: { id }, data: { name, role, password_hash: passwordHash }, select: { id: true, email: true, name: true, role: true } });
            });
            return NextResponse.json({ success: true, user });
        } catch (error) { return failure(error); }
    });
}

export async function DELETE(request: NextRequest) {
    return withAuth(request, async req => {
        try {
            const id = adminAccountId(request.nextUrl.searchParams.get('id'));
            await prisma.$transaction(async tx => {
                await lockAdminAccounts(tx, req.user!.id);
                await protectAdminAccount(tx, req.user!.id, id);
                await tx.adminUser.delete({ where: { id } });
            });
            return NextResponse.json({ success: true });
        } catch (error) { return failure(error); }
    });
}
