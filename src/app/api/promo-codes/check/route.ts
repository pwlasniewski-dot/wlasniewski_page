import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json(
                { success: false, message: 'Kod jest wymagany' },
                { status: 400 }
            );
        }

        const promoCode = await prisma.promoCode.findFirst({
            where: {
                code: {
                    equals: code,
                    mode: 'insensitive'
                }
            },
        });

        if (!promoCode) {
            return NextResponse.json(
                { success: false, message: 'Nieprawidłowy kod rabatowy' },
                { status: 404 }
            );
        }

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

        if (promoCode.max_usage && promoCode.usage_count >= promoCode.max_usage) {
            return NextResponse.json(
                { success: false, message: 'Limit użyć tego kodu został wyczerpany' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            discount: {
                code: promoCode.code,
                value: promoCode.discount_value,
                type: promoCode.discount_type, // 'percentage' or 'fixed'
            },
        });

    } catch (error) {
        console.error('Error checking promo code:', error);
        return NextResponse.json(
            { success: false, message: 'Wystąpił błąd podczas sprawdzania kodu' },
            { status: 500 }
        );
    }
}
