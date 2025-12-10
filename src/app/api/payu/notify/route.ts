import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const bodyText = await request.text();
        const body = JSON.parse(bodyText);

        // PayU sends: { order: { orderId, extOrderId, orderCreateDate, notifyUrl, customerIp, merchantPosId, description, currencyCode, totalAmount, buyer, products, status, payMethod } }
        const order = body.order;

        if (!order) {
            return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
        }

        const { extOrderId, orderId, status } = order;

        console.log(`PayU Notification: Status=${status} ExtOrderId=${extOrderId} PayUId=${orderId}`);

        // Update System Log
        await prisma.systemLog.create({
            data: {
                level: "INFO",
                module: "PAYMENT",
                message: `PayU Notify: ${status}`,
                metadata: JSON.stringify({ extOrderId, orderId, status, fullBody: body })
            }
        });

        if (status === 'COMPLETED') {
            // Parse extOrderId to find resource
            // Format: TYPE_ID_TIMESTAMP
            const parts = extOrderId.split('_');
            const type = parts[0];
            const id = parseInt(parts[1]);

            if (type === 'CHALLENGE' && !isNaN(id)) {
                await prisma.photoChallenge.update({
                    where: { id: id },
                    data: {
                        // Maybe we need a 'paid' status or just treat 'accepted' aka 'paid'? 
                        // Let's assume 'accepted' refers to the deal being ON. 
                        // Actually 'status' in PhotoChallenge might receive 'paid' if I add it to schema, or I map to existing.
                        // For now, let's set it to 'accepted' (meaning paid & active).
                        status: 'accepted',
                        accepted_at: new Date(),
                        admin_notes: `Paid via PayU (Order: ${orderId})`
                    }
                });

                // Add timeline event
                await prisma.challengeTimelineEvent.create({
                    data: {
                        challenge_id: id,
                        event_type: "PAYMENT_COMPLETED",
                        event_description: `Płatność PayU zakończona pomyślnie.`,
                        metadata: JSON.stringify({ orderId, amount: order.totalAmount })
                    }
                });
            } else if (type === 'BOOKING' && !isNaN(id)) {
                await prisma.booking.update({
                    where: { id: id },
                    data: {
                        status: 'confirmed', // Confirmed after payment
                        notes: `Paid via PayU (Order: ${orderId})`
                    }
                });
            }
        } else if (status === 'CANCELED') {
            // Handle cancellation
            // ...
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PayU Notify Error:", error);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
}
