// API Route: POST /api/admin/galleries/create
// Create new gallery

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generateAccessCode } from '@/lib/gallery-utils';

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
                challenge_id
            } = body;

            if (!client_name || !client_email) {
                return NextResponse.json(
                    { success: false, error: 'Wymagane pola: client_name, client_email' },
                    { status: 400 }
                );
            }

            // Generate unique access code
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
                    standard_count: standard_count || 10,
                    price_per_premium: price_per_premium || 2000, // 20 zł default
                    expires_at: expiresAt,
                    is_active: true,
                    booking_id: booking_id ? Number(booking_id) : undefined,
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

            return NextResponse.json({
                success: true,
                gallery: {
                    id: gallery.id,
                    client_name: gallery.client_name,
                    access_code: gallery.access_code,
                },
                message: 'Galeria utworzona'
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
