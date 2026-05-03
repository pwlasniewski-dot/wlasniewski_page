import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { logClientActivity } from '@/lib/crm-activity';

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

        // Check if this is an admin user
        let isAdmin = false;
        if (decoded.id) {
            const adminUser = await prisma.adminUser.findUnique({ where: { id: decoded.id }, select: { id: true } });
            isAdmin = !!adminUser;
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

        // Verify client owns this contract (skip for admin)
        if (!isAdmin) {
            const isOwner =
                contract.client_id === decoded.id ||
                contract.offer?.client_id === decoded.id ||
                contract.offer?.client_email === decoded.email;

            if (!isOwner) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
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
        let userName = 'Kliencie';
        let userEmail = decoded.email || '';
        if (!isAdmin) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { name: true, email: true }
            });
            userName = user?.name || decoded.email || 'Kliencie';
            userEmail = user?.email || decoded.email || '';
        } else if (contract.client_id) {
            const clientUser = await prisma.user.findUnique({
                where: { id: contract.client_id },
                select: { name: true, email: true }
            });
            userName = clientUser?.name || 'Kliencie';
            userEmail = clientUser?.email || '';
        }

        const replacementContext = {
            contract_number: contract.contract_number,
            clientName: userName,
            clientEmail: userEmail,
            offerTitle: contract.offer?.title || 'Umowa Samodzielna'
        };

        const finalContent = replacePlaceholders(contract.content || '', replacementContext);
        const processedContract = { ...contract, content: finalContent };
        // -------------------------------------

        // Dane bankowe z Settings (dla podgladu zaliczki w portalu klienta)
        const settings = await prisma.settings.findFirst({
            select: {
                bank_account_number: true,
                bank_account_holder: true,
                bank_name: true,
                bank_swift: true,
            },
        }).catch(() => null);

        // CRM Activity: contract viewed (skip for admin)
        if (!isAdmin) {
            logClientActivity(decoded, 'contract_viewed', {
                entityType: 'contract',
                entityId: contractId,
                details: { contract_number: contract.contract_number, status: contract.status },
                request,
            });
        }

        return NextResponse.json({ contract: processedContract, bank: settings });
    } catch (error) {
        console.error('Error fetching contract:', error);
        return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
    }
}
