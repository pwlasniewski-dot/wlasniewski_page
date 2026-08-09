import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { createPayUOrder, OrderRequest } from "@/lib/payu";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            workshop_offer_id,
            payment_type, // "deposit" | "full"
            email
        } = body;

        if (!workshop_offer_id || !payment_type || !email) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate workshop offer exists and get details
        const offer = await prisma.workshopOffer.findUnique({
            where: { id: parseInt(workshop_offer_id) },
            include: {
                workshop: true
            }
        });

        if (!offer) {
            return NextResponse.json({ error: "Workshop offer not found" }, { status: 404 });
        }

        // Determine amount based on payment type
        let amountPln: number;
        let description: string;

        if (payment_type === "deposit") {
            if (!offer.deposit_amount) {
                return NextResponse.json({ error: "No deposit amount set for this offer" }, { status: 400 });
            }
            if (offer.deposit_paid_at) {
                return NextResponse.json({ error: "Deposit already paid" }, { status: 400 });
            }
            amountPln = offer.deposit_amount;
            description = `Zaliczka - ${offer.workshop.title}`;
        } else if (payment_type === "full") {
            if (!offer.price) {
                return NextResponse.json({ error: "No price set for this offer" }, { status: 400 });
            }
            // Calculate remaining amount if deposit was paid
            const depositPaid = offer.deposit_paid_at ? (offer.deposit_amount || 0) : 0;
            amountPln = offer.price - depositPaid;
            
            if (amountPln <= 0) {
                return NextResponse.json({ error: "Already fully paid" }, { status: 400 });
            }
            description = `Płatność za warsztat - ${offer.workshop.title}`;
        } else {
            return NextResponse.json({ error: "Invalid payment_type" }, { status: 400 });
        }
        const amount = Math.round(amountPln * 100);

        // Get Client IP
        const headerList = await headers();
        const forwardedFor = headerList.get("x-forwarded-for");
        const clientIp = forwardedFor ? forwardedFor.split(',')[0] : "127.0.0.1";

        // Generate unique extOrderId with WORKSHOP prefix
        const extOrderId = `WORKSHOP_${offer.id}_${payment_type}_${Date.now()}`;

        const orderData: OrderRequest = {
            description,
            currencyCode: "PLN",
            totalAmount: amount,
            extOrderId: extOrderId,
            buyer: {
                email: email,
                language: "pl"
            },
            products: [
                {
                    name: description,
                    unitPrice: amount,
                    quantity: 1
                }
            ],
            continueUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl'}/konto?tab=warsztaty`
        };

        const result = await createPayUOrder(orderData, clientIp);

        // Log the payment initiation
        await prisma.systemLog.create({
            data: {
                level: "INFO",
                module: "PAYMENT",
                message: `Workshop payment initiated: Offer #${offer.id}, Type: ${payment_type}`,
                metadata: JSON.stringify({ 
                    extOrderId, 
                    payuOrderId: result.orderId,
                    amount,
                    email
                })
            }
        });

        return NextResponse.json({
            success: true,
            redirectUrl: result.redirectUri,
            orderId: result.orderId
        });

    } catch (error: any) {
        console.error("Workshop PayU Order Route Error:", error);
        return NextResponse.json({ error: error.message || "Payment initiation failed" }, { status: 500 });
    }
}
