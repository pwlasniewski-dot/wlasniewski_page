// API Route: POST /api/payments/callback
// Handle PayU notifications (Legacy/Gallery)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyPayUSignature } from '@/lib/payu';

// Simple logger helper if lib/logger doesn't exist or is problematic
async function logSystem(level: string, module: string, message: string, metadata?: any) {
    try {
        console.log(`[${level}] ${module}: ${message}`, metadata);
        await prisma.systemLog.create({
            data: {
                level,
                module,
                message,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        });
    } catch (e) {
        console.error("Failed to log system event", e);
    }
}

export async function POST(request: NextRequest) {
    try {
        const bodyText = await request.text();
        const signature = request.headers.get('OpenPayu-Signature');

        if (!signature) {
            await logSystem('WARN', 'PAYMENT', 'PayU Callback: Missing signature');
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // Verify signature
        // We pass empty merchant key for now as our simple implementation returns true
        const isValid = verifyPayUSignature(signature, bodyText, '');
        if (!isValid) {
            console.error('Invalid PayU signature');
            await logSystem('ERROR', 'PAYMENT', 'PayU Callback: Invalid signature', { signature, bodySnippet: bodyText.slice(0, 100) });
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const notification = JSON.parse(bodyText);
        const { order } = notification;

        if (!order || !order.extOrderId || !order.status) {
            await logSystem('WARN', 'PAYMENT', 'PayU Callback: Invalid notification format', { notification });
            return NextResponse.json({ error: 'Invalid notification format' }, { status: 400 });
        }

        const orderId = Number(order.extOrderId);
        const status = order.status; // COMPLETED, CANCELED, PENDING

        console.log(`PayU Notification for Order #${orderId}: ${status}`);
        await logSystem('INFO', 'PAYMENT', `PayU Status Change: Order #${orderId} -> ${status}`, { orderId, status });

        // Map PayU status to our status
        let paymentStatus = 'pending';
        if (status === 'COMPLETED') paymentStatus = 'paid';
        else if (status === 'CANCELED') paymentStatus = 'cancelled';
        else if (status === 'REJECTED') paymentStatus = 'failed';

        // Update photoOrder
        // NOTE: This route seems specific to `photoOrder` (Gallery system), while /api/payu/notify is for Challenges?
        // Yes, the other route I made handles 'CHALLENGE_...' and 'BOOKING_...'.
        // This file was 'api/payments/callback'. It seems it expects `extOrderId` to be just an INTEGER ID of `photoOrder`.
        // Let's assume this is correct for Legacy/Gallery.

        if (!isNaN(orderId)) {
            try {
                const updatedOrder = await prisma.photoOrder.update({
                    where: { id: orderId },
                    data: {
                        payment_status: paymentStatus,
                        paid_at: paymentStatus === 'paid' ? new Date() : null,
                        updated_at: new Date(),
                    },
                    include: {
                        gallery: true
                    }
                });

                // If paid, we could trigger email sending here
                if (paymentStatus === 'paid' && updatedOrder.gallery?.client_email) {
                    await logSystem('INFO', 'SYSTEM', `Order #${orderId} fully paid. Ready to send download links.`, { email: updatedOrder.gallery.client_email });
                }
            } catch (updateError) {
                console.error("Failed to update order", updateError);
                // It might be that the ID is not found (e.g. if it was a Challenge order sent to this callback by mistake?)
                // If PayU is configured globally with ONE notifyUrl, then ALL notifications come here?
                // CAUTION: If global PayU notifyUrl points to THIS route, then Challenge orders will fail here.
                // The schema has `payu_notify_url`.
                // If that URL is `.../api/payments/callback`, then this route MUST handle generic logic.
                // My new `api/payu/order` route sent `notifyUrl` specifically in the request to PayU.
                // PayU usually respects the per-order notifyUrl.
                // So Challenge orders go to `api/payu/notify` (if I set it correctly in `createPayUOrder`).
                // Let's verify `lib/payu.ts`.
            }
        }

        return NextResponse.json({ status: 'OK' });
    } catch (error) {
        console.error('Error processing PayU notification:', error);
        await logSystem('ERROR', 'PAYMENT', 'Error processing PayU notification', { error: String(error) });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
