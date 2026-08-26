/**
 * API: Klient dodaje/usuwa album jako dodatek do oferty.
 * Zapisuje w Offer.selected_addons (JSON) + email do fotografa.
 *
 * POST { offer_id, album_id, custom_pages?, custom_format_request?, message? }
 * DELETE { offer_id, addon_id }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logSystem } from '@/lib/logger';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import {
    CLIENT_ACTIONABLE_OFFER_STATUS_VALUES,
    isClientActionableOfferStatus,
    isClientVisibleOfferStatus,
} from '@/lib/offers/status';
import { randomUUID } from 'node:crypto';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

export const dynamic = 'force-dynamic';

type Addon = {
    id: string;                    // unikalny id (album_id + timestamp)
    album_id: number;
    album_title: string;
    base_price: number;            // cena bazowa producenta
    base_pages: number | null;     // baza rozkładówek
    base_format: string | null;
    custom_pages: number | null;   // wybrane przez klienta (jesli zmienione)
    custom_format_request: string | null;
    price_per_spread: number;      // cena za rozkladowke
    final_price: number;           // wyliczona cena dla klienta
    currency: string;
    cover_image_url: string | null;
    message: string | null;
    selected_at: string;
    status: 'pending';             // czeka na potwierdzenie fotografa
};

function caseCode(correlationId: string) {
    return correlationId.replaceAll('-', '').slice(0, 8).toUpperCase();
}

function errorResponse(error: string, status: number, correlationId: string) {
    return NextResponse.json({ error, caseCode: caseCode(correlationId) }, {
        status,
        headers: { 'X-Correlation-ID': correlationId },
    });
}

async function getAuthorizedOffer(request: NextRequest, offerId: number, correlationId: string) {
    const token = extractToken(request.headers.get('authorization'))
        || request.cookies.get('client_token')?.value
        || request.cookies.get('user_token')?.value;
    const decoded = token ? await verifyToken(token) : null;
    if (!decoded) {
        return { response: errorResponse('Unauthorized', 401, correlationId) };
    }
    const client = await revalidateActiveClient(decoded);
    if (!client) return { response: errorResponse('Unauthorized', 401, correlationId) };

    const offer = await prisma.offer.findUnique({
        where: { id: offerId },
    });
    if (!offer) {
        return { response: errorResponse('Not found', 404, correlationId) };
    }
    if (offer.client_id !== client.id) {
        return { response: errorResponse('Forbidden', 403, correlationId) };
    }

    return { offer, client };
}

async function recordAddonAuditFailure(
    action: 'addon_added' | 'addon_removed',
    correlationId: string,
    offer: { id: number; client_id: number | null; client_email: string | null },
    error: unknown,
) {
    await logSystem('WARN', 'SYSTEM', `CrmActivity ${action} failed`, {
        correlation_id: correlationId,
        offer_id: offer.id,
        error: String(error),
    });
    await recordAdminIncidentSafely({
        severity: 'P1',
        category: 'AUDIT',
        reasonCode: action === 'addon_added' ? 'OFFER_ADDON_ADD_AUDIT_FAILED' : 'OFFER_ADDON_REMOVE_AUDIT_FAILED',
        summary: 'Nie udało się zapisać audytu zmiany dodatków oferty',
        clientId: offer.client_id,
        clientEmail: offer.client_email,
        entityType: 'offer',
        entityId: offer.id,
        correlationId,
        details: { action, error: error instanceof Error ? error.message : String(error) },
    });
}

// Format (z bazy: NphotoAlbum.format_options) → rabat (discount_pct)

function normalizeFormat(s: string | null | undefined): string {
    return (s || '').toLowerCase().replace(/\s+/g, '').replace(/×/g, 'x').replace(/cm/g, '');
}

type FormatOption = { label: string; discount_pct: number };

function findFormatOption(album: any, customFormat: string | null): FormatOption | null {
    if (!customFormat) return null;
    const opts: FormatOption[] = Array.isArray(album.format_options) ? album.format_options : [];
    const norm = normalizeFormat(customFormat);
    return opts.find(o => normalizeFormat(o.label) === norm) || null;
}

/**
 * 1 rozkładówka = 2 strony.
 * Minimalna liczba rozkładówek = baza albumu (nie mniej niż 10 = 20 stron).
 * Cena = base + (custom_spreads - base_spreads) * price_per_spread.
 * Jeśli klient wybrał wariant formatu z `format_options` → −discount_pct%.
 */
