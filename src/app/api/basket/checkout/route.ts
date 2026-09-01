import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { logSystem } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { loadDronePhotographyCmsPage } from '@/lib/dronePhotographyCms';
import { salesAttributionFromPayload } from '@/lib/analytics/salesAttribution';
import { hasBookingDateTimeConflict } from '@/lib/bookingAvailability';
import {
    normalizeBookingServiceKey,
    resolveBookingSchedule,
    validateBookingSlot,
} from '@/lib/bookingSchedule';
import { loadBookingScheduleConfiguration } from '@/lib/bookingScheduleRepository';
import { bookingDateUtcRange, isBookingDateAllowed, isBookingStartInFuture, minimumBookingDateISO } from '@/lib/bookingDate';
import { isBookingBlockingAvailability } from '@/lib/bookingStatus';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { calculateFotoMatchDiscount } from '@/lib/fotoMatchDiscount';
import { loadActivePromotionForPackage, type PublicPackagePromotion } from '@/lib/packagePromotions';

class BookingConflictError extends Error {}
class GiftCardUnavailableError extends Error {}
class ReferralVoucherUnavailableError extends Error {}
class PromoCodeUnavailableError extends Error {}

function shiftBookingDate(dateISO: string, days: number) {
    const shifted = new Date(`${dateISO}T00:00:00.000Z`);
    shifted.setUTCDate(shifted.getUTCDate() + days);
    return shifted.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
    try {
        const contentLength = Number(request.headers.get('content-length') || 0);
        if (contentLength > 100_000) {
            return NextResponse.json({ ok: false, message: 'Dane zamówienia są zbyt duże.' }, { status: 413 });
        }
        if (!rateLimit(`basket-checkout:${getClientIp(request)}`, 6, 15 * 60_000).ok) {
            return NextResponse.json({ ok: false, message: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.' }, { status: 429 });
        }

        const body = await request.json();
        const { items, customer, totalAmount, createAccount, password, fm_voucher_code, payment_plan } = body;

        if (
            !Array.isArray(items)
            || items.length === 0
            || items.length !== 1
            || !customer
            || typeof customer !== 'object'
            || typeof customer.name !== 'string'
            || !customer.name.trim()
            || customer.name.trim().length > 120
            || typeof customer.email !== 'string'
            || customer.email.length > 254
            || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)
            || (customer.phone !== undefined && (typeof customer.phone !== 'string' || customer.phone.length > 40))
            || items.some((item: any) => !item || !['booking', 'gift_card'].includes(item.type) || !['string', 'number'].includes(typeof item.productId) || (item.metadata !== undefined && (typeof item.metadata !== 'object' || Array.isArray(item.metadata))))
        ) {
            return NextResponse.json({ ok: false, message: "Checkout obsługuje jedną, jednoznacznie wycenioną pozycję." }, { status: 400 });
        }
        customer.name = customer.name.trim();
        customer.email = customer.email.trim().toLowerCase();
        customer.phone = typeof customer.phone === 'string' ? customer.phone.trim() : '';
        if (createAccount && (typeof password !== 'string' || password.length > 200)) {
            return NextResponse.json({ ok: false, message: 'Nieprawidłowe hasło.' }, { status: 400 });
        }
        if (fm_voucher_code && (typeof fm_voucher_code !== 'string' || fm_voucher_code.length > 40)) {
            return NextResponse.json({ ok: false, message: 'Nieprawidłowy voucher.' }, { status: 400 });
        }

        const clientIp = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];

        // 0. Validate Foto-Match referral voucher (if provided)
        let voucherRef: { id: number; code: string; reward_amount_grosze: number | null; reward_percent: number | null; reward_type: string | null } | null = null;
        if (fm_voucher_code) {
            const code = String(fm_voucher_code).trim().toUpperCase();
            const bookingItems = items.filter((item: any) => item?.type === 'booking');
            if (bookingItems.length !== 1) {
                return NextResponse.json({ ok: false, message: "Voucher Foto-Match można zastosować do jednej rezerwacji." }, { status: 400 });
            }
            const ref = await prisma.fotoMatchReferral.findUnique({
                where: { reward_voucher_code: code },
                select: { id: true, status: true, reward_amount_grosze: true, reward_percent: true, reward_type: true, reward_expires_at: true, reward_redeemed_at: true },
            });
            if (!ref || ref.status !== 'REWARDED' || ref.reward_redeemed_at || (ref.reward_expires_at && ref.reward_expires_at < new Date())) {
                return NextResponse.json({ ok: false, message: "Voucher nieprawidłowy, wykorzystany lub wygasły" }, { status: 400 });
            }
            voucherRef = { id: ref.id, code, reward_amount_grosze: ref.reward_amount_grosze, reward_percent: ref.reward_percent, reward_type: ref.reward_type };
        }

        const bookingSettings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        const minDaysAhead = Math.max(0, Math.min(365, bookingSettings?.booking_min_days_ahead ?? 7));

        // 0b. Validate split-payment plan (only single booking)
        let useSplitPayment = false;
        let depositPercent = 50;
        let remainingDueDays = 7;
        if (payment_plan === 'SPLIT') {
            const bookingItems = items.filter((it: any) => it.type === 'booking');
            if (bookingItems.length !== 1 || items.length !== 1) {
                return NextResponse.json({ ok: false, message: "Płatność 50/50 dostępna tylko dla pojedynczej rezerwacji w koszyku." }, { status: 400 });
            }
            if (!bookingSettings?.split_payment_enabled) {
                return NextResponse.json({ ok: false, message: "Płatność 50/50 nie jest aktualnie dostępna." }, { status: 400 });
            }
            depositPercent = bookingSettings.split_payment_deposit_percent ?? 50;
            remainingDueDays = bookingSettings.split_payment_remaining_due_days ?? 7;
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
        const appliedGiftCardCodes = new Set<string>();
        let appliedPromoCode: string | null = null;
        let appliedPromoId: number | null = null;

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
                let packagePromotion: PublicPackagePromotion | null = null;
                let regularPackagePrice = 0;

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
                    regularPackagePrice = basePrice;
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
                    regularPackagePrice = selectedPackage.price;
                    try {
                        packagePromotion = await loadActivePromotionForPackage(selectedPackage.id);
                    } catch (promotionError) {
                        console.warn('[checkout] Package promotions unavailable; using regular package price.', promotionError);
                        packagePromotion = null;
                    }
                    basePrice = packagePromotion?.price ?? regularPackagePrice;

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
                let appliedGiftCardCode: string | null = null;

                if (md.promo_code && packagePromotion && !packagePromotion.allowPromoCode) {
                    return NextResponse.json({
                        ok: false,
                        message: 'Promocja tego pakietu nie łączy się z kodem rabatowym. Usuń kod i spróbuj ponownie.',
                    }, { status: 409 });
                }

                if (md.promo_code) {
                    const promoCode = String(md.promo_code).trim().toUpperCase();
                    const promo = await prisma.promoCode.findFirst({
                        where: { code: { equals: promoCode, mode: 'insensitive' } },
                        orderBy: { id: 'asc' },
                    });
                    const now = new Date();
                    const valid = promo?.is_active &&
                        promo.valid_from <= now &&
                        (!promo.valid_until || promo.valid_until >= now);
                    if (!valid || !promo) {
                        return NextResponse.json({ ok: false, message: "Kod promocyjny wygasł lub jest nieprawidłowy." }, { status: 400 });
                    }
                    if (promo.max_usage !== null && promo.usage_count >= promo.max_usage) {
                        return NextResponse.json({ ok: false, message: "Limit użyć kodu promocyjnego został wyczerpany." }, { status: 409 });
                    }
                    appliedPromoCode = promo.code;
                    appliedPromoId = promo.id;
                    verifiedPrice = promo.discount_type === 'percentage'
                        ? verifiedPrice - Math.floor(verifiedPrice * promo.discount_value / 100)
                        : verifiedPrice - promo.discount_value * 100;
                }

                if (md.gift_card_code) {
                    const giftCode = String(md.gift_card_code).trim().toUpperCase();
                    const card = await prisma.giftCard.findFirst({
                        where: { code: { equals: giftCode, mode: 'insensitive' } },
                        orderBy: { id: 'asc' },
                    });
                    if (!card?.is_active || card.redeemed_at || (card.valid_until && card.valid_until < new Date())) {
                        return NextResponse.json({ ok: false, message: "Karta podarunkowa wygasła lub została wykorzystana." }, { status: 400 });
                    }
                    if (Array.from(appliedGiftCardCodes).some(code => code.toUpperCase() === card.code.toUpperCase())) {
                        return NextResponse.json({ ok: false, message: "Jednej karty podarunkowej nie można użyć do kilku pozycji koszyka." }, { status: 400 });
                    }
                    const giftValuePln = Number(card.value || card.amount);
                    if (!Number.isFinite(giftValuePln) || giftValuePln <= 0) {
                        return NextResponse.json({ ok: false, message: "Karta podarunkowa ma nieprawidłową wartość." }, { status: 400 });
                    }
                    verifiedPrice -= Math.round(giftValuePln * 100);
                    appliedGiftCardCode = card.code;
                    appliedGiftCardCodes.add(card.code);
                }

                if (voucherRef) {
                    const voucherDiscount = calculateFotoMatchDiscount({
                        baseAmountGrosze: verifiedPrice,
                        rewardType: voucherRef.reward_type,
                        rewardAmountGrosze: voucherRef.reward_amount_grosze,
                        rewardPercent: voucherRef.reward_percent,
                    });
                    verifiedPrice -= voucherDiscount.discountGrosze;
                }
                verifiedPrice = Math.max(0, Math.round(verifiedPrice));

                let extraBookingFields: Partial<Prisma.BookingUncheckedCreateInput> = {};
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
                const bookingDateISO = String(md.date || '');
                const bookingRange = bookingDateUtcRange(bookingDateISO);
                const bookingValidationTime = new Date();
                if (!bookingRange || !isBookingDateAllowed(bookingDateISO, minDaysAhead, bookingValidationTime, 'Europe/Warsaw')) {
                    return NextResponse.json({
                        ok: false,
                        message: `Najbliższy możliwy dzień rezerwacji to ${minimumBookingDateISO(minDaysAhead, bookingValidationTime, 'Europe/Warsaw')}.`,
                    }, { status: 400 });
                }
                const serviceKey = normalizeBookingServiceKey(serviceName);
                const scheduleConfiguration = await loadBookingScheduleConfiguration({
                    service: serviceKey,
                    fromDate: bookingDateISO,
                    toDate: bookingDateISO,
                });
                const resolvedSchedule = resolveBookingSchedule({
                    serviceKey,
                    date: bookingDateISO,
                    rules: scheduleConfiguration.rules,
                    exceptions: scheduleConfiguration.exceptions,
                });
                const verifiedSlot = resolvedSchedule?.enabled
                    ? validateBookingSlot({
                        schedule: resolvedSchedule,
                        durationMinutes: packageHours * 60,
                        startTime: md.start_time,
                        endTime: md.end_time,
                        endDayOffset: Number(md.end_day_offset),
                    })
                    : null;
                if (!verifiedSlot) {
                    return NextResponse.json({ ok: false, message: "Wybrana godzina nie jest dostępna dla tego pakietu." }, { status: 409 });
                }
                const requestedStart = verifiedSlot.start;
                if (!isBookingStartInFuture(bookingDateISO, requestedStart, bookingValidationTime, 'Europe/Warsaw')) {
                    return NextResponse.json({ ok: false, message: "Wybrana godzina już minęła. Wybierz późniejszy termin." }, { status: 409 });
                }

                const bookingDate = new Date(`${bookingDateISO}T${verifiedSlot.start}:00.000Z`);
                const allowedBookingFields: Record<string, unknown> = {
                    service: serviceName,
                    package: packageName,
                    price: verifiedPrice,
                    base_price: regularPackagePrice || basePrice,
                    date: bookingDate,
                    start_time: verifiedSlot.start,
                    end_time: verifiedSlot.end,
                    venue_city: md.venue_city ?? null,
                    venue_place: md.venue_place ?? null,
                    notes: md.notes ?? null,
                    promo_code: appliedPromoCode,
                    gift_card_code: appliedGiftCardCode,
                    challenge_id: md.challenge_id ?? null,
                    photographer_id: md.photographer_id ?? null,
                    client_id: userId,
                    booking_source: String(md.booking_source || 'booking').slice(0, 120),
                    ...salesAttributionFromPayload(md),
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
                        version: 2,
                        service: serviceName,
                        package: {
                            name: packageName,
                            regularPrice: regularPackagePrice || basePrice,
                            effectivePrice: basePrice,
                            hours: packageHours,
                        },
                        promotion: packagePromotion ? {
                            id: packagePromotion.id,
                            label: packagePromotion.label,
                            regularPrice: packagePromotion.regularPrice,
                            promotionalPrice: packagePromotion.price,
                            lowestPrice30d: packagePromotion.lowestPrice30d,
                            referenceSource: packagePromotion.referenceSource,
                            startsAt: packagePromotion.startsAt,
                            endsAt: packagePromotion.endsAt,
                            allowPromoCode: packagePromotion.allowPromoCode,
                        } : null,
                        drone: dronePackage,
                        totalBeforeDiscounts: (regularPackagePrice || basePrice) + (isDroneStandalone ? 0 : dronePackage?.price || 0),
                        totalAfterPackagePromotion: basePrice + (isDroneStandalone ? 0 : dronePackage?.price || 0),
                        totalAfterDiscounts: verifiedPrice,
                        venue: { city: md.venue_city || null, place: md.venue_place || null },
                        droneGoal: hasDrone ? String(md.drone_goal) : null,
                        bookingSource: String(md.booking_source || 'booking').slice(0, 120),
                        timing: {
                            start: verifiedSlot.start,
                            end: verifiedSlot.end,
                            endDayOffset: verifiedSlot.endDayOffset,
                            timezone: 'Europe/Warsaw',
                        },
                        attribution: salesAttributionFromPayload(md),
                        droneTermsVersion: hasDrone ? '2026-08-19' : null,
                    },
                };
                // usuń undefined żeby Prisma nie nadpisała defaultów
                Object.keys(allowedBookingFields).forEach(k => {
                    if (allowedBookingFields[k] === undefined) delete allowedBookingFields[k];
                });
                let booking;
                try {
                    booking = await prisma.$transaction(async tx => {
                        // Rezerwacja nocna blokuje oba dni. Sortowanie kluczy utrzymuje
                        // tę samą kolejność blokad dla równoległych checkoutów.
                        const lockDates = [
                            bookingDateISO,
                            ...(verifiedSlot.endDayOffset === 1 ? [shiftBookingDate(bookingDateISO, 1)] : []),
                        ].sort();
                        for (const lockDate of lockDates) {
                            await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking:${lockDate}`}))`;
                        }
                        const conflictRangeStart = new Date(`${shiftBookingDate(bookingDateISO, -1)}T00:00:00.000Z`);
                        const conflictRangeEnd = new Date(`${shiftBookingDate(bookingDateISO, 2)}T00:00:00.000Z`);
                        const lockedBookings = await tx.booking.findMany({
                            where: {
                                date: { gte: conflictRangeStart, lt: conflictRangeEnd },
                                status: { notIn: ['cancelled', 'rejected'] },
                            },
                            select: { date: true, blocks_entire_day: true, start_time: true, end_time: true, status: true, created_at: true },
                        });
                        if (hasBookingDateTimeConflict(lockedBookings.filter(candidate => isBookingBlockingAvailability(candidate)), {
                            dateISO: bookingDateISO,
                            blocksEntireDay: packageBlocksEntireDay,
                            startTime: verifiedSlot.start,
                            endTime: verifiedSlot.end,
                            endDayOffset: verifiedSlot.endDayOffset,
                        })) throw new BookingConflictError();

                        if (appliedPromoCode && appliedPromoId) {
                            await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`promo-code:${appliedPromoCode.toUpperCase()}`}))`;
                            const lockedPromo = await tx.promoCode.findUnique({ where: { id: appliedPromoId } });
                            const pendingPromoReservations = await tx.booking.count({
                                where: {
                                    promo_code: { equals: appliedPromoCode, mode: 'insensitive' },
                                    status: 'pending',
                                },
                            });
                            const currentTime = new Date();
                            if (
                                !lockedPromo
                                || !lockedPromo.is_active
                                || lockedPromo.valid_from > currentTime
                                || (lockedPromo.valid_until && lockedPromo.valid_until < currentTime)
                                || (lockedPromo.max_usage !== null && lockedPromo.usage_count + pendingPromoReservations >= lockedPromo.max_usage)
                            ) {
                                throw new PromoCodeUnavailableError();
                            }
                        }

                        if (appliedGiftCardCode) {
                            await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`gift-card:${appliedGiftCardCode}`}))`;
                            const lockedCard = await tx.giftCard.findUnique({ where: { code: appliedGiftCardCode } });
                            const existingReservations = await tx.booking.findMany({
                                where: { gift_card_code: { equals: appliedGiftCardCode, mode: 'insensitive' } },
                                select: { status: true, created_at: true },
                            });
                            if (
                                !lockedCard?.is_active
                                || lockedCard.redeemed_at
                                || (lockedCard.valid_until && lockedCard.valid_until < new Date())
                                || existingReservations.some(candidate => isBookingBlockingAvailability(candidate))
                            ) {
                                throw new GiftCardUnavailableError();
                            }
                        }

                        if (voucherRef) {
                            await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`foto-match-voucher:${voucherRef.code}`}))`;
                            const lockedVoucher = await tx.fotoMatchReferral.findUnique({
                                where: { id: voucherRef.id },
                                select: { status: true, reward_redeemed_at: true, reward_expires_at: true },
                            });
                            const existingReservations = await tx.booking.findMany({
                                where: { fm_voucher_code: voucherRef.code },
                                select: { status: true, created_at: true },
                            });
                            if (
                                !lockedVoucher
                                || lockedVoucher.status !== 'REWARDED'
                                || lockedVoucher.reward_redeemed_at
                                || (lockedVoucher.reward_expires_at && lockedVoucher.reward_expires_at < new Date())
                                || existingReservations.some(candidate => isBookingBlockingAvailability(candidate))
                            ) {
                                throw new ReferralVoucherUnavailableError();
                            }
                        }

                        return tx.booking.create({
                            data: {
                                ...allowedBookingFields,
                                ...extraBookingFields,
                                status: 'pending',
                                email: customer.email,
                                client_name: customer.name,
                                phone: customer.phone,
                                stripe_session_id: cartId // Link to Cart ID for payment tracking
                            } as Prisma.BookingUncheckedCreateInput
                        });
                    });
                } catch (error) {
                    if (error instanceof BookingConflictError) {
                        return NextResponse.json({ ok: false, message: "Ten termin został już zajęty. Wybierz inną godzinę lub dzień." }, { status: 409 });
                    }
                    if (error instanceof GiftCardUnavailableError) {
                        return NextResponse.json({ ok: false, message: "Karta podarunkowa jest już wykorzystana albo zarezerwowana w innej płatności." }, { status: 409 });
                    }
                    if (error instanceof ReferralVoucherUnavailableError) {
                        return NextResponse.json({ ok: false, message: "Voucher Foto-Match jest już wykorzystany albo zarezerwowany w innej płatności." }, { status: 409 });
                    }
                    if (error instanceof PromoCodeUnavailableError) {
                        return NextResponse.json({ ok: false, message: "Kod promocyjny jest już wykorzystany albo chwilowo zarezerwowany w innej płatności." }, { status: 409 });
                    }
                    throw error;
                }
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
                if (!Number.isFinite(verifiedGiftPrice) || verifiedGiftPrice <= 0) {
                    return NextResponse.json({ ok: false, message: "Karta podarunkowa ma nieprawidłową cenę." }, { status: 400 });
                }

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

        // Karta lub voucher mogą pokryć całość. Nie wysyłamy do PayU zamówienia 0 zł;
        // potwierdzamy je atomowo i dopiero wtedy zużywamy benefity.
        if (verifiedTotalAmount === 0) {
            try {
                const confirmedBookings = await prisma.$transaction(async tx => {
                    if (appliedPromoCode && appliedPromoId) {
                        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`promo-code:${appliedPromoCode.toUpperCase()}`}))`;
                        const promo = await tx.promoCode.findUnique({ where: { id: appliedPromoId } });
                        if (!promo || (promo.max_usage !== null && promo.usage_count >= promo.max_usage)) {
                            throw new PromoCodeUnavailableError();
                        }
                        await tx.promoCode.update({
                            where: { id: appliedPromoId },
                            data: { usage_count: { increment: 1 } },
                        });
                    }

                    for (const giftCode of appliedGiftCardCodes) {
                        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`gift-card:${giftCode}`}))`;
                        const redemption = await tx.giftCard.updateMany({
                            where: { code: giftCode, is_active: true, redeemed_at: null },
                            data: { is_active: false, redeemed_at: new Date() },
                        });
                        if (redemption.count !== 1) throw new GiftCardUnavailableError();
                    }

                    if (voucherRef) {
                        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`foto-match-voucher:${voucherRef.code}`}))`;
                        const redemption = await tx.fotoMatchReferral.updateMany({
                            where: { id: voucherRef.id, status: 'REWARDED', reward_redeemed_at: null },
                            data: { reward_redeemed_at: new Date() },
                        });
                        if (redemption.count !== 1) throw new ReferralVoucherUnavailableError();
                    }

                    await tx.booking.updateMany({
                        where: { stripe_session_id: cartId, status: 'pending' },
                        data: {
                            status: 'confirmed',
                            payment_plan: 'FULL',
                            remaining_amount: 0,
                        },
                    });
                    return tx.booking.findMany({ where: { stripe_session_id: cartId } });
                });

                for (const booking of confirmedBookings) {
                    try {
                        const { sendBookingConfirmationEmail } = await import('@/lib/email/booking');
                        await sendBookingConfirmationEmail(booking);
                    } catch (emailError) {
                        await logSystem('ERROR', 'EMAIL', 'Failed to send zero-total booking confirmation', { bookingId: booking.id, error: String(emailError) });
                    }
                }

                return NextResponse.json({
                    ok: true,
                    paymentRequired: false,
                    message: "Rezerwacja potwierdzona bez dopłaty",
                    redirectUrl: `/rezerwacja/potwierdzenie?status=success&order=${encodeURIComponent(cartId)}`,
                    orderId: cartId,
                });
            } catch (error) {
                await prisma.booking.updateMany({
                    where: { stripe_session_id: cartId, status: 'pending' },
                    data: { status: 'cancelled', cancelled_at: new Date(), cancelled_by: 'SYSTEM' },
                }).catch(() => undefined);
                if (error instanceof GiftCardUnavailableError || error instanceof ReferralVoucherUnavailableError || error instanceof PromoCodeUnavailableError) {
                    return NextResponse.json({ ok: false, message: "Benefit został wykorzystany w innej transakcji. Odśwież koszyk." }, { status: 409 });
                }
                throw error;
            }
        }

        // 4. Initiate PayU Payment
        const { createPayUOrder, cancelPayUOrder } = await import('@/lib/payu');

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
                continueUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl'}/rezerwacja/potwierdzenie?status=success&order=${encodeURIComponent(cartId)}`
            }, clientIp);

            try {
                await prisma.booking.updateMany({
                    where: { stripe_session_id: cartId, status: 'pending' },
                    data: { payu_order_id: String(payuOrder.orderId) },
                });
            } catch (linkError) {
                await cancelPayUOrder(String(payuOrder.orderId)).catch(() => undefined);
                throw linkError;
            }

            return NextResponse.json({
                ok: true,
                paymentRequired: true,
                message: "Płatność zainicjowana",
                redirectUrl: payuOrder.redirectUri, // PayU returns redirectUri
                orderId: payuOrder.orderId
            });

        } catch (payuError: any) {
            console.error('PayU Init Failed:', payuError);
            await prisma.$transaction([
                prisma.booking.updateMany({
                    where: { stripe_session_id: cartId, status: 'pending' },
                    data: {
                        status: 'cancelled',
                        cancelled_at: new Date(),
                        cancelled_by: 'SYSTEM',
                        cancellation_reason: 'Nie udało się zainicjować płatności PayU.',
                    },
                }),
                prisma.giftCardOrder.updateMany({
                    where: { payu_order_id: cartId, payment_status: 'pending' },
                    data: { payment_status: 'failed' },
                }),
            ]).catch(cleanupError => console.error('Checkout cleanup failed:', cleanupError));
            return NextResponse.json({ ok: false, message: "Nie udało się rozpocząć płatności. Termin został zwolniony — spróbuj ponownie." }, { status: 502 });
        }

    } catch (error: any) {
        console.error('Unified checkout error (Full Stack):', error);
        await logSystem('ERROR', 'CHECKOUT', 'Failed to process unified checkout', { error: String(error), stack: error?.stack });
        return NextResponse.json({ ok: false, message: "Błąd serwera: " + (error.message || String(error)) }, { status: 500 });
    }
}
