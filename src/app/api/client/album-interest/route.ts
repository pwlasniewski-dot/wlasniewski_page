/**
 * API: Klient zglasza zainteresowanie albumem z poziomu panelu klienta.
 * Zapisuje w CrmActivity + wysyla maila do fotografa - klient zostaje w panelu.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { logSystem } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { offer_id, album_id, client_name, client_email, message } = body;

        if (!offer_id || !album_id) {
            return NextResponse.json({ error: 'Missing offer_id or album_id' }, { status: 400 });
        }

        const album = await prisma.nphotoAlbum.findUnique({ where: { id: Number(album_id) } });
        const offer = await prisma.offer.findUnique({
            where: { id: Number(offer_id) },
            include: { user: true }
        });

        if (!album || !offer) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Log activity (best-effort)
        try {
            await prisma.crmActivity.create({
                data: {
                    client_id: offer.client_id || null,
                    client_email: offer.client_email || offer.user?.email || client_email || null,
                    action: 'album_interest',
                    entity_type: 'offer',
                    entity_id: offer.id,
                    details: JSON.stringify({ album_id: album.id, album_title: album.title, album_price: album.price, message: message || null }),
                }
            });
        } catch (e) {
            await logSystem('WARN', 'SYSTEM', 'CrmActivity album_interest failed', { error: String(e) });
        }

        // Notify photographer
        try {
            await sendEmail({
                to: 'pwlasniewski@gmail.com',
                subject: `📸 Klient chce album: ${album.title} — oferta #${offer.offerNumber || offer.id}`,
                html: `
                    <h2>Nowe zainteresowanie albumem</h2>
                    <p><strong>Klient:</strong> ${client_name || offer.user?.email || offer.client_email}</p>
                    <p><strong>Email:</strong> ${client_email || offer.user?.email || offer.client_email}</p>
                    <p><strong>Oferta:</strong> #${offer.offerNumber || offer.id} — ${offer.title}</p>
                    <hr>
                    <p><strong>Album:</strong> ${album.title}</p>
                    <p><strong>Cena:</strong> ${album.price} ${album.currency}</p>
                    ${album.cover_image_url ? `<p><img src="${album.cover_image_url}" style="max-width:300px;border-radius:8px"/></p>` : ''}
                    ${message ? `<hr><p><strong>Wiadomosc od klienta:</strong><br>${message}</p>` : ''}
                    <hr>
                    <p style="color:#888">Akcja: oddzwon do klienta i potwierdz zamowienie albumu w pakiecie sesji.</p>
                `,
            });
        } catch (e) {
            await logSystem('WARN', 'EMAIL', 'Album interest notification failed', { error: String(e) });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Album interest POST error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
