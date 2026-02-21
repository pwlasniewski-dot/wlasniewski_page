import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// DELETE /api/admin/contracts/[id]
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const params = await context.params;
            const contractId = parseInt(params.id);

            const contract = await prisma.contract.findUnique({
                where: { id: contractId }
            });

            if (!contract) {
                return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
            }

            // Security: Block deletion of SIGNED contracts
            // Unless the status is 'pending' or 'rejected', we might want to prevent deletion
            // The user specifically asked for protection: "na prodzie to musi być zabezpieczenie żeby podpisanych klientowi nie usunąć"
            if (contract.status === 'SIGNED' || contract.status === 'signed') {
                return NextResponse.json({
                    error: 'Nie można usunąć podpisanej umowy.',
                    message: 'Podpisane dokumenty są prawnie wiążące i nie mogą być usuwane z systemu.'
                }, { status: 400 });
            }

            await prisma.contract.delete({
                where: { id: contractId }
            });

            return NextResponse.json({ success: true, message: 'Umowa została pomyślnie usunięta.' });
        } catch (error) {
            console.error('Delete contract error:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}
