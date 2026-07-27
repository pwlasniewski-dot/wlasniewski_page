/**
 * API: Klient zglasza zainteresowanie albumem z poziomu panelu klienta.
 * Zapisuje w CrmActivity + wysyla maila do fotografa - klient zostaje w panelu.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { logSystem } from '@/lib/logger';
import { extractToken, verifyToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

const escapeHtml = (value: unknown) => String(value ?? '').replace(
    /[&<>'"]/g,
    character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]!)
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { offer_id, album_id, message, intent } = body;
        const isAddToOffer = intent === 'add_to_offer';

        if (!offer_id || !album_id) {
            return NextResponse.json({ error: 'Missing offer_id or album_id' }, { status: 400 });
        }
        if (typeof message === 'string' && message.length > 2000) {
            return NextResponse.json({ error: 'Message too long' }, { status: 400 });
        }

        const token = extractToken(request.headers.get('authorization'))
            || request.cookies.get('client_token')?.value
            || request.cookies.get('user_token')?.value;
        const decoded = token ? await verifyToken(token) : null;
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const album = await prisma.nphotoAlbum.findUnique({ where: { id: Number(album_id) } });
        const offer = await prisma.offer.findUnique({
            where: { id: Number(offer_id) },
            include: { user: true }
        });

        if (!album || !offer) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        if (offer.client_id !== decoded.id && offer.client_email !== decoded.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const offerEmail = offer.user?.email || offer.client_email || decoded.email;
        const safeAlbumTitle = escapeHtml(album.title);
        const safeOfferTitle = escapeHtml(offer.title);
        const safeEmail = escapeHtml(offerEmail);
        const safeMessage = escapeHtml(message);

        // Log activity (best-effort)
        try {
            await prisma.crmActivity.create({
                data: {
                    client_id: offer.client_id || null,
                    client_email: offer.client_email || offer.user?.email || decoded.email,
                    action: isAddToOffer ? 'album_add_to_offer' : 'album_interest',
                    entity_type: 'offer',
                    entity_id: offer.id,
                    details: JSON.stringify({ album_id: album.id, album_title: album.title, album_price: album.price, message: message || null, intent: intent || 'interest' }),
                }
            });
        } catch (e) {
            await logSystem('WARN', 'SYSTEM', 'CrmActivity album_interest failed', { error: String(e) });
        }

        // Notify photographer only when a deployment-specific recipient is configured.
        const notificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_FROM;
        try {
            if (!notificationEmail) {
                await logSystem('WARN', 'EMAIL', 'Album interest email skipped: notification recipient is not configured');
                return NextResponse.json({ success: true });
            }
            await sendEmail({
                to: notificationEmail,
                subject: isAddToOffer
                    ? `KLIENT DODAŁ ALBUM DO OFERTY: ${album.title} (+${album.price} ${album.currency}) — #${offer.offerNumber || offer.id}`
                    : `Klient chce album: ${album.title} — oferta #${offer.offerNumber || offer.id}`,
                html: `
                    <h2>${isAddToOffer ? 'Klient zatwierdził dodanie albumu do oferty' : 'Nowe zainteresowanie albumem'}</h2>
                    <p><strong>Klient:</strong> ${safeEmail}</p>
                    <p><strong>Email:</strong> ${safeEmail}</p>
                    <p><strong>Oferta:</strong> #${offer.offerNumber || offer.id} — ${safeOfferTitle}</p>
                    <hr>
                    <p><strong>Album:</strong> ${safeAlbumTitle}</p>
                    <p><strong>Cena:</strong> ${album.price} ${album.currency}</p>
                    ${message ? `<hr><p><strong>Wiadomość od klienta:</strong><br>${safeMessage}</p>` : ''}
                    <hr>
                    <p style="color:#888">${isAddToOffer ? '<strong>AKCJA:</strong> Zaktualizuj ofertę o cenę albumu i potwierdź klientowi.' : 'Akcja: oddzwon do klienta i potwierdz zamowienie albumu w pakiecie sesji.'}</p>
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
