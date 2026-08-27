import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { isBookingBlockingAvailability } from '@/lib/bookingStatus';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
    try {
        if (!rateLimit(`promo-check:${getClientIp(request)}`, 20, 15 * 60_000).ok) {
            return NextResponse.json({ success: false, message: 'Zbyt wiele prób. Spróbuj później.' }, { status: 429 });
        }
        const { code } = await request.json();
        const normalizedCode = String(code || '').trim().toUpperCase();

        if (!normalizedCode || normalizedCode.length > 40 || !/^[A-Z0-9_-]+$/.test(normalizedCode)) {
            return NextResponse.json(
                { success: false, message: 'Kod jest wymagany' },
                { status: 400 }
            );
        }

        const promoCode = await prisma.promoCode.findFirst({
            where: {
                code: {
                    equals: normalizedCode,
                    mode: 'insensitive'
                }
            },
            orderBy: { id: 'asc' },
        });

        if (promoCode) {
            if (!promoCode.is_active) {
                return NextResponse.json(
                    { success: false, message: 'Ten kod jest nieaktywny' },
                    { status: 400 }
                );
            }

            const now = new Date();
            if (promoCode.valid_from && now < promoCode.valid_from) {
                return NextResponse.json(
                    { success: false, message: 'Ten kod nie jest jeszcze aktywny' },
                    { status: 400 }
                );
            }

            if (promoCode.valid_until && now > promoCode.valid_until) {
                return NextResponse.json(
                    { success: false, message: 'Ten kod wygasł' },
                    { status: 400 }
                );
            }

            if (promoCode.max_usage !== null) {
                const pendingReservations = await prisma.booking.findMany({
                    where: {
                        promo_code: { equals: promoCode.code, mode: 'insensitive' },
                        status: 'pending',
                    },
                    select: { status: true, created_at: true },
                });
                const reservedUses = pendingReservations.filter(candidate => isBookingBlockingAvailability(candidate, now)).length;
                if (promoCode.usage_count + reservedUses >= promoCode.max_usage) {
                    return NextResponse.json(
                        { success: false, message: 'Limit użyć tego kodu został wyczerpany lub jest chwilowo zarezerwowany' },
                        { status: 409 }
                    );
                }
            }

            return NextResponse.json({
                success: true,
                discount: {
                    code: promoCode.code,
                    value: promoCode.discount_value,
                    type: promoCode.discount_type, // 'percentage' or 'fixed'
                },
            });
        }

        // 2. Check Gift Cards
        const giftCard = await prisma.giftCard.findFirst({
            where: {
                code: {
                    equals: normalizedCode,
                    mode: 'insensitive'
                },
                is_active: true,
                redeemed_at: null
            }
        });

        if (giftCard) {
            const now = new Date();
            if (giftCard.valid_until && now > giftCard.valid_until) {
                return NextResponse.json(
                    { success: false, message: 'Ta karta podarunkowa wygasła' },
                    { status: 400 }
                );
            }
            const reservations = await prisma.booking.findMany({
                where: { gift_card_code: { equals: giftCard.code, mode: 'insensitive' } },
                select: { status: true, created_at: true },
            });
            if (reservations.some(candidate => isBookingBlockingAvailability(candidate, now))) {
                return NextResponse.json(
                    { success: false, message: 'Ta karta jest obecnie przypisana do innej rezerwacji' },
                    { status: 409 }
                );
            }

            return NextResponse.json({
                success: true,
                giftCard: {
                    code: giftCard.code,
                    amount: giftCard.value || giftCard.amount,
                }
            });
        }

        return NextResponse.json(
            { success: false, message: 'Nieprawidłowy kod' },
            { status: 404 }
        );

    } catch (error) {
        console.error('Error checking promo code:', error);
        return NextResponse.json(
            { success: false, message: 'Wystąpił błąd podczas sprawdzania kodu' },
            { status: 500 }
        );
    }
}
