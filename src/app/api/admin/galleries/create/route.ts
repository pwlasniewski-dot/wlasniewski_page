// API Route: POST /api/admin/galleries/create
// Create new gallery and optionally send access email to client

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generateAccessCode } from '@/lib/gallery-utils';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';
import { galleryTermsFromAcceptedOffer } from '@/lib/galleries/offerTerms';

export async function POST(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const body = await request.json();
            const {
                client_name,
                client_email,
                standard_count,
                price_per_premium,
                expires_at,
                booking_id,
                offer_id,
                challenge_id,
                send_email: requestedSendEmail = false,
                // Tryb grupowy
                gallery_mode = 'INDIVIDUAL',
                group_access_code: rawGroupCode,
                group_password,
                max_photos_for_print,
                external_download_url,
            } = body;
            // A gallery is created as a draft. Sending access before photos and HQ files exist
            // caused clients to receive empty or incomplete galleries.
            const shouldSendEmail = false;

            if (!client_name || !client_email) {
                return NextResponse.json(
                    { success: false, error: 'Wymagane pola: client_name, client_email' },
                    { status: 400 }
                );
            }
            const mode = gallery_mode === 'GROUP' ? 'GROUP' : 'INDIVIDUAL';
            let includedCount = standard_count === undefined ? 10 : Number(standard_count);
            let extraPhotoPrice = price_per_premium === undefined ? 2000 : Number(price_per_premium);
            let sourceOffer: any = null;
            let packageSnapshot: Record<string, unknown> | null = null;
            if (offer_id !== undefined && offer_id !== null && offer_id !== '') {
                if (mode !== 'INDIVIDUAL') {
                    return NextResponse.json({ success: false, error: 'Powiązanie z pojedynczą ofertą dotyczy galerii indywidualnej.' }, { status: 400 });
                }
                sourceOffer = await prisma.offer.findUnique({
                    where: { id: Number(offer_id) },
                    include: { contract: { select: { id: true } }, gallery: { select: { id: true } } },
                });
                if (!sourceOffer || sourceOffer.status !== 'accepted') {
                    return NextResponse.json({ success: false, error: 'Wybierz istniejącą, zaakceptowaną ofertę.' }, { status: 409 });
                }
                if (sourceOffer.gallery) {
                    return NextResponse.json({ success: false, error: `Ta oferta jest już połączona z galerią #${sourceOffer.gallery.id}.` }, { status: 409 });
                }
                const normalizedEmail = String(client_email).trim().toLowerCase();
                if (sourceOffer.client_email && sourceOffer.client_email.trim().toLowerCase() !== normalizedEmail) {
                    return NextResponse.json({ success: false, error: 'Oferta należy do innego klienta.' }, { status: 409 });
                }
                try {
                    const terms = galleryTermsFromAcceptedOffer(sourceOffer);
                    if (terms.includedPhotoCount === null || terms.extraPhotoPriceGrosz === null) {
                        return NextResponse.json({
                            success: false,
                            error: 'Oferta nie określa jednoznacznie liczby zdjęć w pakiecie i ceny dodatkowego zdjęcia. Uzupełnij i ponownie wyślij ofertę — galeria powiązana z ofertą nie używa wartości domyślnych.',
                        }, { status: 409 });
                    }
                    includedCount = terms.includedPhotoCount;
                    extraPhotoPrice = terms.extraPhotoPriceGrosz;
                    packageSnapshot = {
                        ...terms.snapshot,
                        includedPhotoCount: includedCount,
                        extraPhotoPriceGrosz: extraPhotoPrice,
                        includedPhotoCountSource: 'OFFER',
                        extraPhotoPriceSource: 'OFFER',
                    };
                } catch (error) {
                    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Nie można odczytać warunków pakietu.' }, { status: 409 });
                }
            }
            if (!Number.isInteger(includedCount) || includedCount < 0 || includedCount > 1000) {
                return NextResponse.json({ success: false, error: 'Limit zdjęć musi być liczbą 0–1000.' }, { status: 400 });
            }
            if (!Number.isInteger(extraPhotoPrice) || extraPhotoPrice < 0 || extraPhotoPrice > 10_000_000) {
                return NextResponse.json({ success: false, error: 'Cena dodatkowego zdjęcia jest nieprawidłowa.' }, { status: 400 });
            }

            let externalDownloadUrl: string | null = null;
            if (external_download_url) {
                try {
                    const parsedUrl = new URL(String(external_download_url).trim());
                    if (parsedUrl.protocol !== 'https:') throw new Error('invalid protocol');
                    externalDownloadUrl = parsedUrl.toString();
                } catch {
                    return NextResponse.json(
                        { success: false, error: 'Link do galerii musi być poprawnym adresem HTTPS' },
                        { status: 400 }
                    );
                }
            }
            let group_access_code: string | null = null;
            if (mode === 'GROUP') {
                const normalized = String(rawGroupCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (!normalized || normalized.length < 4) {
                    return NextResponse.json(
                        { success: false, error: 'Dla trybu GROUP wymagany jest kod grupowy (min. 4 znaki, A-Z/0-9)' },
                        { status: 400 }
                    );
                }
                const existing = await prisma.clientGallery.findUnique({ where: { group_access_code: normalized } });
                if (existing) {
                    return NextResponse.json(
                        { success: false, error: `Kod grupowy "${normalized}" jest już zajęty` },
                        { status: 409 }
                    );
                }
                group_access_code = normalized;
            }

            // Generate unique access code (zawsze - rodzice indywidualni / fallback admina)
            const access_code = generateAccessCode();

            // Calculate expiration date (default: +30 days)
            const expiresAt = expires_at
                ? new Date(expires_at)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            // Create gallery
            const gallery = await prisma.clientGallery.create({
                data: {
                    client_name,
                    client_email,
                    access_code,
                    standard_count: includedCount,
                    price_per_premium: extraPhotoPrice,
                    expires_at: expiresAt,
                    is_active: false,
                    booking_id: booking_id ? Number(booking_id) : undefined,
                    offer_id: sourceOffer?.id,
                    contract_id: sourceOffer?.contract?.id,
                    package_snapshot: packageSnapshot ? packageSnapshot as any : undefined,
                    terms_source: sourceOffer ? 'ACCEPTED_OFFER' : 'MANUAL',
                    terms_locked_at: sourceOffer ? new Date() : null,
                    gallery_mode: mode,
                    group_access_code,
                    group_password: group_password ? String(group_password).trim() || null : null,
                    max_photos_for_print: max_photos_for_print ? Number(max_photos_for_print) : null,
                    external_download_url: externalDownloadUrl,
                }
            });

            // If challenge_id provided, update challenge with note
            if (challenge_id) {
                await prisma.photoChallenge.update({
                    where: { id: Number(challenge_id) },
                    data: {
                        admin_notes: `Galeria utworzona: #${gallery.id}`
                    }
                });
            }

            // Send access email to client
            if (shouldSendEmail) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
                const galleryUrl = mode === 'GROUP'
                    ? `${appUrl}/galeria/grupowa`
                    : `${appUrl}/galeria/${access_code}`;
                const displayCode = mode === 'GROUP' ? group_access_code! : access_code;
                const codeLabel = mode === 'GROUP' ? 'Kod grupowy (rozdaj rodzicom)' : 'Kod dostępu';
                const introText = mode === 'GROUP'
                    ? `Twoja galeria grupowa jest gotowa! Rozdaj poniższy kod uczestnikom (np. rodzicom). Każdy z nich wchodzi na <strong>${galleryUrl}</strong>, wpisuje ten sam kod i wybiera unikalny awatar, aby przeglądać oraz wybrać swoje zdjęcia.`
                    : 'Twoja galeria zdjęć jest gotowa! Możesz teraz przeglądać swoje zdjęcia i wybrać te, które chcesz zachować.';
                const familyShareInfo = mode === 'INDIVIDUAL' && group_password
                    ? `<p style="color:#ccc;font-size:14px;line-height:1.6;margin:16px 0 0;">Hasło do udostępnienia rodzinie: <strong style="color:#fff;">${String(group_password)}</strong></p>`
                    : '';
                const expiresFormatted = expiresAt.toLocaleDateString('pl-PL', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                try {
                    await sendEmail({
                        to: client_email,
                        subject: '📸 Twoja galeria zdjęć jest gotowa! — Przemysław Właśniewski',
                        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c5a059;margin-bottom:30px;">
      <h1 style="color:#c5a059;font-size:28px;margin:0;letter-spacing:2px;">PRZEMYSŁAW WŁAŚNIEWSKI</h1>
      <p style="color:#888;font-size:12px;margin:5px 0 0;letter-spacing:4px;text-transform:uppercase;">Fotografia</p>
    </div>
    
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:40px;margin-bottom:24px;">
      <h2 style="color:#fff;font-size:24px;margin:0 0 16px;">Cześć, ${client_name}! 👋</h2>
      <p style="color:#ccc;font-size:16px;line-height:1.6;margin:0 0 24px;">
        ${introText}
      </p>
            ${familyShareInfo}
      
      <div style="background:#1a1a1a;border:1px solid #c5a059;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
        <p style="color:#888;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">${codeLabel}</p>
        <p style="color:#c5a059;font-size:32px;font-weight:bold;margin:0;font-family:monospace;letter-spacing:4px;">${displayCode}</p>
      </div>
      
      <div style="text-align:center;margin:32px 0;">
        <a href="${galleryUrl}" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;font-size:16px;letter-spacing:1px;">
          🖼️ ${mode === 'GROUP' ? 'Otwórz Galerię Grupową' : 'Otwórz Galerię'}
        </a>
      </div>
      
      <div style="border-top:1px solid #222;padding-top:20px;margin-top:20px;">
        <p style="color:#666;font-size:13px;margin:0;">
          ⏰ Galeria dostępna do: <strong style="color:#fff;">${expiresFormatted}</strong><br>
          🔗 Link bezpośredni: <a href="${galleryUrl}" style="color:#c5a059;">${galleryUrl}</a>
        </p>
      </div>
    </div>
    
    <p style="color:#555;font-size:12px;text-align:center;margin:0;">
      © ${new Date().getFullYear()} Przemysław Właśniewski · Fotografia<br>
      <a href="https://wlasniewski.pl" style="color:#c5a059;">wlasniewski.pl</a>
    </p>
  </div>
</body>
</html>`
                    });
                    console.log(`[Gallery] Access email sent to ${client_email}`);
                } catch (emailError) {
                    console.error('[Gallery] Failed to send access email:', emailError);
                    // Don't fail the request if email fails
                }

                // Notify admin
                try {
                    const adminEmail = await getAdminEmail();
                    if (adminEmail) {
                        await sendEmail({
                            to: adminEmail,
                            subject: `📸 Nowa galeria utworzona — ${client_name}`,
                            html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;">
  <h2 style="color:#c5a059;">Nowa galeria zdjęć</h2>
  <p>Galeria #${gallery.id} została utworzona dla klienta <strong>${client_name}</strong> (${client_email}).</p>
  <p>Kod dostępu: <code style="background:#222;padding:4px 8px;border-radius:4px;color:#c5a059;">${access_code}</code></p>
  <p>Wygasa: ${expiresFormatted}</p>
  <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl'}/admin/galleries" style="color:#c5a059;">Zarządzaj galeriami →</a></p>
</div>`
                        });
                    }
                } catch (adminEmailError) {
                    console.error('[Gallery] Failed to send admin notification:', adminEmailError);
                }
            }

            return NextResponse.json({
                success: true,
                gallery: {
                    id: gallery.id,
                    client_name: gallery.client_name,
                    access_code: gallery.access_code,
                    gallery_mode: gallery.gallery_mode,
                    group_access_code: gallery.group_access_code,
                },
                message: requestedSendEmail
                    ? 'Galeria utworzona jako szkic. Wgraj zdjęcia, sprawdź JPG HQ, aktywuj i dopiero wtedy wyślij dostęp.'
                    : 'Galeria utworzona jako szkic'
            });
        } catch (error) {
            console.error('Error creating gallery:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się utworzyć galerii' },
                { status: 500 }
            );
        }
    });
}
