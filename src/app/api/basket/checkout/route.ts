import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logSystem } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { loadDronePhotographyCmsPage } from '@/lib/dronePhotographyCms';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, customer, totalAmount, createAccount, password, fm_voucher_code, payment_plan } = body;

        if (!items || !customer || items.length === 0) {
            return NextResponse.json({ ok: false, message: "Brak danych zamówienia" }, { status: 400 });
        }

        const clientIp = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];

        // 0. Validate Foto-Match referral voucher (if provided)
        let voucherRef: { id: number; reward_amount_grosze: number | null; reward_percent: number | null; reward_type: string | null } | null = null;
        if (fm_voucher_code) {
            const code = String(fm_voucher_code).trim().toUpperCase();
            const ref = await prisma.fotoMatchReferral.findUnique({
                where: { reward_voucher_code: code },
                select: { id: true, status: true, reward_amount_grosze: true, reward_percent: true, reward_type: true, reward_expires_at: true, reward_redeemed_at: true },
            });
            if (!ref || ref.status !== 'REWARDED' || ref.reward_redeemed_at || (ref.reward_expires_at && ref.reward_expires_at < new Date())) {
                return NextResponse.json({ ok: false, message: "Voucher nieprawidłowy, wykorzystany lub wygasły" }, { status: 400 });
            }
            voucherRef = { id: ref.id, reward_amount_grosze: ref.reward_amount_grosze, reward_percent: ref.reward_percent, reward_type: ref.reward_type };
        }

        // 0b. Validate split-payment plan (only single booking)
        let useSplitPayment = false;
        let depositPercent = 50;
        let remainingDueDays = 7;
        if (payment_plan === 'SPLIT') {
            const bookingItems = items.filter((it: any) => it.type === 'booking');
            if (bookingItems.length !== 1 || items.length !== 1) {
                return NextResponse.json({ ok: false, message: "Płatność 50/50 dostępna tylko dla pojedynczej rezerwacji w koszyku." }, { status: 400 });
            }
            const setting = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
            if (!setting?.split_payment_enabled) {
                return NextResponse.json({ ok: false, message: "Płatność 50/50 nie jest aktualnie dostępna." }, { status: 400 });
            }
            depositPercent = setting.split_payment_deposit_percent ?? 50;
            remainingDueDays = setting.split_payment_remaining_due_days ?? 7;
            useSplitPayment = true;
        }

        await logSystem('INFO', 'CHECKOUT', `Starting unified checkout for ${customer.email}`, {
            itemCount: items.length,
            total: totalAmount,
            createAccount: body.createAccount,
            voucher: !!voucherRef,
            split: useSplitPayment,
        });

        // 1. Handle account creation if requested
        const existingUser = await prisma.user.findUnique({ where: { email: customer.email } });
        let userId: number | null = existingUser?.id || null;
        if (createAccount && password && !existingUser) {
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
        }

        // 2. Prepare Cart ID (Unified Order ID) used directly as PayU extOrderId
        // Must be unique per transaction
        const cartId = `CART_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // 3. Create records and PayU Product List
        const payuProducts = [];
        const createdResourceIds = [];

        let droneConfigPromise: ReturnType<typeof loadDronePhotographyCmsPage> | null = null;
        for (const item of items) {
            if (item.type === 'booking') {
                const md = (item.metadata || {}) as Record<string, any>;
                const isDroneStandalone = md.booking_package_source === 'drone_cms' || String(item.productId).startsWith('drone:');
                let serviceName = '';
                let packageName = '';
                let packageHours = 1;
                let packageBlocksEntireDay = false;
                let basePrice = 0;
                let dronePackage: { slug: string; name: string; price: number } | null = null;
                let selectedPackage: any = null;

                if (isDroneStandalone) {
                    droneConfigPromise ||= loadDronePhotographyCmsPage();
                    const { config } = await droneConfigPromise;
                    const slug = String(md.package_slug || item.productId).replace(/^drone:/, '');
                    const selected = config.packages.find(candidate =>
                        candidate.slug === slug &&
                        candidate.active !== false &&
                        candidate.bookingMode !== 'addon'
                    );
                    if (!selected) return NextResponse.json({ ok: false, message: 'Wybrany pakiet dronowy nie jest już dostępny.' }, { status: 400 });
                    serviceName = 'Dron';
                    packageName = selected.name;
                    packageHours = Math.max(1, selected.durationHours || 1);
                    packageBlocksEntireDay = selected.blocksEntireDay === true;
                    basePrice = selected.price * 100;
                    dronePackage = { slug: selected.slug, name: selected.name, price: selected.price * 100 };
                } else {
                    const packageId = Number(item.productId);
                    if (!Number.isInteger(packageId)) return NextResponse.json({ ok: false, message: 'Nieprawidłowy pakiet.' }, { status: 400 });
                    selectedPackage = await prisma.package.findFirst({
                        where: { id: packageId, is_active: true },
                        include: { service: true },
                    });
                    if (!selectedPackage || !selectedPackage.service?.is_active) {
                        return NextResponse.json({ ok: false, message: 'Wybrany pakiet nie jest już dostępny.' }, { status: 400 });
                    }
                    serviceName = selectedPackage.service.name;
                    packageName = selectedPackage.name;
                    packageHours = selectedPackage.hours;
                    packageBlocksEntireDay = selectedPackage.blocks_entire_day === true;
                    basePrice = selectedPackage.price;

                    if (md.drone_addon_slug) {
                        droneConfigPromise ||= loadDronePhotographyCmsPage();
                        const { config } = await droneConfigPromise;
                        const addon = config.packages.find(candidate =>
                            candidate.slug === String(md.drone_addon_slug) &&
                            candidate.active !== false &&
                            (candidate.bookingMode === 'addon' || candidate.bookingMode === 'both') &&
                            (candidate.eligibleServices || []).includes(serviceName)
                        );
                        if (!addon) return NextResponse.json({ ok: false, message: 'Wybrany dodatek dronowy nie jest dostępny dla tej usługi.' }, { status: 400 });
                        dronePackage = { slug: addon.slug, name: addon.name, price: addon.price * 100 };
                    }
                }

                const hasDrone = Boolean(dronePackage);
                if (hasDrone) {
                    droneConfigPromise ||= loadDronePhotographyCmsPage();
                    const { config } = await droneConfigPromise;
                    if (!config.booking.goalOptions.includes(String(md.drone_goal || ''))) {
                        return NextResponse.json({ ok: false, message: 'Wybierz główne zadanie materiału z drona.' }, { status: 400 });
                    }
                    if (!md.drone_terms_accepted || !md.venue_city || !md.venue_place) {
                        return NextResponse.json({ ok: false, message: 'Do rezerwacji drona potrzebne są miejsce realizacji i akceptacja warunków lotu.' }, { status: 400 });
                    }
                }

                let verifiedPrice = basePrice + (isDroneStandalone ? 0 : dronePackage?.price || 0);

                if (md.promo_code) {
                    const promoCode = String(md.promo_code).trim().toUpperCase();
                    const promo = await prisma.promoCode.findUnique({ where: { code: promoCode } });
                    const now = new Date();
                    const valid = promo?.is_active &&
                        promo.valid_from <= now &&
                        (!promo.valid_until || promo.valid_until >= now) &&
                        (!promo.max_usage || promo.usage_count < promo.max_usage);
                    if (!valid || !promo) {
                        return NextResponse.json({ ok: false, message: "Kod promocyjny wygasł lub jest nieprawidłowy." }, { status: 400 });
                    }
                    verifiedPrice = promo.discount_type === 'percentage'
                        ? verifiedPrice - Math.floor(verifiedPrice * promo.discount_value / 100)
                        : verifiedPrice - promo.discount_value * 100;
                }

                if (md.gift_card_code) {
                    const giftCode = String(md.gift_card_code).trim().toUpperCase();
                    const card = await prisma.giftCard.findUnique({ where: { code: giftCode } });
                    if (!card?.is_active || card.redeemed_at || (card.valid_until && card.valid_until < new Date())) {
                        return NextResponse.json({ ok: false, message: "Karta podarunkowa wygasła lub została wykorzystana." }, { status: 400 });
                    }
                    verifiedPrice -= card.amount * 100;
                }

                if (voucherRef) {
                    const voucherDiscount = voucherRef.reward_type === 'PERCENT'
                        ? Math.floor(verifiedPrice * Number(voucherRef.reward_percent || 0) / 100)
                        : Number(voucherRef.reward_amount_grosze || 0);
                    verifiedPrice -= voucherDiscount;
                }
                verifiedPrice = Math.max(0, Math.round(verifiedPrice));

                let extraBookingFields: Record<string, any> = {};
                if (useSplitPayment) {
                    const totalGrosze = verifiedPrice;
                    const depositGrosze = Math.round(totalGrosze * depositPercent / 100);
                    const remainingGrosze = totalGrosze - depositGrosze;
                    const dueAt = item.metadata?.date ? new Date(item.metadata.date) : new Date();
                    dueAt.setDate(dueAt.getDate() - remainingDueDays);
                    extraBookingFields = {
                        payment_plan: 'SPLIT',
                        deposit_amount: depositGrosze,
                        deposit_session_id: cartId,
                        remaining_amount: remainingGrosze,
                        remaining_due_at: dueAt,
                    };
                } else {
                    extraBookingFields = { payment_plan: 'FULL' };
                }
                if (voucherRef) {
                    extraBookingFields.fm_voucher_code = String(fm_voucher_code).trim().toUpperCase();
                }
                // Whitelist tylko pól które naprawdę istnieją w modelu Booking.
                // Frontend wysyła m.in. `hours`, `originalPrice`, `photographer_name`,
                // `pricing_mode` itp. — one nie istnieją w schemacie i wywalały całe checkout (500).
                // Date musi być ISO-8601 DateTime — frontend często wysyła "2026-05-01" (samo YYYY-MM-DD)
                let bookingDate: Date | undefined;
                if (md.date) {
                    const raw = String(md.date);
                    // doklejamy czas startu sesji albo północ, żeby Prisma przyjęła
                    const isoCandidate = raw.includes('T') ? raw : `${raw}T${md.start_time || '00:00'}:00`;
                    const d = new Date(isoCandidate);
                    if (!isNaN(d.getTime())) bookingDate = d;
                }
                if (!bookingDate) {
                    return NextResponse.json({ ok: false, message: "Brak lub nieprawidłowa data rezerwacji." }, { status: 400 });
                }
                const allowedBookingFields: Record<string, any> = {
                    service: serviceName,
                    package: packageName,
                    price: verifiedPrice,
                    base_price: basePrice,
                    date: bookingDate,
                    start_time: md.start_time ?? null,
                    end_time: md.end_time ?? null,
                    venue_city: md.venue_city ?? null,
                    venue_place: md.venue_place ?? null,
                    notes: md.notes ?? null,
                    promo_code: md.promo_code ?? null,
                    gift_card_code: md.gift_card_code ?? null,
                    challenge_id: md.challenge_id ?? null,
                    photographer_id: md.photographer_id ?? null,
                    client_id: userId,
                    booking_source: String(md.booking_source || 'booking').slice(0, 120),
                    booking_kind: isDroneStandalone ? 'DRONE_STANDALONE' : hasDrone ? 'PHOTO_WITH_DRONE' : 'STANDARD',
                    company_name: md.company_name ? String(md.company_name).slice(0, 120) : null,
                    drone_package_slug: dronePackage?.slug || null,
                    drone_package_name: dronePackage?.name || null,
                    drone_price: dronePackage?.price || null,
                    drone_goal: hasDrone ? String(md.drone_goal) : null,
                    drone_terms_accepted_at: hasDrone ? new Date() : null,
                    flight_check_status: hasDrone ? 'PENDING' : null,
                    blocks_entire_day: packageBlocksEntireDay,
                    booking_snapshot: {
                        version: 1,
                        service: serviceName,
                        package: { name: packageName, price: basePrice, hours: packageHours },
                        drone: dronePackage,
                        totalBeforeDiscounts: basePrice + (isDroneStandalone ? 0 : dronePackage?.price || 0),
                        totalAfterDiscounts: verifiedPrice,
                        venue: { city: md.venue_city || null, place: md.venue_place || null },
                        droneGoal: hasDrone ? String(md.drone_goal) : null,
                        bookingSource: String(md.booking_source || 'booking').slice(0, 120),
                        droneTermsVersion: hasDrone ? '2026-08-19' : null,
                    },
                };
                // usuń undefined żeby Prisma nie nadpisała defaultów
                Object.keys(allowedBookingFields).forEach(k => {
                    if (allowedBookingFields[k] === undefined) delete allowedBookingFields[k];
                });
                const booking = await prisma.booking.create({
                    data: {
                        ...allowedBookingFields,
                        ...extraBookingFields,
                        status: 'pending',
                        email: customer.email,
                        client_name: customer.name,
                        phone: customer.phone,
                        stripe_session_id: cartId // Link to Cart ID for payment tracking
                    }
                });
                createdResourceIds.push(`Booking #${booking.id}`);
                payuProducts.push({
                    name: `${serviceName}: ${packageName}${!isDroneStandalone && dronePackage ? ` + ${dronePackage.name}` : ''}`,
                    unitPrice: useSplitPayment ? Math.round(verifiedPrice * depositPercent / 100) : verifiedPrice,
                    quantity: 1
                });
            } else if (item.type === 'gift_card') {
                const templateId = Number(item.productId);
                if (!Number.isInteger(templateId)) {
                    return NextResponse.json({ ok: false, message: "Nieprawidłowa karta podarunkowa." }, { status: 400 });
                }

                const template = await prisma.giftCard.findFirst({
                    where: {
                        id: templateId,
                        code: { startsWith: 'TPL-' },
                        status: 'available',
                        card_template: 'product',
                    },
                });

                if (!template) {
                    return NextResponse.json({ ok: false, message: "Wybrana karta nie jest już dostępna." }, { status: 400 });
                }

                const giftValuePln = template.value || template.amount;
                const verifiedGiftPrice = Math.round(giftValuePln * 100);

                await prisma.giftCardOrder.create({
                    data: {
                        gift_card_id: template.id,
                        card_id: template.id,
                        template_id: template.id,
                        customer_email: customer.email,
                        customer_name: customer.name,
                        amount_paid: verifiedGiftPrice,
                        payment_status: 'pending',
                        payu_order_id: cartId,
                        access_token: crypto.randomUUID(),
                        user_id: userId,
                        recipient_name: item.metadata?.recipient_name,
                        recipient_email: item.metadata?.recipient_email,
                        message: String(item.metadata?.message || '').slice(0, 300) || undefined,
                        sender_name: item.metadata?.sender_name,
                    },
                });

                createdResourceIds.push(`GiftCard template #${template.id}`);
                payuProducts.push({
                    name: template.card_title || 'Karta podarunkowa',
                    unitPrice: verifiedGiftPrice,
                    quantity: 1,
                });
            }
        }

        const verifiedTotalAmount = payuProducts.reduce(
            (sum, product) => sum + Number(product.unitPrice) * Number(product.quantity),
            0
        );
        if (verifiedTotalAmount < 0 || !Number.isInteger(verifiedTotalAmount)) {
            return NextResponse.json({ ok: false, message: "Nie udało się potwierdzić kwoty zamówienia." }, { status: 400 });
        }

        // 4. Initiate PayU Payment
        const { createPayUOrder } = await import('@/lib/payu');

        try {
            const payuOrder = await createPayUOrder({
                description: `Zamówienie ${cartId} (${customer.email})`,
                currencyCode: 'PLN',
                totalAmount: verifiedTotalAmount,
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

            // Mark voucher as redeemed after successful PayU init.
            // Note: if user abandons payment, voucher stays redeemed (acceptable trade-off vs double-use risk).
            if (voucherRef) {
                await prisma.fotoMatchReferral.update({
                    where: { id: voucherRef.id },
                    data: { reward_redeemed_at: new Date() },
                }).catch(() => { });
            }

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
