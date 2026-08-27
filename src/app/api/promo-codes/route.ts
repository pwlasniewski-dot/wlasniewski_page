import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

// GET: List all promo codes
export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

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
export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { code, discount_value, discount_type, valid_from, valid_until, max_usage } = body;
        const normalizedCode = String(code || '').trim().toUpperCase();
        const discountValue = Number(discount_value);
        const validFrom = valid_from ? new Date(`${valid_from}T00:00:00.000Z`) : new Date();
        const validUntil = valid_until ? new Date(`${valid_until}T23:59:59.999Z`) : null;
        const maxUsage = max_usage === null || max_usage === undefined || max_usage === ''
            ? null
            : Number(max_usage);

        if (
            !/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(normalizedCode)
            || !Number.isInteger(discountValue)
            || discountValue <= 0
            || !['percentage', 'fixed'].includes(discount_type)
            || (discount_type === 'percentage' && discountValue > 100)
            || Number.isNaN(validFrom.getTime())
            || (validUntil && (Number.isNaN(validUntil.getTime()) || validUntil < validFrom))
            || (maxUsage !== null && (!Number.isInteger(maxUsage) || maxUsage <= 0 || maxUsage > 1_000_000))
        ) {
            return NextResponse.json(
                { success: false, message: 'Nieprawidłowe dane kodu promocyjnego' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.promoCode.findFirst({
            where: { code: { equals: normalizedCode, mode: 'insensitive' } },
            orderBy: { id: 'asc' },
        });

        if (existing) {
            return NextResponse.json(
                { success: false, message: 'Kod już istnieje' },
                { status: 400 }
            );
        }

        const promoCode = await prisma.promoCode.create({
            data: {
                code: normalizedCode,
                discount_value: discountValue,
                discount_type,
                valid_from: validFrom,
                valid_until: validUntil,
                max_usage: maxUsage,
                is_active: true,
                show_in_gallery: false,
                show_in_banner: false,
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
