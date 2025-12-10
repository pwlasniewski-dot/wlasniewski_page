import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET: List all promo codes
export async function GET() {
    try {
        const codes = await prisma.promoCode.findMany({
            orderBy: { created_at: 'desc' },
        });
        return NextResponse.json({ success: true, codes });
    } catch (error) {
        console.error('Error fetching promo codes:', error);
        return NextResponse.json(
            { success: false, message: 'Błąd pobierania kodów' },
            { status: 500 }
        );
    }
}

// POST: Create new promo code
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, discount_value, discount_type, valid_from, valid_until, max_usage } = body;

        if (!code || !discount_value || !discount_type) {
            return NextResponse.json(
                { success: false, message: 'Brak wymaganych danych' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.promoCode.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (existing) {
            return NextResponse.json(
                { success: false, message: 'Kod już istnieje' },
                { status: 400 }
            );
        }

        const promoCode = await prisma.promoCode.create({
            data: {
                code: code.toUpperCase(),
                discount_value: parseInt(discount_value),
                discount_type,
                valid_from: valid_from ? new Date(valid_from) : new Date(),
                valid_until: valid_until ? new Date(valid_until) : null,
                max_usage: max_usage ? parseInt(max_usage) : null,
                is_active: true,
                usage_count: 0,
            },
        });

        return NextResponse.json({ success: true, code: promoCode });
    } catch (error) {
        console.error('Error creating promo code:', error);
        return NextResponse.json(
            { success: false, message: 'Błąd tworzenia kodu' },
            { status: 500 }
        );
    }
}
