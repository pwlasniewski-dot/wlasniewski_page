// API Route: GET/POST /api/admin/galleries/[id]
// Admin endpoints for managing a specific gallery

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { youtubeVideoId } from '@/lib/video/youtube';

// GET - Fetch gallery details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const galleryId = Number(id);

            const gallery = await prisma.clientGallery.findUnique({
                where: { id: galleryId },
                include: {
                    photos: {
                        orderBy: { order_index: 'asc' }
                    },
                    orders: {
                        orderBy: { created_at: 'desc' }
                    }
                },
            });

            if (!gallery) {
                return NextResponse.json(
                    { success: false, error: 'Galeria nie znaleziona' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                gallery,
            });
        } catch (error) {
            console.error('Error fetching gallery:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się pobrać galerii' },
                { status: 500 }
            );
        }
    });
}

// PUT - Update gallery settings
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const galleryId = Number(id);
            const body = await request.json();
            const currentGallery = await prisma.clientGallery.findUnique({
                where: { id: galleryId },
                select: {
                    id: true,
                    standard_count: true,
                    price_per_premium: true,
                    terms_source: true,
                    gallery_mode: true,
                    max_photos_for_print: true,
                },
            });
            if (!currentGallery) {
                return NextResponse.json({ success: false, error: 'Galeria nie znaleziona' }, { status: 404 });
            }

            const {
                standard_count, price_per_premium, expires_at, is_active, description,
                gallery_mode, group_access_code, group_password, max_photos_for_print,
                allow_extra_photo_purchase, external_download_url,
                event_video_url, event_video_title, event_video_description, event_video_enabled,
            } = body;

            const updateData: any = {};
            if (currentGallery.terms_source === 'ACCEPTED_OFFER') {
                const changesIncluded = standard_count !== undefined && Number(standard_count) !== currentGallery.standard_count;
                const changesExtraPrice = price_per_premium !== undefined && Number(price_per_premium) !== currentGallery.price_per_premium;
                if (changesIncluded || changesExtraPrice) {
                    return NextResponse.json({
                        success: false,
                        error: 'Liczba zdjęć i cena dodatku są zablokowane snapshotem zaakceptowanej oferty. Utwórz nową wersję oferty zamiast zmieniać warunki po akceptacji.',
                    }, { status: 409 });
                }
            }
            if (standard_count !== undefined) {
                const value = Number(standard_count);
                if (!Number.isInteger(value) || value < 0 || value > 1000) {
                    return NextResponse.json({ success: false, error: 'Limit zdjęć musi być liczbą 0–1000.' }, { status: 400 });
                }
                updateData.standard_count = value;
            }
            if (price_per_premium !== undefined) {
                const value = Number(price_per_premium);
                if (!Number.isInteger(value) || value < 0 || value > 10_000_000) {
                    return NextResponse.json({ success: false, error: 'Cena dodatkowego zdjęcia jest nieprawidłowa.' }, { status: 400 });
                }
                updateData.price_per_premium = value;
            }
            if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at) : null;
            if (is_active !== undefined) updateData.is_active = is_active;
            if (description !== undefined) updateData.description = description;

            // GROUP mode settings
            if (gallery_mode !== undefined) {
                const mode = gallery_mode === 'GROUP' ? 'GROUP' : 'INDIVIDUAL';
                updateData.gallery_mode = mode;
                if (mode === 'INDIVIDUAL') {
                    // Clear group fields when switching back
                    updateData.group_access_code = null;
                    updateData.group_password = null;
                }
            }
            if (allow_extra_photo_purchase !== undefined) {
                updateData.allow_extra_photo_purchase = !!allow_extra_photo_purchase;
            }
            if (group_access_code !== undefined) {
                const normalized = group_access_code
                    ? String(group_access_code).toUpperCase().replace(/[^A-Z0-9]/g, '')
                    : null;
                if (normalized && normalized.length < 4) {
                    return NextResponse.json(
                        { success: false, error: 'Kod grupowy musi mieć min. 4 znaki (A-Z/0-9)' },
                        { status: 400 }
                    );
                }
                if (normalized) {
                    const conflict = await prisma.clientGallery.findFirst({
                        where: { group_access_code: normalized, id: { not: galleryId } },
                        select: { id: true }
                    });
                    if (conflict) {
                        return NextResponse.json(
                            { success: false, error: `Kod grupowy "${normalized}" jest już zajęty` },
                            { status: 409 }
                        );
                    }
                }
                updateData.group_access_code = normalized;
            }
            if (group_password !== undefined) {
                updateData.group_password = group_password ? String(group_password).trim() || null : null;
            }
            if (max_photos_for_print !== undefined) {
                const limit = max_photos_for_print === null || max_photos_for_print === ''
                    ? null
                    : Number(max_photos_for_print);
                if (limit !== null && (!Number.isInteger(limit) || limit < 1 || limit > 1000)) {
                    return NextResponse.json({ success: false, error: 'Limit uczestnika musi być liczbą 1–1000.' }, { status: 400 });
                }
                updateData.max_photos_for_print = limit;
            }
            if (external_download_url !== undefined) {
                const rawUrl = String(external_download_url || '').trim();
                if (!rawUrl) {
                    updateData.external_download_url = null;
                } else {
                    try {
                        const parsedUrl = new URL(rawUrl);
                        if (parsedUrl.protocol !== 'https:') throw new Error('invalid protocol');
                        updateData.external_download_url = parsedUrl.toString();
                    } catch {
                        return NextResponse.json(
                            { success: false, error: 'Link do galerii musi być poprawnym adresem HTTPS' },
                            { status: 400 }
                        );
                    }
                }
            }
            if (event_video_url !== undefined) {
                const rawUrl = String(event_video_url || '').trim();
                if (!rawUrl) {
                    updateData.event_video_url = null;
                    updateData.event_video_enabled = false;
                } else {
                    try {
                        const parsedUrl = new URL(rawUrl);
                        if (parsedUrl.protocol !== 'https:' || !youtubeVideoId(parsedUrl.toString())) {
                            throw new Error('unsupported provider');
                        }
                        updateData.event_video_url = parsedUrl.toString();
                    } catch {
                        return NextResponse.json(
                            { success: false, error: 'Film musi być poprawnym linkiem HTTPS z YouTube.' },
                            { status: 400 }
                        );
                    }
                }
            }
            if (event_video_title !== undefined) updateData.event_video_title = String(event_video_title || '').trim() || null;
            if (event_video_description !== undefined) updateData.event_video_description = String(event_video_description || '').trim() || null;
            if (event_video_enabled !== undefined && updateData.event_video_url !== null) {
                updateData.event_video_enabled = !!event_video_enabled;
            }

            if (is_active === true) {
                const photos = await prisma.galleryPhoto.findMany({
                    where: { gallery_id: galleryId },
                    select: { id: true, is_standard: true, download_source_url: true },
                });
                if (photos.length === 0) {
                    return NextResponse.json({ success: false, error: 'Nie można aktywować pustej galerii.' }, { status: 409 });
                }
                const missingHq = photos.filter(photo => !photo.download_source_url).length;
                if (missingHq > 0) {
                    return NextResponse.json({
                        success: false,
                        error: `Nie można aktywować galerii: ${missingHq} zdjęć nie ma przygotowanego JPG HQ.`,
                    }, { status: 409 });
                }
                const resolvedMode = gallery_mode === 'GROUP' || gallery_mode === 'INDIVIDUAL'
                    ? gallery_mode
                    : currentGallery.gallery_mode;
                const resolvedStandardCount = standard_count !== undefined
                    ? Number(standard_count)
                    : currentGallery.standard_count;
                if (resolvedMode !== 'GROUP') {
                    const included = photos.filter(photo => photo.is_standard).length;
                    if (included !== resolvedStandardCount) {
                        return NextResponse.json({
                            success: false,
                            error: `Zdjęcia w pakiecie: ${included}, a limit w ustawieniach: ${resolvedStandardCount}. Ujednolić przed aktywacją.`,
                        }, { status: 409 });
                    }
                }
            }

            const gallery = await prisma.clientGallery.update({
                where: { id: galleryId },
                data: updateData,
                include: {
                    photos: {
                        orderBy: { order_index: 'asc' }
                    },
                    orders: {
                        orderBy: { created_at: 'desc' }
                    }
                }
            });

            if (max_photos_for_print !== undefined && updateData.max_photos_for_print !== null) {
                await prisma.galleryParticipant.updateMany({
                    where: { gallery_id: galleryId },
                    data: { max_selections: updateData.max_photos_for_print },
                });
            }

            return NextResponse.json({
                success: true,
                gallery,
            });
        } catch (error) {
            console.error('Error updating gallery:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się zaktualizować galerii' },
                { status: 500 }
            );
        }
    });
}
