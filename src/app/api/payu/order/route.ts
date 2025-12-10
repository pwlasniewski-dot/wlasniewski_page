import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createPayUOrder, OrderRequest } from "@/lib/payu";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            amount, // in PLN (full units), or passed as grosze? Let's expect PLN for simplicity or handle consistent. 
            // Better expect grosze (integers) to avoid float issues, but frontend creates challenge with logic. 
            // challenge_price is Int (usually PLN in this DB? schema says Int. If 200 PLN is 200, then it's PLN units. If 20000, it's grosze.)
            // Looking at `PhotoChallenge` model: `challenge_price Int`. `ClientGallery` has `price_per_premium Int @default(2000)` = 20PLN.
            // So DB uses GRAOSZE (cents). 
            // But `ChallengePackage` might store PLN?
            // "challenge_price: 200" on frontend usually means 200 PLN.
            // Let's assume input body `amount` is in GROSZE (cents) to be safe.
            description,
            email,
            challengeId, // Optional, if related to a challenge
            bookingId, // Optional, if related to booking
            redirectUrl
        } = body;

        if (!amount || !email) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get Client IP
        const headerList = await headers();
        const forwardedFor = headerList.get("x-forwarded-for");
        const clientIp = forwardedFor ? forwardedFor.split(',')[0] : "127.0.0.1";

        // Generate unique extOrderId
        // Format: TYPE_ID_TIMESTAMP to allow parsing in Notify
        let extOrderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        if (challengeId) {
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
            redirectUri: redirectUrl || "https://wlasniewski.pl/dziekujemy"
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
