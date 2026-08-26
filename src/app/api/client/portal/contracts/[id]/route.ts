import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { logClientActivity } from '@/lib/crm-activity';
import { isContractRecordOwner, isVerifiedAdminIdentity } from '@/lib/auth/document-access';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { isClientVisibleContractStatus } from '@/lib/contracts/status';

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
        const adminUser = decoded.type === 'admin' && decoded.role === 'ADMIN'
            ? await prisma.adminUser.findUnique({ where: { id: decoded.id }, select: { id: true, email: true, role: true } })
            : null;
        const isAdmin = isVerifiedAdminIdentity(decoded, adminUser);
        const activeClient = isAdmin ? null : await revalidateActiveClient(decoded);
        if (!isAdmin && !activeClient) {
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
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }
        if (!isAdmin && !isClientVisibleContractStatus(contract.status)) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Verify client owns this contract (skip for admin)
        if (!isAdmin) {
            const isOwner = isContractRecordOwner(contract, activeClient!);

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
            userName = activeClient?.name || decoded.email || 'Kliencie';
            userEmail = activeClient?.email || decoded.email || '';
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
        const settings = await prisma.setting.findFirst({
            select: {
                bank_account_number: true,
                bank_account_holder: true,
                bank_name: true,
                bank_swift: true,
            },
        }).catch(() => null);

        // CRM Activity: contract viewed (skip for admin)
        if (!isAdmin) {
            await logClientActivity(decoded, 'contract_viewed', {
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
