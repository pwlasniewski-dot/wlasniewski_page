import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logSystem } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, customer, totalAmount, createAccount, password } = body;

        if (!items || !customer || items.length === 0) {
            return NextResponse.json({ ok: false, message: "Brak danych zamówienia" }, { status: 400 });
        }

        const clientIp = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];

        await logSystem('INFO', 'CHECKOUT', `Starting unified checkout for ${customer.email}`, {
            itemCount: items.length,
            total: totalAmount,
            createAccount: body.createAccount
        });

        // 1. Handle account creation if requested
        let userId: number | null = null;
        if (createAccount && password) {
            const existingUser = await prisma.user.findUnique({
                where: { email: customer.email }
            });

            if (!existingUser) {
                // Server-side validation
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
                if (!passwordRegex.test(password)) {
                    return NextResponse.json({ ok: false, message: "Hasło nie spełnia wymogów bezpieczeństwa (8 znaków, A-Z, a-z, znak specjalny)" }, { status: 400 });
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const newUser = await prisma.user.create({
                    data: {
                        email: customer.email,
                        password_hash: hashedPassword,
                        name: customer.name,
                        phone: customer.phone,
                        role: 'CLIENT',
                    }
                });
                userId = newUser.id;
            } else {
                userId = existingUser.id;
            }
        }

        // 2. Prepare Cart ID (Unified Order ID) used directly as PayU extOrderId
        // Must be unique per transaction
        const cartId = `CART_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // 3. Create records and PayU Product List
        const payuProducts = [];
        const createdResourceIds = [];

        for (const item of items) {
            if (item.type === 'booking') {
                const booking = await prisma.booking.create({
                    data: {
                        ...item.metadata,
                        status: 'pending',
                        email: customer.email,
                        client_name: customer.name,
                        phone: customer.phone,
                        stripe_session_id: cartId // Link to Cart ID for payment tracking
                    }
                });
                createdResourceIds.push(`Booking #${booking.id}`);
                payuProducts.push({
                    name: item.title || 'Rezerwacja',
                    unitPrice: item.price,
                    quantity: 1
                });
            } else if (item.type === 'gift_card') {
                // 1. Create the Gift Card (Inactive)
                const giftCard = await prisma.giftCard.create({
                    data: {
                        code: `GC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                        value: item.metadata.value,
                        amount: item.price / 100,
                        theme: item.metadata.theme,
                        is_active: false,
                        recipient_email: customer.email,
                        recipient_name: customer.name,
                        owner_id: userId
                    }
                });

                // 2. Create the Gift Card Order (Critical for Email & Notification)
                await prisma.giftCardOrder.create({
                    data: {
                        gift_card_id: giftCard.id,
                        card_id: giftCard.id, // Legacy/Redundant field requirement
                        customer_email: customer.email,
                        customer_name: customer.name,
                        amount_paid: item.price, // cents
                        payment_status: 'pending',
                        payu_order_id: cartId, // Link to Cart ID
                        access_token: crypto.randomUUID(),
                        user_id: userId,
                        // Fix: Map metadata from cart to order
                        recipient_name: item.metadata.recipient_name,
                        recipient_email: item.metadata.recipient_email, // If we add this to UI later
                        message: item.metadata.message,
                        sender_name: item.metadata.sender_name
                    }
                });

                createdResourceIds.push(`GiftCard #${giftCard.id}`);
                payuProducts.push({
                    name: item.title || 'Karta Podarunkowa',
                    unitPrice: item.price,
                    quantity: 1
                });
            }
        }

        // 4. Initiate PayU Payment
        const { createPayUOrder } = await import('@/lib/payu');

        try {
            const payuOrder = await createPayUOrder({
                description: `Zamówienie ${cartId} (${customer.email})`,
                currencyCode: 'PLN',
                totalAmount: totalAmount, // passed from frontend (verified ideally?)
                extOrderId: cartId, // THIS IS THE KEY
                buyer: {
                    email: customer.email,
                    phone: customer.phone || undefined,
                    firstName: customer.name.split(' ')[0],
                    lastName: customer.name.split(' ').slice(1).join(' ') || 'Klient',
                    language: 'pl'
                },
                products: payuProducts,
                continueUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl'}/rezerwacja/potwierdzenie?status=success`
            }, clientIp);

            return NextResponse.json({
                ok: true,
                message: "Płatność zainicjowana",
                redirectUrl: payuOrder.redirectUri, // PayU returns redirectUri
                orderId: payuOrder.orderId
            });

        } catch (payuError: any) {
            console.error('PayU Init Failed:', payuError);
            throw payuError; // Bubble up to outer catch
        }

    } catch (error: any) {
        console.error('Unified checkout error (Full Stack):', error);
        await logSystem('ERROR', 'CHECKOUT', 'Failed to process unified checkout', { error: String(error), stack: error?.stack });
        return NextResponse.json({ ok: false, message: "Błąd serwera: " + (error.message || String(error)) }, { status: 500 });
    }
}
