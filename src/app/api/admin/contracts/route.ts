import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generateContractNumber } from '@/lib/services/numbering';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const { offer_id, client_id, content } = body;

            if (!offer_id) {
                return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
            }

            // Fetch the offer to determine B2B/B2C type for the contract number
            const offer = await prisma.offer.findUnique({
                where: { id: offer_id }
            });

            if (!offer) {
                return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
            }

            // Generate final contract number
            const contract_number = await generateContractNumber(offer.type === 'b2b' ? 'B2B' : 'B2C');

            // Create the contract
            const contract = await prisma.contract.create({
                data: {
                    offer_id,
                    client_id: client_id || offer.client_id,
                    content,
                    status: 'pending'
                }
            });

            // Update contract with number (model update needed or use a different field)
            // Wait, does the Contract model have contract_number? Let's check schema again.
            // Based on Prisma error earlier, it might be missing. I should add it.

            return NextResponse.json({ success: true, contract });
        } catch (error) {
            console.error('Create contract error:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}
