import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET /api/admin/contracts/[id] - admin podglad umowy (rowniez standalone bez offer_id)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const params = await context.params;
            const contractId = parseInt(params.id);
            const contract = await prisma.contract.findUnique({
                where: { id: contractId },
                include: {
                    offer: {
                        select: {
                            id: true, title: true, total_price: true, offerNumber: true,
                            client_id: true, client_email: true, type: true,
                            session_date: true, session_time: true, session_location: true,
                        },
                    },
                    user: { select: { id: true, name: true, email: true, phone: true } },
                },
            });
            if (!contract) {
                return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
            }
            return NextResponse.json({ contract });
        } catch (error) {
            console.error('Get contract error:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}

// PATCH /api/admin/contracts/[id] - update fields (np. session_date dla standalone)
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const params = await context.params;
            const contractId = parseInt(params.id);
            const body = await req.json();
            const { session_date, session_time, session_location, photographer_id, status, client_note } = body;

            const data: Record<string, unknown> = {};
            if (session_date !== undefined) data.session_date = session_date ? new Date(session_date) : null;
            if (session_time !== undefined) data.session_time = session_time;
            if (session_location !== undefined) data.session_location = session_location;
            if (photographer_id !== undefined) {
                const pid = photographer_id === null || photographer_id === '' ? null : parseInt(String(photographer_id), 10);
                data.photographer_id = pid && !isNaN(pid) ? pid : null;
            }
            if (status !== undefined) data.status = status;
            if (client_note !== undefined) data.client_note = client_note;

            const updated = await prisma.contract.update({ where: { id: contractId }, data });
            return NextResponse.json({ contract: updated });
        } catch (error) {
            console.error('Patch contract error:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}

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

            // Allow admin to delete signed contracts if needed
            // (Removed restriction per user request)

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
