import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { sendGiftCardAccessEmail } from "@/lib/email/giftCardAccess";
import { logSystem } from '@/lib/logger';

export async function POST(request: NextRequest) {
    console.log('[PayU NOTIFY] Webhook triggered');
    try {
        const bodyText = await request.text();
        const body = JSON.parse(bodyText);

        // PayU sends: { order: { orderId, extOrderId, orderCreateDate, notifyUrl, customerIp, merchantPosId, description, currencyCode, totalAmount, buyer, products, status, payMethod } }
        const order = body.order;

        if (!order) {
            return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
        }

        // --- Signature Verification Start ---
        const signatureHeader = request.headers.get('OpenPayu-Signature');
        if (!signatureHeader) {
            console.error('❌ [PayU] Missing OpenPayu-Signature header');
            return NextResponse.json({ error: "Missing signature" }, { status: 401 });
        }

        // Parse signature header: signature=...,algorithm=MD5,sender=...
        const signatureParts = signatureHeader.split(';').reduce((acc: any, part) => {
            const [key, value] = part.split('=');
            acc[key] = value;
            return acc;
        }, {});

        const signature = signatureParts.signature;
        const algorithm = signatureParts.algorithm || 'MD5';

        // Get MD5 Key from DB. Use deterministic order — multiple Setting rows
        // may exist (legacy schema); pick the row that actually has the key set.
        const setting = await prisma.setting.findFirst({
            where: { payu_md5_key: { not: null } },
            orderBy: { id: 'asc' },
        });
        const md5Key = setting?.payu_md5_key;

        if (!md5Key) {
            console.error('❌ [PayU] MD5 Key not configured in settings');
            // Fail safe: reject if we can't verify
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Verify Signature
        const { createHash } = await import('crypto');
        const concatenated = bodyText + md5Key;
        const expectedSignature = createHash(algorithm.toLowerCase()).update(concatenated).digest('hex');

        if (expectedSignature !== signature) {
            console.error(`❌ [PayU] Signature Verification Failed!`);
            console.error(`   Header: ${signatureHeader}`);
            console.error(`   Computed: ${expectedSignature}`);
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
        console.log('✅ [PayU] Signature Verified');
        // --- Signature Verification End ---

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

            // Handle CART transactions (Multi-item)
            if (typeOrId === 'CART') {
                const cartId = extOrderId;
                console.log(`[PayU] Processing CART transaction: ${cartId}`);

                // 1. Process Bookings
                const bookings = await prisma.booking.findMany({
                    where: { stripe_session_id: cartId }
                });

                for (const booking of bookings) {
                    const isSplit = booking.payment_plan === 'SPLIT';
                    const isDepositPayment = isSplit && booking.deposit_session_id === cartId && !booking.deposit_paid_at;
                    const isRemainingPayment = isSplit && booking.remaining_session_id === cartId && !booking.remaining_paid_at;

                    let updateData: any;
                    if (isRemainingPayment) {
                        updateData = {
                            status: 'confirmed',
                            remaining_paid_at: new Date(),
                            payu_order_id: orderId,
                            notes: `${booking.notes || ''}\n[PayU] Dopłata zaksięgowana (${cartId}, PayU: ${orderId})`.trim(),
                        };
                    } else if (isDepositPayment) {
                        updateData = {
                            status: 'deposit_paid',
                            deposit_paid_at: new Date(),
                            payu_order_id: orderId,
                            notes: `${booking.notes || ''}\n[PayU] Zaliczka zaksięgowana (${cartId}, PayU: ${orderId})`.trim(),
                        };
                    } else {
                        // FULL payment (or fallback)
                        updateData = {
                            status: 'confirmed',
                            payu_order_id: orderId,
                            notes: `Paid via PayU (Cart: ${cartId}, PayU: ${orderId})`,
                        };
                    }

                    await prisma.booking.update({
                        where: { id: booking.id },
                        data: updateData,
                    });
                    console.log(`[PayU] Booking #${booking.id} → ${updateData.status} from Cart`);

                    // Trigger Confirmation Email (only for non-deposit-only payments)
                    if (!isDepositPayment) {
                        try {
                            const { sendBookingConfirmationEmail } = await import('@/lib/email/booking');
                            const refreshed = await prisma.booking.findUnique({ where: { id: booking.id } });
                            if (refreshed) await sendBookingConfirmationEmail(refreshed);
                            console.log(`[PayU] Email dispatched for booking #${booking.id}`);
                        } catch (e) {
                            console.error(`[PayU] Failed to send email for booking #${booking.id}`, e);
                        }
                    } else {
                        // Deposit-paid email (lightweight)
                        try {
                            const { sendEmail } = await import('@/lib/email/sender');
                            await sendEmail({
                                to: booking.email!,
                                subject: 'Zaliczka zaksięgowana — czekamy na dopłatę przed sesją',
                                template: 'booking-deposit-paid',
                                data: {
                                    name: booking.client_name || 'Kliencie',
                                    deposit_amount_pln: ((booking.deposit_amount ?? 0) / 100).toFixed(2),
                                    remaining_amount_pln: ((booking.remaining_amount ?? 0) / 100).toFixed(2),
                                    remaining_due_at: booking.remaining_due_at ? booking.remaining_due_at.toISOString().slice(0, 10) : '',
                                    session_date: booking.date ? booking.date.toISOString().slice(0, 10) : '',
                                },
                            } as any);
                        } catch (e) {
                            console.error(`[PayU] Failed deposit email for #${booking.id}`, e);
                        }
                    }
                }

                // 2. Process Gift Cards (Iterate IDs to reuse single-item logic loop below or handle here)
                // For simplicity/robustness, we'll handle activation here directly.
                const giftCardOrders = await prisma.giftCardOrder.findMany({
                    where: { payu_order_id: cartId },
                    include: { gift_card: true }
                });

                for (const giftCardOrder of giftCardOrders) {
                    const resourceId = giftCardOrder.id; // Local scope ID for logging/logic

                    if (giftCardOrder.gift_card) {
                        const { generateGiftCardCode } = await import('@/lib/gift-cards');
                        const uniqueCode = generateGiftCardCode();
                        const newCard = await prisma.giftCard.create({
                            data: {
                                code: uniqueCode,
                                amount: giftCardOrder.gift_card.amount,
                                value: giftCardOrder.gift_card.value,
                                theme: giftCardOrder.gift_card.theme || 'christmas',
                                card_template: giftCardOrder.gift_card.card_template || 'standard',
                                card_title: giftCardOrder.gift_card.card_title,
                                card_description: giftCardOrder.gift_card.card_description,
                                recipient_email: giftCardOrder.recipient_email || giftCardOrder.customer_email,
                                recipient_name: giftCardOrder.recipient_name || giftCardOrder.customer_name,
                                sender_name: giftCardOrder.sender_name,
                                message: giftCardOrder.message,
                                status: 'active',
                                owner_id: giftCardOrder.user_id
                            }
                        });

                        await prisma.giftCardOrder.update({
                            where: { id: resourceId },
                            data: {
                                payment_status: 'completed',
                                paid_at: new Date(),
                                gift_card_id: newCard.id
                            },
                        });

                        // Refetch for email
                        const updatedOrder = await prisma.giftCardOrder.findUnique({
                            where: { id: resourceId },
                            include: { gift_card: true }
                        });

                        if (updatedOrder && updatedOrder.gift_card) {
                            // Send Client Email
                            try {
                                await sendGiftCardAccessEmail(
                                    updatedOrder.customer_email,
                                    updatedOrder.customer_name,
                                    updatedOrder.gift_card,
                                    updatedOrder.access_token || 'missing-token',
                                    updatedOrder.recipient_name || undefined,
                                    updatedOrder.recipient_email || undefined,
                                    updatedOrder.sender_name || undefined,
                                    updatedOrder.message || undefined,
                                    updatedOrder.id,
                                    updatedOrder.gift_card.theme || 'christmas'
                                );
                            } catch (e) { console.error('Email failed', e); }

                            // Send Admin Email (Simplified inline or import logic)
                            try {
                                const { getAdminEmail, sendEmail } = await import('@/lib/email/sender');
                                const adminEmail = await getAdminEmail();
                                if (adminEmail) {
                                    await sendEmail({
                                        to: adminEmail,
                                        subject: `💰 [CART] Nowa karta podarunkowa #${newCard.code}`,
                                        html: `<p>Opłacono kartę w zamówieniu koszykowym ${cartId}. Kwota: ${(updatedOrder.amount_paid / 100).toFixed(2)} PLN.</p>`
                                    });
                                }
                            } catch (e) { }
                        }
                    }
                }
                handled = true;
            }

            // Check if it's a booking (simple numeric ID for bookings from checkout endpoint)
            // Skip if extOrderId uses typed format (CHALLENGE_<id>, BOOKING_<id>, CART_...) —
            // those are handled by dedicated branches below.
            const isTypedExtOrder = /^[A-Z]+_/.test(extOrderId);
            if (!handled && !isTypedExtOrder && !isNaN(resourceId)) {
                const booking = await prisma.booking.findUnique({
                    where: { id: resourceId }
                }).catch(() => null);

                if (booking) {
                    await prisma.booking.update({
                        where: { id: resourceId },
                        data: {
                            status: 'confirmed',
                            payu_order_id: orderId,
                            notes: `Paid via PayU(Order: ${orderId})`
                        }
                    });

                    console.log(`Booking #${resourceId} marked as confirmed`);
                    handled = true;
                }
            }

            // If not a booking, check if it's a gift card
            if (!handled && !isTypedExtOrder && !isNaN(resourceId)) {
                const giftCardOrder = await prisma.giftCardOrder.findUnique({
                    where: { id: resourceId },
                    include: { gift_card: true },
                }).catch(() => null);

                if (giftCardOrder) {
                    if (giftCardOrder.gift_card) {

                        // Clone capability (verify if cloning needed)
                        // If we want unique codes for every purchase, we clone here.
                        const { generateGiftCardCode } = await import('@/lib/gift-cards');
                        const uniqueCode = generateGiftCardCode();

                        const newCard = await prisma.giftCard.create({
                            data: {
                                code: uniqueCode,
                                amount: giftCardOrder.gift_card.amount,
                                value: giftCardOrder.gift_card.value,
                                theme: giftCardOrder.gift_card.theme || 'christmas',
                                card_template: giftCardOrder.gift_card.card_template || 'standard',
                                card_title: giftCardOrder.gift_card.card_title,
                                card_description: giftCardOrder.gift_card.card_description,
                                recipient_email: giftCardOrder.recipient_email || giftCardOrder.customer_email,
                                recipient_name: giftCardOrder.recipient_name || giftCardOrder.customer_name,
                                sender_name: giftCardOrder.sender_name,
                                message: giftCardOrder.message,
                                status: 'active'
                            }
                        });

                        await prisma.giftCardOrder.update({
                            where: { id: resourceId },
                            data: {
                                payment_status: 'completed',
                                paid_at: new Date(),
                                gift_card_id: newCard.id // Retarget to new card
                            },
                        });
                    } else {
                        // Fallback if no gift card linked (should not happen for valid orders)
                        await prisma.giftCardOrder.update({
                            where: { id: resourceId },
                            data: {
                                payment_status: 'completed',
                                paid_at: new Date()
                            },
                        });
                    }


                    // Refetch with new card relation for email
                    const updatedOrder = await prisma.giftCardOrder.findUnique({
                        where: { id: resourceId },
                        include: { gift_card: true }
                    });

                    // Send gift card access email
                    console.log(`[PayU] Attempting to send access email for Order #${updatedOrder?.id}`);
                    try {
                        if (updatedOrder && updatedOrder.customer_name && updatedOrder.access_token && updatedOrder.gift_card) {
                            console.log(`[PayU] Sending access email to: ${updatedOrder.customer_email} using theme: ${updatedOrder.gift_card.theme}`);
                            await sendGiftCardAccessEmail(
                                updatedOrder.customer_email,
                                updatedOrder.customer_name,
                                updatedOrder.gift_card,
                                updatedOrder.access_token,
                                updatedOrder.recipient_name || undefined,
                                updatedOrder.recipient_email || undefined,
                                updatedOrder.sender_name || undefined,
                                updatedOrder.message || undefined,
                                updatedOrder.id,
                                updatedOrder.gift_card.theme || 'christmas'
                            );
                            console.log(`✅ [PayU] Gift card email sent successfully for order ${resourceId}`);
                        } else {
                            console.warn(`[PayU] Skipping email - missing data. Order: ${!!updatedOrder}, Name: ${!!updatedOrder?.customer_name}, Token: ${!!updatedOrder?.access_token}`);
                        }
                    } catch (err) {
                        console.error('❌ [PayU] Failed to send gift card email:', err);
                    }

                    // Send admin notification email
                    if (updatedOrder && updatedOrder.gift_card) {
                        try {
                            const { getAdminEmail, sendEmail } = await import('@/lib/email/sender');
                            const adminEmail = await getAdminEmail();
                            const amountPLN = (updatedOrder.amount_paid / 100).toFixed(2);
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
                    <span class="value">${updatedOrder.customer_name}</span>
                </div>
                <div class="row">
                    <span class="label">Email:</span>
                    <span class="value">${updatedOrder.customer_email}</span>
                </div>
            </div>

            ${updatedOrder.recipient_name ? `
            <div class="section">
                <h3>🎁 Odbiorca</h3>
                <div class="row">
                    <span class="label">Imię:</span>
                    <span class="value">${updatedOrder.recipient_name}</span>
                </div>
                ${updatedOrder.recipient_email ? `
                <div class="row">
                    <span class="label">Email:</span>
                    <span class="value">${updatedOrder.recipient_email}</span>
                </div>
                ` : ''}
                ${updatedOrder.sender_name ? `
                <div class="row">
                    <span class="label">Od:</span>
                    <span class="value">${updatedOrder.sender_name}</span>
                </div>
                ` : ''}
                ${updatedOrder.message ? `
                <div class="row">
                    <span class="label">Wiadomość:</span>
                    <span class="value"><em>"${updatedOrder.message}"</em></span>
                </div>
                ` : ''}
            </div>
            ` : ''
                                }

            <div class="section">
                <h3>🎟️ Karta Podarunkowa</h3>
                <div class="row">
                    <span class="label">Kod:</span>
                    <span class="value" style="font-family: monospace; font-weight: bold;">${updatedOrder.gift_card!.code}</span>
                </div>
                <div class="row">
                    <span class="label">Temat:</span>
                    <span class="value">${updatedOrder.gift_card!.theme || 'N/A'}</span>
                </div>
                <div class="row">
                    <span class="label">Wartość:</span>
                    <span class="value">${updatedOrder.gift_card!.value || updatedOrder.gift_card!.amount} PLN</span>
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
                                    subject: `💳[NOWA TRANSAKCJA] Karta ${updatedOrder.gift_card!.code} - ${amountPLN} PLN`,
                                    html: adminHtml
                                });
                                console.log(`Admin notification sent to ${adminEmail} for order ${resourceId}`);
                            }
                        } catch (adminErr) {
                            console.error('Failed to send admin notification:', adminErr);
                        }
                    }

                    handled = true;
                }


            } // end CART branch

            // ============================================================
            // Typed resources (CHALLENGE_<id>, BOOKING_<id>)
            // ============================================================
            if (!handled && typeOrId === 'CHALLENGE' && !isNaN(resourceId)) {
                const typedId = resourceId;
                const challenge = await prisma.photoChallenge.findUnique({
                    where: { id: typedId },
                    include: { package: true, location: true }
                }).catch(() => null);

                if (challenge) {
                    await prisma.photoChallenge.update({
                        where: { id: typedId },
                        data: {
                            // Inviter just paid; invitee has NOT accepted yet.
                            // 'sent' means: invite link is live, awaiting invitee action.
                            status: 'sent',
                            payment_status: 'paid',
                            payment_id: orderId,
                            payment_method: 'payu',
                            paid_amount: Math.round(Number(order.totalAmount || 0) / 100),
                            admin_notes: `Paid via PayU (Order: ${orderId})`
                        } as any
                    }).catch((e) => { console.error('[PayU] Challenge update failed:', e); });

                    await prisma.challengeTimelineEvent.create({
                        data: {
                            challenge_id: typedId,
                            event_type: "PAYMENT_COMPLETED",
                            event_description: 'Płatność PayU zakończona pomyślnie.',
                            metadata: JSON.stringify({ orderId, amount: order.totalAmount })
                        }
                    }).catch(() => null);

                    // Confirm the blocking booking now that payment cleared
                    await prisma.booking.updateMany({
                        where: { challenge_id: typedId, status: 'challenge_pending' },
                        data: { status: 'challenge_paid' }
                    }).catch(() => null);

                    // Send notifications (best-effort; never fail webhook on email issues)
                    try {
                        const { sendEmail } = await import('@/lib/email/sender');
                        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
                        const inviteLink = `${baseUrl}/foto-wyzwanie/invite/${challenge.unique_link}`;

                        // → invitee
                        if (challenge.invitee_contact && challenge.invitee_contact.includes('@')) {
                            await sendEmail({
                                to: challenge.invitee_contact,
                                subject: `🎁 ${challenge.inviter_name} zaprasza Cię na sesję fotograficzną`,
                                template: 'challenge-payment-received-invitee',
                                data: {
                                    inviteeName: challenge.invitee_name,
                                    inviterName: challenge.inviter_name,
                                    packageName: challenge.package?.name || 'Sesja fotograficzna',
                                    inviteLink,
                                }
                            }).catch((e: any) => console.error('[PayU] invitee mail fail', e));
                        }

                        // → inviter
                        if (challenge.inviter_email) {
                            await sendEmail({
                                to: challenge.inviter_email,
                                subject: '✅ Płatność potwierdzona — zaproszenie wysłane',
                                template: 'challenge-payment-received-inviter',
                                data: {
                                    inviterName: challenge.inviter_name,
                                    inviteeName: challenge.invitee_name,
                                    packageName: challenge.package?.name || 'Sesja fotograficzna',
                                    amount: challenge.package?.challenge_price || 0,
                                }
                            }).catch((e: any) => console.error('[PayU] inviter mail fail', e));
                        }

                        // → admin (fotograf)
                        try {
                            const { getAdminEmail } = await import('@/lib/email/sender');
                            const adminEmail = await getAdminEmail();
                            if (adminEmail) {
                                const adminLink = `${baseUrl}/admin/challenges/${challenge.id}`;
                                await sendEmail({
                                    to: adminEmail,
                                    subject: `🔔 Nowe Foto Wyzwanie opłacone — ${challenge.inviter_name} → ${challenge.invitee_name}`,
                                    text: [
                                        `Nowe Foto Wyzwanie zostało opłacone przez PayU i czeka na akceptację zaproszonego.`,
                                        ``,
                                        `Zapraszający: ${challenge.inviter_name} (${challenge.inviter_email || challenge.inviter_contact})`,
                                        `Zaproszony: ${challenge.invitee_name} (${challenge.invitee_contact})`,
                                        `Pakiet: ${challenge.package?.name || '-'} — ${challenge.package?.challenge_price || 0} zł`,
                                        ``,
                                        `Panel admina: ${adminLink}`,
                                    ].join('\n'),
                                }).catch((e: any) => console.error('[PayU] admin mail fail', e));
                            }
                        } catch (e) {
                            console.error('[PayU] admin email dispatch failed:', e);
                        }
                    } catch (e) {
                        console.error('[PayU] Challenge email dispatch failed:', e);
                    }

                    handled = true;
                }
            }

            if (!handled && typeOrId === 'BOOKING' && !isNaN(resourceId)) {
                await prisma.booking.update({
                    where: { id: resourceId },
                    data: {
                        status: 'confirmed',
                        payu_order_id: orderId,
                        notes: `Paid via PayU (Order: ${orderId})`
                    }
                }).catch((e) => { console.error('[PayU] Booking update failed:', e); });
                handled = true;
            }

            // ============================================================
            // WORKSHOP Payment Handling
            // ============================================================
            if (!handled && typeOrId === 'WORKSHOP' && !isNaN(resourceId)) {
                // Parse payment type from extOrderId: WORKSHOP_{offerId}_{type}_{timestamp}
                const paymentType = parts.length > 2 ? parts[2] : 'full';
                
                const offer = await prisma.workshopOffer.findUnique({
                    where: { id: resourceId },
                    include: { workshop: true }
                }).catch(() => null);

                if (offer) {
                    let updateData: any = {
                        updated_at: new Date()
                    };

                    if (paymentType === 'deposit') {
                        // Mark deposit as paid
                        updateData.deposit_paid_at = new Date();
                        updateData.status = 'deposit_paid';
                        updateData.notes = `${offer.notes || ''}\n[PayU] Zaliczka opłacona (${orderId})`.trim();
                    } else {
                        // Mark as fully paid
                        updateData.status = 'paid';
                        updateData.notes = `${offer.notes || ''}\n[PayU] Opłacono całość (${orderId})`.trim();
                    }

                    await prisma.workshopOffer.update({
                        where: { id: resourceId },
                        data: updateData
                    }).catch((e) => { console.error('[PayU] Workshop offer update failed:', e); });

                    console.log(`Workshop Offer #${resourceId} → ${updateData.status} via PayU`);

                    // Send confirmation email to client
                    try {
                        const { sendEmail } = await import('@/lib/email/sender');
                        const amountPLN = (Number(order.totalAmount || 0) / 100).toFixed(2);
                        
                        await sendEmail({
                            to: offer.recipient_email,
                            subject: paymentType === 'deposit' 
                                ? '✅ Zaliczka za warsztat opłacona' 
                                : '✅ Płatność za warsztat potwierdzona',
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2 style="color: #d4af37;">Potwierdzenie płatności</h2>
                                    <p>Cześć ${offer.recipient_name || 'Kliencie'},</p>
                                    <p>Twoja płatność za warsztat <strong>${offer.workshop.title}</strong> została potwierdzona!</p>
                                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <p><strong>Kwota:</strong> ${amountPLN} PLN</p>
                                        <p><strong>Typ płatności:</strong> ${paymentType === 'deposit' ? 'Zaliczka' : 'Pełna kwota'}</p>
                                        <p><strong>Numer transakcji:</strong> ${orderId}</p>
                                    </div>
                                    ${paymentType === 'deposit' && offer.price && offer.deposit_amount ? `
                                        <p>Pozostała kwota do zapłaty: <strong>${((offer.price - offer.deposit_amount) / 100).toFixed(2)} PLN</strong></p>
                                    ` : ''}
                                    <p>Możesz sprawdzić szczegóły warsztatu w swoim <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl'}/konto?tab=warsztaty">panelu klienta</a>.</p>
                                    <p>Do zobaczenia na warsztatach!</p>
                                </div>
                            `
                        }).catch((e: any) => console.error('[PayU] Workshop client email fail', e));

                        // Send notification to admin
                        const { getAdminEmail } = await import('@/lib/email/sender');
                        const adminEmail = await getAdminEmail();
                        if (adminEmail) {
                            await sendEmail({
                                to: adminEmail,
                                subject: `💰 [WARSZTAT] Nowa płatność - ${offer.workshop.title}`,
                                html: `
                                    <div style="font-family: Arial, sans-serif;">
                                        <h3>Nowa płatność za warsztat</h3>
                                        <p><strong>Warsztat:</strong> ${offer.workshop.title}</p>
                                        <p><strong>Klient:</strong> ${offer.recipient_name || offer.recipient_email}</p>
                                        <p><strong>Uczestnik:</strong> ${offer.participant_name || '-'}</p>
                                        <p><strong>Typ:</strong> ${paymentType === 'deposit' ? 'Zaliczka' : 'Pełna kwota'}</p>
                                        <p><strong>Kwota:</strong> ${amountPLN} PLN</p>
                                        <p><strong>PayU ID:</strong> ${orderId}</p>
                                        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl'}/admin/workshops/${offer.workshop.id}">Zobacz w panelu</a></p>
                                    </div>
                                `
                            }).catch((e: any) => console.error('[PayU] Workshop admin email fail', e));
                        }
                    } catch (e) {
                        console.error('[PayU] Workshop email dispatch failed:', e);
                    }

                    handled = true;
                }
            }

            if (!handled && typeOrId === 'CONTRACT' && !isNaN(resourceId)) {
                // extOrderId: CONTRACT_{contractId}_{paymentType}_{timestamp}
                // paymentType: 'deposit' | 'remaining' | 'full'
                const paymentType = parts.length > 2 ? parts[2] : 'full';

                const contract = await prisma.contract.findUnique({
                    where: { id: resourceId },
                    include: {
                        offer: { select: { title: true, total_price: true } },
                        user: { select: { name: true, email: true } },
                    },
                }).catch(() => null);

                if (contract) {
                    const amountPLN = (Number(order.totalAmount || 0) / 100).toFixed(2);
                    let updateData: any = { updated_at: new Date() };

                    if (paymentType === 'deposit') {
                        updateData.deposit_paid_at = new Date();
                        updateData.deposit_note = `[PayU] Zaliczka opłacona (${orderId}) ${amountPLN} PLN`;
                    } else {
                        // full or remaining — mark deposit as paid too (covers everything)
                        if (!contract.deposit_paid_at) {
                            updateData.deposit_paid_at = new Date();
                        }
                        updateData.deposit_note = `[PayU] ${paymentType === 'remaining' ? 'Dopłata' : 'Pełna kwota'} opłacona (${orderId}) ${amountPLN} PLN`;
                    }

                    await prisma.contract.update({ where: { id: resourceId }, data: updateData })
                        .catch((e) => console.error('[PayU] Contract update failed:', e));

                    console.log(`[PayU] Contract #${resourceId} payment: type=${paymentType} amount=${amountPLN} PLN`);

                    // Send confirmation emails
                    try {
                        const { sendEmail, getAdminEmail } = await import('@/lib/email/sender');
                        const clientEmail = contract.user?.email;
                        const clientName = contract.user?.name || 'Kliencie';

                        if (clientEmail) {
                            await sendEmail({
                                to: clientEmail,
                                subject: paymentType === 'deposit'
                                    ? `✅ Zaliczka opłacona — ${contract.contract_number}`
                                    : `✅ Płatność potwierdzona — ${contract.contract_number}`,
                                html: `
                                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:12px;">
                                        <h2 style="color:#c5a059;">Potwierdzenie płatności</h2>
                                        <p>Cześć ${clientName},</p>
                                        <p>Twoja płatność za umowę <strong>${contract.contract_number}</strong> została potwierdzona.</p>
                                        <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin:20px 0;">
                                            <p><strong>Kwota:</strong> ${amountPLN} PLN</p>
                                            <p><strong>Typ:</strong> ${paymentType === 'deposit' ? 'Zaliczka' : paymentType === 'remaining' ? 'Dopłata (pozostała kwota)' : 'Pełna kwota'}</p>
                                            <p><strong>Nr transakcji:</strong> ${orderId}</p>
                                        </div>
                                        <p>Dziękujemy!</p>
                                    </div>
                                `
                            }).catch((e: any) => console.error('[PayU] Contract client email fail', e));
                        }

                        const adminEmail = await getAdminEmail();
                        if (adminEmail) {
                            await sendEmail({
                                to: adminEmail,
                                subject: `💰 [UMOWA] ${paymentType === 'deposit' ? 'Zaliczka' : 'Płatność'} ${amountPLN} PLN — ${contract.contract_number}`,
                                html: `
                                    <p><strong>Umowa:</strong> ${contract.contract_number}</p>
                                    <p><strong>Klient:</strong> ${clientName} (${clientEmail || '—'})</p>
                                    <p><strong>Typ:</strong> ${paymentType}</p>
                                    <p><strong>Kwota:</strong> ${amountPLN} PLN</p>
                                    <p><strong>PayU ID:</strong> ${orderId}</p>
                                `
                            }).catch(() => {});
                        }
                    } catch (e) {
                        console.error('[PayU] Contract email dispatch failed:', e);
                    }

                    handled = true;
                }
            }

            if (!handled) {
                console.warn(`[PayU] Unhandled extOrderId=${extOrderId}`);
            }
        }

        // ============================================================
        // Negatywne statusy PayU (CANCELED / REJECTED) — dla CHALLENGE_*
        // Zwalniamy slot kalendarza i kasujemy wiszący challenge,
        // żeby nie blokował terminów ani panelu admina.
        // (PENDING/WAITING_FOR_CONFIRMATION zostawiamy — to stany przejściowe.)
        // ============================================================
        if (status === 'CANCELED' || status === 'REJECTED') {
            const parts = extOrderId.split('_');
            const typeOrId = parts[0];
            const resourceId = parts.length > 1 ? parseInt(parts[1]) : NaN;

            if (typeOrId === 'CHALLENGE' && !isNaN(resourceId)) {
                const challenge = await prisma.photoChallenge.findUnique({
                    where: { id: resourceId },
                }).catch(() => null);

                if (challenge && challenge.status === 'pending_payment') {
                    // Zwolnij booking blokujący slot.
                    await prisma.booking.deleteMany({
                        where: { challenge_id: resourceId, status: 'challenge_pending' },
                    }).catch(() => null);

                    // Oznacz challenge jako anulowany (zachowujemy rekord do audytu).
                    await prisma.photoChallenge.update({
                        where: { id: resourceId },
                        data: {
                            status: 'payment_failed',
                            payment_status: status === 'CANCELED' ? 'cancelled' : 'rejected',
                            admin_notes: `PayU ${status} (Order: ${orderId})`,
                        } as any,
                    }).catch((e) => { console.error('[PayU] Challenge cancel failed:', e); });

                    await prisma.challengeTimelineEvent.create({
                        data: {
                            challenge_id: resourceId,
                            event_type: 'PAYMENT_FAILED',
                            event_description: `Płatność PayU ${status === 'CANCELED' ? 'anulowana' : 'odrzucona'}.`,
                            metadata: JSON.stringify({ orderId, status }),
                        },
                    }).catch(() => null);

                    // Powiadom zapraszającego, żeby wiedział że transakcja się nie powiodła.
                    if (challenge.inviter_email) {
                        try {
                            const { sendEmail } = await import('@/lib/email/sender');
                            await sendEmail({
                                to: challenge.inviter_email,
                                subject: '⚠️ Płatność za Foto Wyzwanie nie powiodła się',
                                text: [
                                    `Cześć ${challenge.inviter_name},`,
                                    ``,
                                    `Twoja płatność PayU za Foto Wyzwanie nie została zrealizowana (${status === 'CANCELED' ? 'anulowana' : 'odrzucona'}).`,
                                    `Slot kalendarza został zwolniony — nic nie zostało Ci pobrane.`,
                                    ``,
                                    `Możesz spróbować ponownie: https://wlasniewski.pl/foto-wyzwanie/create`,
                                    ``,
                                    `Jeśli to pomyłka, skontaktuj się z nami: https://wlasniewski.pl/kontakt`,
                                ].join('\n'),
                            }).catch((e: any) => console.error('[PayU] inviter cancel mail fail', e));
                        } catch (e) {
                            console.error('[PayU] cancel email dispatch failed:', e);
                        }
                    }
                }
            }
        }

        // ============================================================
        // REFUND notify — PayU wysyla obiekt body.refund po zwrocie.
        // ============================================================
        const refundEvent = (body as any).refund;
        if (refundEvent && refundEvent.refundId) {
            const refundedBooking = await prisma.booking.findFirst({ where: { payu_order_id: order.orderId } });
            if (refundedBooking) {
                const isComplete = refundEvent.status === 'FINALIZED' || refundEvent.status === 'COMPLETED';
                await prisma.booking.update({
                    where: { id: refundedBooking.id },
                    data: {
                        refund_status: isComplete ? 'COMPLETED' : (refundEvent.status === 'CANCELED' ? 'FAILED' : 'PENDING'),
                        refunded_at: isComplete ? new Date() : refundedBooking.refunded_at,
                        refund_id: refundEvent.refundId,
                    },
                });
                await logSystem('INFO', 'PAYMENT', `REFUND ${refundEvent.status} booking #${refundedBooking.id}`, { refundEvent });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PayU Notify Error:", error);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
}
