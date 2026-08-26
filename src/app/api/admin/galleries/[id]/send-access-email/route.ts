// API Route: POST /api/admin/galleries/[id]/send-access-email
// Send gallery access email manually for an existing gallery

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';
import { generateGalleryEmail } from '@/lib/email-templates';
import {
    OWNER_EMAIL,
    buildLoginUrl,
    buildPasswordSetupUrl,
    normalizeEmail,
} from '@/lib/crm/delivery';
import { ensurePasswordSetupToken } from '@/lib/auth/password-setup-token';
import { randomUUID } from 'node:crypto';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        const correlationId = randomUUID();
        let incidentGalleryId: number | null = null;
        let incidentClientId: number | null = null;
        let incidentClientEmail: string | null = null;
        let phase = 'load_gallery';
        try {
            const { id } = await params;
            const galleryId = Number(id);
            incidentGalleryId = Number.isInteger(galleryId) ? galleryId : null;

            const gallery = await prisma.clientGallery.findUnique({
                where: { id: galleryId },
                select: {
                    id: true,
                    client_name: true,
                    client_email: true,
                    access_code: true,
                    gallery_mode: true,
                    group_access_code: true,
                    group_password: true,
                    expires_at: true,
                    is_active: true,
                    standard_count: true,
                    client_id: true,
                    photos: { select: { id: true, is_standard: true, download_source_url: true } },
                },
            });

            if (!gallery) {
                return NextResponse.json(
                    { success: false, error: 'Galeria nie znaleziona' },
                    { status: 404 }
                );
            }
            incidentClientId = gallery.client_id;
            incidentClientEmail = normalizeEmail(gallery.client_email);

            if (!gallery.client_email) {
                return NextResponse.json(
                    { success: false, error: 'Brak emaila klienta w galerii' },
                    { status: 400 }
                );
            }
            if (!gallery.is_active) {
                return NextResponse.json({ success: false, error: 'Najpierw zakończ checklistę i aktywuj galerię.' }, { status: 409 });
            }
            if (gallery.expires_at && new Date(gallery.expires_at) <= new Date()) {
                return NextResponse.json({ success: false, error: 'Nie można wysłać dostępu do wygasłej galerii.' }, { status: 409 });
            }
            if (gallery.photos.length === 0 || gallery.photos.some(photo => !photo.download_source_url)) {
                return NextResponse.json({ success: false, error: 'Galeria nie jest gotowa: brakuje zdjęć lub plików JPG HQ.' }, { status: 409 });
            }
            if (gallery.gallery_mode !== 'GROUP') {
                const included = gallery.photos.filter(photo => photo.is_standard).length;
                if (included !== gallery.standard_count) {
                    return NextResponse.json({
                        success: false,
                        error: `Nie można wysłać: w pakiecie jest ${included} zdjęć, a ustawiony limit to ${gallery.standard_count}.`,
                    }, { status: 409 });
                }
            }

            const isGroupMode = gallery.gallery_mode === 'GROUP';
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
            const galleryUrl = isGroupMode
                ? `${appUrl}/galeria/grupowa`
                : `${appUrl}/galeria/${gallery.access_code}`;

            const displayCode = isGroupMode
                ? (gallery.group_access_code || gallery.access_code)
                : gallery.access_code;
            if (!displayCode) {
                return NextResponse.json({ success: false, error: 'Galeria nie ma kodu dostępu.' }, { status: 409 });
            }

            const expiresAt = gallery.expires_at
                ? new Date(gallery.expires_at)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const expiresFormatted = expiresAt.toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });

            let recipient = normalizeEmail(gallery.client_email);
            if (!recipient) {
                return NextResponse.json({ success: false, error: 'Brak poprawnego emaila odbiorcy.' }, { status: 400 });
            }
            let primaryUrl = galleryUrl;
            let primaryCtaLabel = 'Otwórz galerię →';

            if (!isGroupMode) {
                if (!gallery.client_id) {
                    return NextResponse.json({ success: false, error: 'Galeria indywidualna wymaga przypisanego konta klienta.' }, { status: 409 });
                }
                const client = await prisma.user.findUnique({
                    where: { id: gallery.client_id },
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        is_active: true,
                        deleted_at: true,
                        last_login: true,
                        password_reset_required: true,
                        reset_token: true,
                        reset_token_expires: true,
                    },
                });
                if (!client || client.role !== 'CLIENT' || !client.is_active || client.deleted_at) {
                    return NextResponse.json({ success: false, error: 'Przypisane konto klienta jest nieaktywne lub nieprawidłowe.' }, { status: 409 });
                }
                const accountEmail = normalizeEmail(client.email);
                if (accountEmail !== recipient) {
                    return NextResponse.json({ success: false, error: 'Email galerii nie zgadza się z przypisanym kontem klienta.' }, { status: 409 });
                }
                recipient = accountEmail;

                const returnTo = '/konto';
                if (!client.last_login || client.password_reset_required) {
                    const token = await ensurePasswordSetupToken(client);
                    primaryUrl = buildPasswordSetupUrl(token, returnTo);
                    primaryCtaLabel = 'Ustaw hasło i otwórz galerie →';
                } else {
                    primaryUrl = buildLoginUrl(returnTo);
                    primaryCtaLabel = 'Zaloguj się i otwórz galerie →';
                }
            }

            phase = 'send_email';
            const delivery = await sendEmail({
                to: recipient,
                bcc: OWNER_EMAIL,
                subject: '📸 Twoja galeria zdjęć jest gotowa! — Przemysław Właśniewski',
                html: generateGalleryEmail({
                    clientName: gallery.client_name,
                    accessCode: displayCode,
                    galleryUrl,
                    primaryUrl,
                    primaryCtaLabel,
                    groupPassword: isGroupMode ? gallery.group_password || undefined : undefined,
                    expiresAt: expiresFormatted,
                    standardCount: isGroupMode ? undefined : gallery.standard_count,
                }),
            });

            phase = 'persist_delivery';
            await prisma.crmActivity.create({
                data: {
                    client_id: gallery.client_id,
                    client_email: recipient,
                    action: 'gallery_access_sent',
                    entity_type: 'gallery',
                    entity_id: gallery.id,
                    details: JSON.stringify({ recipient, messageId: delivery.messageId, mode: gallery.gallery_mode }),
                },
            });

            return NextResponse.json({
                success: true,
                message: `Email z dostępem wysłany do ${recipient}`,
            });
        } catch (error) {
            console.error('Error sending gallery access email:', error);
            await recordAdminIncidentSafely({
                severity: 'P1',
                category: 'COMMUNICATION',
                reasonCode: 'GALLERY_ACCESS_EMAIL_DELIVERY_FAILED',
                summary: 'Nie udało się wysłać dostępu do galerii',
                clientId: incidentClientId,
                clientEmail: incidentClientEmail,
                entityType: 'gallery',
                entityId: incidentGalleryId,
                correlationId,
                details: { phase, error: error instanceof Error ? error.message : String(error) },
            });
            return NextResponse.json(
                { success: false, error: 'Nie udało się wysłać maila z dostępem' },
                { status: 500 }
            );
        }
    });
}
