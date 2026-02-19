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

        // --- PLACEHOLDER REPLACEMENT LOGIC ---
        const replacePlaceholders = (text: string, context: any) => {
            if (!text) return text;
            return text
                .replace(/\{\{contractNumber\}\}/g, context.contract_number || '')
                .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString('pl-PL'))
                .replace(/\{\{clientName\}\}/g, context.clientName || '')
                .replace(/\{\{clientEmail\}\}/g, context.clientEmail || '')
                .replace(/\{\{offerTitle\}\}/g, context.offerTitle || 'Umowa Samodzielna');
        };

        // Fetch user name for context if needed
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { name: true, email: true }
        });

        const replacementContext = {
            contract_number: contract.contract_number,
            clientName: user?.name || decoded.email || 'Kliencie',
            clientEmail: user?.email || decoded.email || '',
            offerTitle: contract.offer?.title || 'Umowa Samodzielna'
        };

        const finalContent = replacePlaceholders(contract.content || '', replacementContext);
        const processedContract = { ...contract, content: finalContent };
        // -------------------------------------

        return NextResponse.json({ contract: processedContract });
    } catch (error) {
        console.error('Error fetching contract:', error);
        return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
    }
}
