import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';
import { generateOfferPDF } from '@/lib/services/pdf';
import { uploadToS3 } from '@/lib/storage/s3';
import { logClientActivity } from '@/lib/crm-activity';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Extract and verify token
        const token = extractToken(request.headers.get('authorization')) ||
            request.cookies.get('client_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const offerId = parseInt(id);

        // Fetch offer and verify ownership
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                sections: {
                    include: {
                        items: true,
                    },
                },
                negotiations: true,
                contract: true,
            },
        });

        if (!offer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }

        // Verify client owns this offer
        if (
            offer.client_id !== decoded.id &&
            offer.client_email !== decoded.email
        ) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // CRM Activity: offer viewed
        logClientActivity(decoded, 'offer_viewed', {
            entityType: 'offer',
            entityId: offerId,
            details: { title: offer.title, status: offer.status },
            request,
        });

        return NextResponse.json({ offer });
    } catch (error) {
        console.error('Error fetching offer:', error);
        return NextResponse.json(
            { error: 'Failed to fetch offer' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Extract and verify token
        const token = extractToken(request.headers.get('authorization')) ||
            request.cookies.get('client_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const offerId = parseInt(id);
        const body = await request.json();
        const { action, message, new_status } = body;

        // Fetch offer and verify ownership
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
        });

        if (!offer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }

        // Verify client owns this offer
        if (
            offer.client_id !== decoded.id &&
            offer.client_email !== decoded.email
        ) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // CRM Activity: track action
        logClientActivity(decoded, 
            action === 'accept' ? 'offer_accepted' : 
            action === 'reject' ? 'offer_rejected' : 
            action === 'negotiate' ? 'offer_negotiate' : 
            'offer_selection_changed', {
            entityType: 'offer',
            entityId: offerId,
            details: { action, status: offer.status, message: message?.substring(0, 200) },
            request,
        });

        // Handle different actions
        if (action === 'accept') {
            const parsedTotalPrice = parseInt(body.client_selection?.totalPrice) || 0;

            await (prisma.offer.update as any)({
                where: { id: offerId },
                data: {
                    status: 'accepted',
                    client_selection: body.client_selection ?? undefined,
                    total_price: parsedTotalPrice
                },
            });

            // Generate and upload accepted offer PDF to S3
            try {
                const updatedOffer = await prisma.offer.findUnique({
                    where: { id: offerId },
                    include: {
                        sections: {
                            include: { items: true }
                        }
                    }
                });

                if (updatedOffer) {
                    console.log(`[CLIENT_ACCEPT] Generating acceptance PDF for offer ${offerId}...`);
                    
                    // Generate post-acceptance PDF with client selection
                    const pdfBuffer = await generateOfferPDF(updatedOffer, true);
                    console.log(`[CLIENT_ACCEPT] PDF generated, size: ${pdfBuffer.length} bytes`);

                    const fileNameAccepted = `oferta_${updatedOffer.offerNumber || offerId}_zatwierdzona.pdf`;
                    const s3KeyAccepted = `offers/${fileNameAccepted}`;

                    console.log(`[CLIENT_ACCEPT] Uploading to S3: ${s3KeyAccepted}...`);
                    const s3Url = await uploadToS3(pdfBuffer, s3KeyAccepted, 'application/pdf');
                    console.log(`[CLIENT_ACCEPT] Successfully uploaded acceptance PDF to S3: ${s3Url}`);

                    // Update offer with the S3 URL
                    await prisma.offer.update({
                        where: { id: offerId },
                        data: { 
                            pdf_url: s3Url
                        }
                    });
                    console.log(`[CLIENT_ACCEPT] Updated offer with S3 URL`);
                }
            } catch (pdfError) {
                console.error(`[CLIENT_ACCEPT] Failed to generate/upload acceptance PDF:`, pdfError);
                // Don't fail the whole request if PDF generation fails
            }

            // Notify admin
            try {
                const adminEmail = await getAdminEmail();
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
                const selectionInfo = body.client_selection?.selectedPackage
                    ? `Wybrany pakiet: <strong>${body.client_selection.selectedPackage.name}</strong> — ${body.client_selection.selectedPackage.price}`
                    : body.client_selection?.childCount
                        ? `Liczba dzieci: <strong>${body.client_selection.childCount}</strong>`
                        : '';
                if (adminEmail) {
                    await sendEmail({
                        to: adminEmail,
                        subject: `✅ Oferta zaakceptowana — ${offer.title}`,
                        html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <h2 style="color:#4ade80;">✅ Klient zaakceptował ofertę!</h2>
  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin:16px 0;">
    <p style="color:#888;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Oferta</p>
    <p style="color:#c5a059;font-size:18px;font-weight:bold;margin:0;">${offer.title}</p>
    <p style="color:#555;font-size:12px;margin:6px 0 0;">Klient: ${decoded.email}</p>
  </div>
  ${selectionInfo ? `<p style="color:#ccc;font-size:14px;">${selectionInfo}</p>` : ''}
  <p style="color:#ccc;font-size:14px;">Łączna wartość: <strong style="color:#c5a059;">${body.client_selection?.totalPrice ? body.client_selection.totalPrice.toLocaleString('pl-PL') + ' PLN' : 'N/A'}</strong></p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/admin/clients" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Przejdź do panelu →</a>
  </div>
</div>`
                    });
                }
            } catch (emailError) {
                console.error('[Offer Accept] Failed to send admin notification:', emailError);
            }
        } else if (action === 'reject') {
            await prisma.offer.update({
                where: { id: offerId },
                data: { status: 'rejected' },
            });

            // Notify admin
            try {
                const adminEmail = await getAdminEmail();
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
                if (adminEmail) {
                    await sendEmail({
                        to: adminEmail,
                        subject: `❌ Oferta odrzucona — ${offer.title}`,
                        html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <h2 style="color:#f87171;">❌ Klient odrzucił ofertę</h2>
  <p style="color:#ccc;">Oferta <strong>${offer.title}</strong> została odrzucona przez klienta ${decoded.email}.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/admin/clients" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Przejdź do panelu →</a>
  </div>
</div>`
                    });
                }
            } catch (emailError) {
                console.error('[Offer Reject] Failed to send admin notification:', emailError);
            }
        } else if (action === 'negotiate' && message) {
            await prisma.negotiation.create({
                data: {
                    offer_id: offerId,
                    message,
                    status: 'open',
                    sender: 'client',
                },
            });

            // Notify admin about negotiation
            try {
                const adminEmail = await getAdminEmail();
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
                if (adminEmail) {
                    await sendEmail({
                        to: adminEmail,
                        subject: `💬 Nowa negocjacja — ${offer.title}`,
                        html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <h2 style="color:#f59e0b;">💬 Klient chce negocjować ofertę</h2>
  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin:16px 0;">
    <p style="color:#888;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Oferta</p>
    <p style="color:#c5a059;font-size:18px;font-weight:bold;margin:0;">${offer.title}</p>
    <p style="color:#555;font-size:12px;margin:6px 0 0;">Klient: ${decoded.email}</p>
  </div>
  <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Wiadomość klienta:</p>
    <p style="color:#ccc;font-size:14px;margin:0;white-space:pre-wrap;line-height:1.6;">${message}</p>
  </div>
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/admin/offers/${offer.id}" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Odpowiedz w panelu →</a>
  </div>
</div>`
                    });
                }
            } catch (emailError) {
                console.error('[Offer Negotiate] Failed to send admin notification:', emailError);
            }
        } else if (action === 'request_unlock') {
            await prisma.offer.update({
                where: { id: offerId },
                data: { status: 'unlock_requested' },
            });

            // Notify admin about the unlock request
            try {
                const adminEmail = await getAdminEmail();
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
                if (adminEmail) {
                    await sendEmail({
                        to: adminEmail,
                        subject: `🔓 Prośba o odblokowanie oferty — ${offer.title}`,
                        html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <h2 style="color:#fbbf24;">🔓 Klient prosi o odblokowanie oferty</h2>
  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin:16px 0;">
    <p style="color:#888;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Oferta</p>
    <p style="color:#c5a059;font-size:18px;font-weight:bold;margin:0;">${offer.title}</p>
    <p style="color:#555;font-size:12px;margin:6px 0 0;">Klient: ${decoded.email}</p>
  </div>
  <p style="color:#ccc;font-size:14px;">Klient zaznaczył, że pomylił się przy wyborze i prosi o ponowne odblokowanie możliwości edycji/wyboru pakietu.</p>
  <p style="color:#ccc;font-size:14px;">Aby odblokować ofertę, przejdź do jej edycji w panelu i użyj przycisku <strong>"Wyślij ponownie"</strong>.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/admin/offers/${offer.id}" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Edytuj ofertę →</a>
  </div>
</div>`
                    });
                }
            } catch (emailError) {
                console.error('[Offer Unlock Request] Failed to send admin notification:', emailError);
            }
        }

        // Fetch updated offer
        const updated = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                sections: {
                    include: {
                        items: true,
                    },
                },
                negotiations: true,
                contract: true,
            },
        });

        return NextResponse.json({ offer: updated });
    } catch (error) {
        console.error('Error updating offer:', error);
        return NextResponse.json(
            { error: 'Failed to update offer' },
            { status: 500 }
        );
    }
}
