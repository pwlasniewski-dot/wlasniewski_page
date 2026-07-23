// API Route: GET/POST /api/admin/galleries/[id]
// Admin endpoints for managing a specific gallery

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

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

            const {
                standard_count, price_per_premium, expires_at, is_active, description,
                gallery_mode, group_access_code, group_password, max_photos_for_print,
                allow_extra_photo_purchase, external_download_url,
            } = body;

            const updateData: any = {};
            if (standard_count !== undefined) updateData.standard_count = standard_count;
            if (price_per_premium !== undefined) updateData.price_per_premium = price_per_premium;
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
                updateData.max_photos_for_print = max_photos_for_print === null || max_photos_for_print === ''
                    ? null
                    : Number(max_photos_for_print);
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
