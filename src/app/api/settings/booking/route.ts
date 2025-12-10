import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET booking settings (public)
export async function GET(request: NextRequest) {
    try {
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });

        if (!settings) {
            return NextResponse.json({
                success: true,
                settings: {
                    booking_require_payment: false,
                    booking_payment_method: 'stripe',
                    booking_currency: 'PLN',
                    booking_min_days_ahead: 7
                }
            });
        }

        return NextResponse.json({
            success: true,
            settings: {
                booking_require_payment: settings.booking_require_payment || false,
                booking_payment_method: settings.booking_payment_method || 'stripe',
                booking_currency: settings.booking_currency || 'PLN',
                booking_min_days_ahead: settings.booking_min_days_ahead || 7
            }
        });
    } catch (error) {
        console.error('Failed to fetch booking settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}
