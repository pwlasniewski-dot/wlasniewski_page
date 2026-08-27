import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { isBookingBlockingAvailability } from '@/lib/bookingStatus';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// GET /api/gift-cards/check?code=XXX - Check if gift card is valid and available
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!rateLimit(`gift-card-check:${getClientIp(req)}`, 20, 15 * 60_000).ok) {
        return NextResponse.json({ success: false, message: 'Zbyt wiele prób. Spróbuj później.' }, { status: 429 });
    }

    if (!code || code.length > 40 || !/^[A-Za-z0-9_-]+$/.test(code)) {
        return NextResponse.json({ success: false, message: "Kod wymagany" }, { status: 400 });
    }

    try {
        const giftCard = await prisma.giftCard.findFirst({
            where: { code: { equals: code.toUpperCase(), mode: 'insensitive' } },
            orderBy: { id: 'asc' },
        });

        if (!giftCard) {
            return NextResponse.json({ success: false, message: "Nie znaleziono karty" });
        }

        const reservations = await prisma.booking.findMany({
            where: { gift_card_code: { equals: giftCard.code, mode: 'insensitive' } },
            select: { status: true, created_at: true },
        });
        const unavailable = !giftCard.is_active
            || Boolean(giftCard.redeemed_at)
            || Boolean(giftCard.valid_until && giftCard.valid_until < new Date())
            || reservations.some(candidate => isBookingBlockingAvailability(candidate));

        return NextResponse.json({
            success: !unavailable,
            giftCard: {
                code: giftCard.code,
                amount: giftCard.value || giftCard.amount,
                is_used: unavailable,
            },
        });
    } catch (error) {
        console.error("Error checking gift card:", error);
        return NextResponse.json({ success: false, message: "Błąd serwera" }, { status: 500 });
    }
}
