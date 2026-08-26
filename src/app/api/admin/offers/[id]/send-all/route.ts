import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { hasUnambiguousA4Price } from '@/lib/offers/draft-total';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { randomUUID } from 'node:crypto';
import { jsonWithCorrelation } from '@/lib/http/correlation';

const INTERNAL_TIMEOUT_MS = 20_000;

async function callInternal(request: NextRequest, id: string, correlationId: string) {
    const target = new URL(`/api/admin/offers/${encodeURIComponent(id)}/send-email`, request.url);
    if (target.origin !== request.nextUrl.origin || !['http:', 'https:'].includes(target.protocol)) {
        return { ok: false, status: 500, error: 'Odrzucono nieprawidłowy adres wewnętrzny' };
    }
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) {
        return { ok: false, status: 401, error: 'Wysyłka wymaga sesji administratora Bearer' };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), INTERNAL_TIMEOUT_MS);
    let response: Response;
    try {
        response = await fetch(target, {
        method: 'POST',
        headers: {
            Authorization: authorization,
            'X-Correlation-ID': correlationId,
        },
        redirect: 'error',
        signal: controller.signal,
        });
    } catch (error) {
        return {
            ok: false,
            status: error instanceof Error && error.name === 'AbortError' ? 504 : 502,
            error: error instanceof Error && error.name === 'AbortError'
                ? 'Przekroczono czas wewnętrznej wysyłki oferty'
                : 'Nie udało się uruchomić wewnętrznej wysyłki oferty',
        };
    } finally {
        clearTimeout(timeout);
    }
    if (response.ok) return { ok: true, status: response.status };

    let error = `HTTP ${response.status}`;
    try {
        const body = await response.json();
        error = body.error || body.details || error;
    } catch { /* response was not JSON */ }
    return { ok: false, status: response.status, error };
}

// send-email owns the single critical PDF -> S3 -> email pipeline. A separate
// pre-generation step would create and upload the same document twice.
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        const correlationId = req.headers.get('x-correlation-id') || randomUUID();
        const { id } = await context.params;
        const offerId = Number(id);
        if (!Number.isInteger(offerId)) {
            return jsonWithCorrelation({ success: false, error: 'Nieprawidłowe ID oferty', failedStep: 'validation', correlation_id: correlationId }, correlationId, 400);
        }
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            select: { id: true, is_template: true, status: true, client_id: true, client_email: true, total_price: true, template_data: true, user: { select: { email: true } } },
        });
        if (!offer) return NextResponse.json({ success: false, error: 'Oferta nie znaleziona', failedStep: 'validation' }, { status: 404 });
        if (offer.is_template) return NextResponse.json({ success: false, error: 'Nie można wysłać szablonu oferty', failedStep: 'validation' }, { status: 409 });
        if (['sent', 'open'].includes(offer.status.toLowerCase())) {
            return NextResponse.json({ success: true, alreadySent: true, results: { delivery: { ok: true, alreadySent: true } } });
        }
        if (!offer.client_id || !(offer.client_email || offer.user?.email)) {
            return NextResponse.json({ success: false, error: 'Oferta nie jest poprawnie przypisana do konta klienta', failedStep: 'validation' }, { status: 409 });
        }
        if (offer.total_price <= 0) {
            await recordAdminIncidentSafely({
                severity: 'P2', category: 'OFFER', reasonCode: 'OFFER_ZERO_PRICE_PREVENTED',
                summary: 'Zablokowano wysyłkę oferty bez dodatniej ceny', entityType: 'offer', entityId: offer.id,
                clientId: offer.client_id, clientEmail: offer.client_email, correlationId: randomUUID(),
            });
            return NextResponse.json({ success: false, error: 'Oferta nie ma poprawnej, jednoznacznej ceny', failedStep: 'validation' }, { status: 409 });
        }
        if (offer.template_data && !hasUnambiguousA4Price(offer.template_data)) {
            await recordAdminIncidentSafely({
                severity: 'P2', category: 'OFFER', reasonCode: 'OFFER_ZERO_PRICE_PREVENTED',
                summary: 'Zablokowano wysyłkę oferty z niejednoznacznym wariantem ceny', entityType: 'offer', entityId: offer.id,
                clientId: offer.client_id, clientEmail: offer.client_email, correlationId: randomUUID(),
            });
            return NextResponse.json({ success: false, error: 'Wskaż jednoznacznie rekomendowany wariant i jego cenę', failedStep: 'validation' }, { status: 409 });
        }

        const delivery = await callInternal(req, id, correlationId);
        if (!delivery.ok) {
            return jsonWithCorrelation({
                success: false,
                error: delivery.error || 'Nie udało się wysłać oferty',
                failedStep: 'delivery',
                results: { delivery },
                correlation_id: correlationId,
            }, correlationId, delivery.status && delivery.status >= 400 ? delivery.status : 502);
        }

        return jsonWithCorrelation({ success: true, results: { delivery } }, correlationId);
    });
}