function calcFinal(
    basePrice: number,
    basePages: number | null,
    customPages: number | null,
    pricePerSpread: number,
    customFormat: string | null,
    album: any,
): number {
    let price = basePrice;
    if (basePages && customPages && customPages !== basePages) {
        const baseSpreads = Math.round(basePages / 2);
        const customSpreads = Math.max(baseSpreads, Math.round(customPages / 2));
        const diffSpreads = customSpreads - baseSpreads;
        price = price + diffSpreads * pricePerSpread;
    }
    const opt = findFormatOption(album, customFormat);
    if (opt) {
        const pct = Math.max(0, Math.min(90, Number(opt.discount_pct) || 0));
        price = price * (1 - pct / 100);
    }
    return Math.max(0, Math.round(price));
}

export async function POST(request: NextRequest) {
    const correlationId = randomUUID();
    try {
        const body = await request.json();
        const { offer_id, album_id, custom_pages, custom_format_request, message } = body;

        if (!offer_id || !album_id) {
            return errorResponse('Missing offer_id or album_id', 400, correlationId);
        }

        const authorized = await getAuthorizedOffer(request, Number(offer_id), correlationId);
        if ('response' in authorized) return authorized.response;
        const { offer, client } = authorized;
        const album = await prisma.nphotoAlbum.findUnique({ where: { id: Number(album_id) } });

        if (!album) return errorResponse('Not found', 404, correlationId);

        if (!isClientActionableOfferStatus(offer.status)) {
            return errorResponse('Dodatki można zmieniać tylko w aktywnej, wysłanej ofercie.', 409, correlationId);
        }

        const pricePerSpread = album.price_per_spread || 40;
        const basePages = album.pages_count || null;
        const baseSpreads = Math.max(10, Math.round((basePages || 20) / 2));
        const requestedPages = custom_pages != null ? Number(custom_pages) : null;
        const requestedSpreads = requestedPages != null ? Math.round(requestedPages / 2) : baseSpreads;
        const normalizedSpreads = Math.max(baseSpreads, requestedSpreads);
        const normalizedCustomPages = normalizedSpreads * 2;

        const finalPrice = calcFinal(
            album.price || 0,
            basePages,
            normalizedCustomPages,
            pricePerSpread,
            custom_format_request || null,
            album,
        );

        const addon: Addon = {
            id: `${album.id}-${randomUUID()}`,
            album_id: album.id,
            album_title: album.title,
            base_price: album.price || 0,
            base_pages: basePages,
            base_format: album.format || null,
            custom_pages: basePages && normalizedCustomPages === basePages ? null : normalizedCustomPages,
            custom_format_request: custom_format_request || null,
            price_per_spread: pricePerSpread,
            final_price: finalPrice,
            currency: album.currency || 'PLN',
            cover_image_url: album.cover_image_url || null,
            message: message || null,
            selected_at: new Date().toISOString(),
            status: 'pending',
        };

        // Usun istniejacy ten sam album_id (zeby nie duplikowac - klient moze "zmienic parametry")
        const current: Addon[] = Array.isArray(offer.selected_addons) ? (offer.selected_addons as any) : [];
        const filtered = current.filter(a => a && a.album_id !== album.id);
        const next = [...filtered, addon];

        const changed = await prisma.offer.updateMany({
            where: {
                id: offer.id,
                client_id: client.id,
                status: { in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES },
                updated_at: offer.updated_at,
            },
            data: { selected_addons: next as any }
        });
        if (changed.count !== 1) {
            return errorResponse('Oferta została w międzyczasie zmieniona. Odśwież stronę.', 409, correlationId);
        }

        try {
            await prisma.crmActivity.create({
                data: {
                    client_id: client.id,
                    client_email: client.email,
                    action: 'addon_added',
                    entity_type: 'offer',
                    entity_id: offer.id,
                    details: JSON.stringify({ ...addon, correlation_id: correlationId }),
                }
            });
        } catch (e) {
            await recordAddonAuditFailure('addon_added', correlationId, {
                id: offer.id, client_id: client.id, client_email: client.email,
            }, e);
        }

        // UWAGA: NIE wysyłamy maila przy dodawaniu addona — klient sam ustala finalną cenę
        // i może wielokrotnie zmieniać konfigurację. Mail wysyłamy dopiero przy akceptacji oferty.

        return NextResponse.json({ success: true, addon, addons: next }, {
            headers: { 'X-Correlation-ID': correlationId },
        });
    } catch (error: any) {
        console.error('Offer addon POST error:', error);
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'CLIENT_PORTAL', reasonCode: 'OFFER_ADDON_UPDATE_FAILED',
            summary: 'Nie udało się zmienić dodatku oferty', correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return errorResponse('Nie udało się zmienić dodatku.', 500, correlationId);
    }
}

