import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logSystem } from '@/lib/logger';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, customer, totalAmount, createAccount, password } = body;

        if (!items || !customer || items.length === 0) {
            return NextResponse.json({ ok: false, message: "Brak danych zamówienia" }, { status: 400 });
        }

        // 1. Double check price on server? (Wait, for now trust but verify metadata)
        // In production, we should re-fetch prices from DB.

        await logSystem('INFO', 'CHECKOUT', `Starting unified checkout for ${customer.email}`, {
            itemCount: items.length,
            total: totalAmount,
            createAccount: body.createAccount
        });

        // 2. Handle account creation if requested
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
                        phone: customer.phone
                    }
                });
                userId = newUser.id;
            } else {
                userId = existingUser.id;
            }
        }

        // 3. Create internal records in 'pending' status
        const createdItems = [];

        for (const item of items) {
            if (item.type === 'booking') {
                const booking = await prisma.booking.create({
                    data: {
                        ...item.metadata,
                        status: 'pending',
                        email: customer.email, // Ensure email matches checkout
                        client_name: customer.name,
                        phone: customer.phone,
                        user_id: userId
                    }
                });
                createdItems.push({ type: 'booking', id: booking.id });
            } else if (item.type === 'gift_card') {
                const giftCard = await prisma.giftCard.create({
                    data: {
                        code: `GC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                        value: item.metadata.value,
                        amount: item.price / 100,
                        theme: item.metadata.theme,
                        is_active: false, // Wait for payment
                        recipient_email: customer.email,
                        recipient_name: customer.name,
                        owner_id: userId
                    }
                });
                createdItems.push({ type: 'gift_card', id: giftCard.id });
            }
        }

        // 3. Initiate Single Payment (e.g. PayU)
        // For simplicity, I'll leverage the existing checkout logic or create a new one.
        // We'll return a mock URL for now or integrate with PayU if possible here.

        return NextResponse.json({
            ok: true,
            message: "Zamówienie utworzone",
            items: createdItems
        });

    } catch (error) {
        console.error('Unified checkout error:', error);
        await logSystem('ERROR', 'CHECKOUT', 'Failed to process unified checkout', { error: String(error) });
        return NextResponse.json({ ok: false, message: "Błąd serwera" }, { status: 500 });
    }
}
