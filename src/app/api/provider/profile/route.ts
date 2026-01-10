import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-this');

        let payload;
        try {
            const result = await jwtVerify(token, secret);
            payload = result.payload as { id: number; role: string };
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (payload.role !== 'PHOTOGRAPHER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            include: {
                photographer_profile: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            profile: user.photographer_profile,
            user_base: {
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-this');

        let payload;
        try {
            const result = await jwtVerify(token, secret);
            payload = result.payload as { id: number; role: string };
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (payload.role !== 'PHOTOGRAPHER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { bio, avatar_url, highlight_photos, specialties, phone } = body;

        // Update User info (Phone)
        if (phone !== undefined) {
            await prisma.user.update({
                where: { id: payload.id },
                data: { phone }
            });
        }

        // Upsert Profile
        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { photographer_profile_id: true }
        });

        let profile;
        if (user?.photographer_profile_id) {
            profile = await prisma.photographerProfile.update({
                where: { id: user.photographer_profile_id },
                data: {
                    bio,
                    avatar_url,
                    highlight_photos: typeof highlight_photos === 'object' ? JSON.stringify(highlight_photos) : highlight_photos,
                    specialties: typeof specialties === 'object' ? JSON.stringify(specialties) : specialties,
                }
            });
        } else {
            // Create new profile
            profile = await prisma.photographerProfile.create({
                data: {
                    bio,
                    avatar_url,
                    highlight_photos: JSON.stringify(highlight_photos || []),
                    specialties: JSON.stringify(specialties || []),
                    base_commission: 15, // Default
                    rating: 5.0, // Default
                    user: {
                        connect: { id: payload.id }
                    }
                }
            });
            // Connect back to user (One-to-One relation is tricky if not handled by 'user')
            // Actually 'user' has 'photographer_profile_id' @unique.
            // So if we create profile, we must link it.
            // 'user' relation in PhotographerProfile is usually the back-reference allowed?
            // Schema: user User?
            // User schema: photographer_profile PhotographerProfile? @relation(fields: [...])
            // If I create via 'user' relation it should work.
        }

        return NextResponse.json({ success: true, profile });

    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