export async function DELETE(request: NextRequest) {
    const correlationId = randomUUID();
    try {
        const body = await request.json();
        const { offer_id, addon_id } = body;
        if (!offer_id || !addon_id) return errorResponse('Missing params', 400, correlationId);

        const authorized = await getAuthorizedOffer(request, Number(offer_id), correlationId);
        if ('response' in authorized) return authorized.response;
        const { offer, client } = authorized;
        if (!isClientActionableOfferStatus(offer.status)) {
            return errorResponse('Dodatki można zmieniać tylko w aktywnej, wysłanej ofercie.', 409, correlationId);
        }

        const current: Addon[] = Array.isArray(offer.selected_addons) ? (offer.selected_addons as any) : [];
        const removed = current.find(a => a.id === addon_id);
        const next = current.filter(a => a.id !== addon_id);

        const changed = await prisma.offer.updateMany({
            where: {
                id: offer.id,
                client_id: client.id,
                status: { in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES },
                updated_at: offer.updated_at,
            },
            data: { selected_addons: next as any },
        });
        if (changed.count !== 1) {
            return errorResponse('Oferta została w międzyczasie zmieniona. Odśwież stronę.', 409, correlationId);
        }

        try {
            await prisma.crmActivity.create({
                data: {
                    client_id: client.id,
                    client_email: client.email,
                    action: 'addon_removed',
                    entity_type: 'offer',
                    entity_id: offer.id,
                    details: JSON.stringify({ addon_id, removed, correlation_id: correlationId }),
                }
            });
        } catch (error) {
            await recordAddonAuditFailure('addon_removed', correlationId, {
                id: offer.id, client_id: client.id, client_email: client.email,
            }, error);
        }

        return NextResponse.json({ success: true, addons: next }, {
            headers: { 'X-Correlation-ID': correlationId },
        });
    } catch (error: any) {
        console.error('Offer addon DELETE error:', error);
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'CLIENT_PORTAL', reasonCode: 'OFFER_ADDON_DELETE_FAILED',
            summary: 'Nie udało się usunąć dodatku oferty', correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return errorResponse('Nie udało się usunąć dodatku.', 500, correlationId);
    }
}

export async function GET(request: NextRequest) {
    const correlationId = randomUUID();
    const url = new URL(request.url);
    const offerId = url.searchParams.get('offer_id');
    if (!offerId) return errorResponse('Missing offer_id', 400, correlationId);
    const authorized = await getAuthorizedOffer(request, Number(offerId), correlationId);
    if ('response' in authorized) return authorized.response;
    const { offer } = authorized;
    if (!isClientVisibleOfferStatus(offer.status)) return errorResponse('Not found', 404, correlationId);
    return NextResponse.json({ success: true, addons: Array.isArray(offer.selected_addons) ? offer.selected_addons : [] }, {
        headers: { 'X-Correlation-ID': correlationId },
    });
}
