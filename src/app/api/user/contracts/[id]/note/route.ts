import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';

// PATCH /api/user/contracts/[id]/note — klient dodaje notatkę do umowy
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = extractToken(authHeader) || request.cookies.get('client_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = await verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const { id } = await params;
        const contractId = parseInt(id);
        const { client_note } = await request.json();

        // Upewnij się, że umowa należy do klienta
        const contract = await prisma.contract.findFirst({
            where: {
                id: contractId,
                OR: [
                    { client_id: decoded.id },
                    { offer: { OR: [{ client_id: decoded.id }, { client_email: decoded.email }] } }
                ]
            }
        });

        if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

        await prisma.contract.update({
            where: { id: contractId },
            data: { client_note: client_note ?? null } as any
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Note API] Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
