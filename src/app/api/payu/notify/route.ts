import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { sendGiftCardAccessEmail } from "@/lib/email/giftCardAccess";

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

        console.log(`PayU Notification: Status = ${status} ExtOrderId = ${extOrderId} PayUId = ${orderId} `);

        // Update System Log
        await prisma.systemLog.create({
            data: {
                level: "INFO",
                module: "PAYMENT",
                message: `PayU Notify: ${status} `,
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
                            notes: `Paid via PayU(Order: ${orderId})`
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

                    // Send admin notification email
                    try {
                        const { getAdminEmail, sendEmail } = await import('@/lib/email/sender');
                        const adminEmail = await getAdminEmail();
                        const amountPLN = (giftCardOrder.amount_paid / 100).toFixed(2);
                        const adminHtml = `
    <html>
    <head>
    <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; background: #0f0f0f; color: #fff; }
            .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 40px; border-radius: 12px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #d4af37; padding-bottom: 20px; }
            .section { background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 15px 0; }
            .section h3 { color: #d4af37; margin-top: 0; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #3a3a3a; }
            .row:last-child { border-bottom: none; }
            .label { color: #888; font-weight: bold; }
            .value { color: #fff; }
            .success { color: #4ade80; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; border-top: 1px solid #333; padding-top: 20px; font-size: 12px; color: #888; }
        </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1 style="color: #d4af37; margin: 0;">💳 Nowa Transakcja Karty Podarunkowej</h1>
            <p style="color: #aaa; margin: 5px 0 0 0;">Płatność Potwierdzona</p>
        </div>

        <div class="section">
            <h3>👤 Kupujący</h3>
            <div class="row">
                <span class="label">Imię:</span>
                <span class="value">${giftCardOrder.customer_name}</span>
            </div>
            <div class="row">
                <span class="label">Email:</span>
                <span class="value">${giftCardOrder.customer_email}</span>
            </div>
        </div>

        ${giftCardOrder.recipient_name ? `
        <div class="section">
            <h3>🎁 Odbiorca</h3>
            <div class="row">
                <span class="label">Imię:</span>
                <span class="value">${giftCardOrder.recipient_name}</span>
            </div>
            ${giftCardOrder.recipient_email ? `
            <div class="row">
                <span class="label">Email:</span>
                <span class="value">${giftCardOrder.recipient_email}</span>
            </div>
            ` : ''}
            ${giftCardOrder.sender_name ? `
            <div class="row">
                <span class="label">Od:</span>
                <span class="value">${giftCardOrder.sender_name}</span>
            </div>
            ` : ''}
            ${giftCardOrder.message ? `
            <div class="row">
                <span class="label">Wiadomość:</span>
                <span class="value"><em>"${giftCardOrder.message}"</em></span>
            </div>
            ` : ''}
        </div>
        ` : ''
                            }

        <div class="section">
            <h3>🎟️ Karta Podarunkowa</h3>
            <div class="row">
                <span class="label">Kod:</span>
                <span class="value" style="font-family: monospace; font-weight: bold;">${giftCardOrder.gift_card.code}</span>
            </div>
            <div class="row">
                <span class="label">Temat:</span>
                <span class="value">${giftCardOrder.gift_card.theme || 'N/A'}</span>
            </div>
            <div class="row">
                <span class="label">Wartość:</span>
                <span class="value">${giftCardOrder.gift_card.value || giftCardOrder.gift_card.amount} PLN</span>
            </div>
        </div>

        <div class="section">
            <h3>💰 Płatność</h3>
            <div class="row">
                <span class="label">Kwota:</span>
                <span class="value success">${amountPLN} PLN</span>
            </div>
            <div class="row">
                <span class="label">Metoda:</span>
                <span class="value">PayU</span>
            </div>
            <div class="row">
                <span class="label">Numer PayU:</span>
                <span class="value" style="font-family: monospace; font-size: 12px;">${orderId}</span>
            </div>
            <div class="row">
                <span class="label">ID Zamówienia:</span>
                <span class="value">${resourceId}</span>
            </div>
            <div class="row">
                <span class="label">Status:</span>
                <span class="success">✅ ZATWIERDZONO</span>
            </div>
        </div>

        <div class="footer">
            <p>Wiadomość automatyczna z systemu płatności</p>
            <p>© Fotograf Wlasniewski - Wszystkie prawa zastrzeżone</p>
        </div>
    </div>
    </body>
    </html>
    `;

                        if (adminEmail) {
                            await sendEmail({
                                to: adminEmail,
                                subject: `💳[NOWA TRANSAKCJA] Karta ${giftCardOrder.gift_card.code} - ${amountPLN} PLN`,
                                html: adminHtml
                            });
                            console.log(`Admin notification sent to ${adminEmail} for order ${resourceId}`);
                        }
                    } catch (adminErr) {
                        console.error('Failed to send admin notification:', adminErr);
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
                            admin_notes: `Paid via PayU(Order: ${orderId})`
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
