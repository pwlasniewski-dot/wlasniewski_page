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
            // Parse extOrderId to find resource type
            // Format: TYPE_ID or just ID for bookings/gift cards
            const parts = extOrderId.split('_');
            const typeOrId = parts[0];
            const resourceId = parts.length > 1 ? parseInt(parts[1]) : parseInt(typeOrId);
            
            // Try to detect resource type
            let handled = false;

            // Check if it's a booking (simple numeric ID for bookings from checkout endpoint)
            if (!isNaN(resourceId)) {
                const booking = await prisma.booking.findUnique({
                    where: { id: resourceId }
                }).catch(() => null);

                if (booking) {
                    await prisma.booking.update({
                        where: { id: resourceId },
                        data: {
                            status: 'confirmed',
                            notes: `Paid via PayU (Order: ${orderId})`
                        }
                    });
                    
                    console.log(`Booking #${resourceId} marked as confirmed`);
                    handled = true;
                }
            }

            // If not a booking, check if it's a gift card
            if (!handled && !isNaN(resourceId)) {
                const giftCardOrder = await prisma.giftCardOrder.findUnique({
                    where: { id: resourceId },
                    include: { gift_card: true },
                }).catch(() => null);

                if (giftCardOrder) {
                    await prisma.giftCardOrder.update({
                        where: { id: resourceId },
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
                            console.log(`Gift card email sent for order ${resourceId}`);
                        }
                    } catch (err) {
                        console.error('Failed to send gift card email:', err);
                    }
                    handled = true;
                }
            }

            // Check for typed resources (CHALLENGE_ID, BOOKING_ID format)
            if (!handled) {
                const type = typeOrId;
                const typedId = resourceId;

                if (type === 'CHALLENGE' && !isNaN(typedId)) {
                    await prisma.photoChallenge.update({
                        where: { id: typedId },
                        data: {
                            status: 'accepted',
                            accepted_at: new Date(),
                            admin_notes: `Paid via PayU (Order: ${orderId})`
                        }
                    }).catch(() => null);

                    await prisma.challengeTimelineEvent.create({
                        data: {
                            challenge_id: typedId,
                            event_type: "PAYMENT_COMPLETED",
                            event_description: `Płatność PayU zakończona pomyślnie.`,
                            metadata: JSON.stringify({ orderId, amount: order.totalAmount })
                        }
                    }).catch(() => null);
                    
                    handled = true;
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PayU Notify Error:", error);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
}
