/**
 * API: Klient dodaje/usuwa album jako dodatek do oferty.
 * Zapisuje w Offer.selected_addons (JSON) + email do fotografa.
 *
 * POST { offer_id, album_id, custom_pages?, custom_format_request?, message? }
 * DELETE { offer_id, addon_id }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { logSystem } from '@/lib/logger';

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

function calcFinal(basePrice: number, basePages: number | null, customPages: number | null, pricePerSpread: number): number {
    if (!basePages || !customPages || customPages === basePages) return basePrice;
    const diff = customPages - basePages;
    return Math.max(0, basePrice + diff * pricePerSpread);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { offer_id, album_id, custom_pages, custom_format_request, message } = body;

        if (!offer_id || !album_id) {
            return NextResponse.json({ error: 'Missing offer_id or album_id' }, { status: 400 });
        }

        const album = await prisma.nphotoAlbum.findUnique({ where: { id: Number(album_id) } });
        const offer = await prisma.offer.findUnique({
            where: { id: Number(offer_id) },
            include: { user: true }
        });

        if (!album || !offer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Bezpieczenstwo: na zatwierdzonych ofertach NIE wolno juz nic zmieniac
        if (offer.status === 'accepted' || offer.status === 'signed' || offer.status === 'completed') {
            return NextResponse.json({ error: 'Oferta jest juz zatwierdzona - skontaktuj sie z fotografem aby dodac album.' }, { status: 403 });
        }

        const pricePerSpread = album.price_per_spread || 40;
        const finalPrice = calcFinal(
            album.price || 0,
            album.pages_count || null,
            custom_pages != null ? Number(custom_pages) : null,
            pricePerSpread
        );

        const addon: Addon = {
            id: `${album.id}-${Date.now()}`,
            album_id: album.id,
            album_title: album.title,
            base_price: album.price || 0,
            base_pages: album.pages_count || null,
            base_format: album.format || null,
            custom_pages: custom_pages != null ? Number(custom_pages) : null,
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

        await prisma.offer.update({
            where: { id: offer.id },
            data: { selected_addons: next as any }
        });

        try {
            await prisma.crmActivity.create({
                data: {
                    client_id: offer.client_id || null,
                    client_email: offer.client_email || offer.user?.email || null,
                    action: 'addon_added',
                    entity_type: 'offer',
                    entity_id: offer.id,
                    details: JSON.stringify(addon),
                }
            });
        } catch (e) {
            await logSystem('WARN', 'SYSTEM', 'CrmActivity addon_added failed', { error: String(e) });
        }

        try {
            await sendEmail({
                to: 'pwlasniewski@gmail.com',
                subject: `🟢 KLIENT DODAŁ ALBUM DO OFERTY: ${album.title} (+${finalPrice} PLN) — #${offer.offerNumber || offer.id}`,
                html: `
                    <h2>Klient dodał album do oferty</h2>
                    <p><strong>Klient:</strong> ${offer.user?.email || offer.client_email}</p>
                    <p><strong>Oferta:</strong> #${offer.offerNumber || offer.id} — ${offer.title}</p>
                    <hr>
                    <p><strong>Album:</strong> ${album.title}</p>
                    <p><strong>Format bazowy:</strong> ${album.format || '—'}</p>
                    <p><strong>Rozkładówki bazowo:</strong> ${album.pages_count || '—'}</p>
                    ${addon.custom_pages ? `<p><strong>Wybrane rozkładówki:</strong> ${addon.custom_pages} (cena za rozkł.: ${pricePerSpread} PLN)</p>` : ''}
                    ${addon.custom_format_request ? `<p><strong>PROŚBA O INNY FORMAT:</strong> ${addon.custom_format_request}</p>` : ''}
                    <p><strong>Cena finalna:</strong> ${finalPrice} ${album.currency || 'PLN'}</p>
                    ${album.cover_image_url ? `<p><img src="${album.cover_image_url}" style="max-width:280px;border-radius:8px"/></p>` : ''}
                    ${message ? `<hr><p><strong>Wiadomość od klienta:</strong><br>${message}</p>` : ''}
                    <hr>
                    <p style="color:#888"><strong>AKCJA:</strong> Otwórz ofertę w panelu admin → zatwierdź/zaktualizuj cenę i odpowiedz klientowi.</p>
                `,
            });
        } catch (e) {
            await logSystem('WARN', 'EMAIL', 'Addon notification failed', { error: String(e) });
        }

        return NextResponse.json({ success: true, addon, addons: next });
    } catch (error: any) {
        console.error('Offer addon POST error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { offer_id, addon_id } = body;
        if (!offer_id || !addon_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

        const offer = await prisma.offer.findUnique({ where: { id: Number(offer_id) }, include: { user: true } });
        if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (offer.status === 'accepted' || offer.status === 'signed' || offer.status === 'completed') {
            return NextResponse.json({ error: 'Oferta jest juz zatwierdzona - nie mozna usunac dodatku.' }, { status: 403 });
        }

        const current: Addon[] = Array.isArray(offer.selected_addons) ? (offer.selected_addons as any) : [];
        const removed = current.find(a => a.id === addon_id);
        const next = current.filter(a => a.id !== addon_id);

        await prisma.offer.update({ where: { id: offer.id }, data: { selected_addons: next as any } });

        try {
            await prisma.crmActivity.create({
                data: {
                    client_id: offer.client_id || null,
                    client_email: offer.client_email || offer.user?.email || null,
                    action: 'addon_removed',
                    entity_type: 'offer',
                    entity_id: offer.id,
                    details: JSON.stringify({ addon_id, removed }),
                }
            });
        } catch {}

        return NextResponse.json({ success: true, addons: next });
    } catch (error: any) {
        console.error('Offer addon DELETE error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const offerId = url.searchParams.get('offer_id');
    if (!offerId) return NextResponse.json({ error: 'Missing offer_id' }, { status: 400 });
    const offer = await prisma.offer.findUnique({ where: { id: Number(offerId) }, select: { selected_addons: true } });
    if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, addons: Array.isArray(offer.selected_addons) ? offer.selected_addons : [] });
}
