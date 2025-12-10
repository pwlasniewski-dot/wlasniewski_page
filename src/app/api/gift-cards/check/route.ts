import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/gift-cards/check?code=XXX - Check if gift card is valid and available
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json({ success: false, message: "Kod wymagany" }, { status: 400 });
    }

    try {
        const giftCard = await prisma.giftCard.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!giftCard) {
            return NextResponse.json({ success: false, message: "Nie znaleziono karty" });
        }

        return NextResponse.json({
            success: true,
            giftCard: {
                code: giftCard.code,
                amount: giftCard.amount,
                is_used: giftCard.is_used,
            },
        });
    } catch (error) {
        console.error("Error checking gift card:", error);
        return NextResponse.json({ success: false, message: "Błąd serwera" }, { status: 500 });
    }
}
