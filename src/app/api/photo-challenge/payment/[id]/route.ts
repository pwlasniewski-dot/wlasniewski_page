import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * DEPRECATED — historyczny mock potwierdzenia płatności.
 *
 * W produkcji potwierdzenie płatności dla Foto Wyzwania przychodzi wyłącznie
 * przez webhook PayU (`/api/payu/notify`, gałąź `CHALLENGE_*`), gdzie
 * weryfikowany jest podpis MD5. Ten GET endpoint nie wymagał żadnej
 * autentykacji i pozwalał komukolwiek z numerycznym ID wyzwania ustawić
 * `payment_status = 'paid'` oraz wysłać emaile zaproszenia bez faktycznej
 * płatności (omijając PayU). Cała logika została usunięta.
 *
 * Zachowujemy plik z odpowiedzią 410 Gone, aby:
 *  - jednoznacznie sygnalizować że route nie jest już aktywny,
 *  - złapać w logach każdą próbę dotarcia do tego URL-a (potencjalne skanowanie).
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown';

        await prisma.systemLog.create({
            data: {
                level: 'WARN',
                module: 'PAYMENT',
                message: 'DEPRECATED /api/photo-challenge/payment/[id] hit',
                metadata: JSON.stringify({
                    id,
                    ip,
                    userAgent: request.headers.get('user-agent') || null,
                    referer: request.headers.get('referer') || null,
                }),
            },
        }).catch(() => null);
    } catch {
        // best-effort log only
    }

    return NextResponse.json(
        {
            success: false,
            error: 'Gone',
            message:
                'Ten endpoint został wycofany. Potwierdzanie płatności odbywa się wyłącznie przez webhook PayU.',
        },
        { status: 410 },
    );
}
