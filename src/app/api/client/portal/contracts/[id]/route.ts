import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = extractToken(request.headers.get('authorization')) ||
            request.cookies.get('client_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const contractId = parseInt(id);

        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                offer: {
                    select: {
                        id: true,
                        title: true,
                        total_price: true,
                        offerNumber: true,
                        client_id: true,
                        client_email: true,
                        type: true,
                    }
                }
            }
        });

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Verify client owns this contract
        const isOwner =
            contract.client_id === decoded.id ||
            contract.offer?.client_id === decoded.id ||
            contract.offer?.client_email === decoded.email;

        if (!isOwner) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({ contract });
    } catch (error) {
        console.error('Error fetching contract:', error);
        return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
    }
}
