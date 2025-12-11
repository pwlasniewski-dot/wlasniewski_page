import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendGiftCardAccessEmail } from "@/lib/email/giftCardAccess";

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
            // Format: TYPE_ID_TIMESTAMP or just ID for gift cards
            const parts = extOrderId.split('_');
            const type = parts[0];
            const id = parseInt(parts[1] || parts[0]); // If no underscore, it's just the ID

            if (type === 'CHALLENGE' && !isNaN(id)) {
                await prisma.photoChallenge.update({
                    where: { id: id },
                    data: {
                        status: 'accepted',
                        accepted_at: new Date(),
                        admin_notes: `Paid via PayU (Order: ${orderId})`
                    }
                });

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
                        status: 'confirmed',
                        notes: `Paid via PayU (Order: ${orderId})`
                    }
                });
            } else if (!isNaN(parseInt(extOrderId))) {
                // Gift card order - just numeric ID
                const giftCardOrderId = parseInt(extOrderId);
                const giftCardOrder = await prisma.giftCardOrder.findUnique({
                    where: { id: giftCardOrderId },
                    include: { gift_card: true },
                });

                if (giftCardOrder) {
                    await prisma.giftCardOrder.update({
                        where: { id: giftCardOrderId },
                        data: {
                            payment_status: 'completed',
                            paid_at: new Date(),
                        },
                    });

                    // Send gift card access email
                    try {
                        if (giftCardOrder.customer_name && giftCardOrder.access_token) {
                            await sendGiftCardAccessEmail(
                                giftCardOrder.customer_email,
                                giftCardOrder.customer_name,
                                giftCardOrder.gift_card,
                                giftCardOrder.access_token,
                                giftCardOrder.recipient_name || undefined,
                                giftCardOrder.recipient_email || undefined,
                                giftCardOrder.sender_name || undefined,
                                giftCardOrder.message || undefined
                            );
                            console.log(`Gift card email sent for order ${giftCardOrderId}`);
                        }
                    } catch (err) {
                        console.error('Failed to send gift card email:', err);
                    }
                }
            }
        } else if (status === 'CANCELED' || status === 'REJECTED') {
            // Handle gift card cancellation
            const giftCardOrderId = parseInt(extOrderId);
            if (!isNaN(giftCardOrderId)) {
                await prisma.giftCardOrder.update({
                    where: { id: giftCardOrderId },
                    data: { payment_status: 'failed' },
                }).catch(() => {
                    // Order might not be a gift card order, ignore error
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PayU Notify Error:", error);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
}
