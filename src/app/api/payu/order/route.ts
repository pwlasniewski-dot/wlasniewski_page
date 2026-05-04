import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { createPayUOrder, OrderRequest } from "@/lib/payu";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            amount, // in grosze
            description,
            email: emailFromBody,
            challengeId,
            bookingId,
            contractId,  // NEW: for contract payments
            paymentType, // NEW: 'deposit' | 'remaining' | 'full'
            redirectUrl
        } = body;

        // Resolve email: body → contract.user → contract.offer.client_email
        let email = emailFromBody;
        if (!email && contractId) {
            const c = await prisma.contract.findUnique({
                where: { id: Number(contractId) },
                include: {
                    user: { select: { email: true } },
                    offer: { select: { client_email: true } },
                },
            }).catch(() => null);
            email = c?.user?.email || c?.offer?.client_email || '';
        }

        if (!amount || !email) {
            return NextResponse.json(
                { error: "Missing required fields", missing: { amount: !amount, email: !email } },
                { status: 400 }
            );
        }

        // Get Client IP
        const headerList = await headers();
        const forwardedFor = headerList.get("x-forwarded-for");
        const clientIp = forwardedFor ? forwardedFor.split(',')[0] : "127.0.0.1";

        // Generate unique extOrderId
        // Format: TYPE_ID_TIMESTAMP to allow parsing in Notify
        let extOrderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        if (contractId) {
            extOrderId = `CONTRACT_${contractId}_${paymentType || 'full'}_${Date.now()}`;
        } else if (challengeId) {
            // We need to fetch the challenge unique_link or use ID. unique_link is safer public ID but ID is internal.
            // If we use ID, we parse it back. 
            extOrderId = `CHALLENGE_${challengeId}_${Date.now()}`;
        } else if (bookingId) {
            extOrderId = `BOOKING_${bookingId}_${Date.now()}`;
        }

        const orderData: OrderRequest = {
            description: description || "Płatność za usługę fotograficzną",
            currencyCode: "PLN",
            totalAmount: amount,
            extOrderId: extOrderId,
            buyer: {
                email: email,
                language: "pl"
            },
            products: [
                {
                    name: description || "Usługa foto",
                    unitPrice: amount,
                    quantity: 1
                }
            ],
            continueUrl: redirectUrl || "https://wlasniewski.pl/dziekujemy"
        };

        const result = await createPayUOrder(orderData, clientIp);

        // Save order logic/status in DB could go here
        // If challengeId provided, update status
        if (challengeId) {
            // We might want to store the `extOrderId` in the challenge record to match notification later
            // But schema doesn't have `extOrderId`. Maybe store in `metadata` or `admin_notes` or generic
            // For now, we depend on notify route to find record by email or context? 
            // Best practice: Store `orderId` (PayU ID) and `extOrderId` in DB.
            // We have `PhotoOrder` model but that's for prints. 
            // Let's assume we handle database link in specific logic or just log it.
            await prisma.systemLog.create({
                data: {
                    level: "INFO",
                    module: "PAYMENT",
                    message: `Order initiated for Challenge ${challengeId}`,
                    metadata: JSON.stringify({ extOrderId, payuOrderId: result.orderId })
                }
            });
        }

        return NextResponse.json({
            success: true,
            redirectUrl: result.redirectUri,
            orderId: result.orderId
        });

    } catch (error: any) {
        console.error("PayU Order Route Error:", error);
        return NextResponse.json({ error: error.message || "Payment initiation failed" }, { status: 500 });
    }
}
