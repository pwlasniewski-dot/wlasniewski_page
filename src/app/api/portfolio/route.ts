import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET all sessions with cover images
export async function GET(request: NextRequest) {
    console.log('📥 GET /api/portfolio started');
    try {
        console.log('🔍 Fetching sessions from Prisma...');
        const sessions = await prisma.portfolioSession.findMany({
            include: {
                cover_image: {
                    select: { file_path: true }
                }
            },
            orderBy: { session_date: 'desc' },
        });
        console.log(`✅ Found ${sessions.length} sessions`);

        // Convert BigInt to Number and add cover_image_url
        const serializedSessions = sessions.map(s => {
            try {
                return {
                    ...s,
                    id: Number(s.id),
                    cover_image_id: s.cover_image_id ? Number(s.cover_image_id) : null,
                    cover_image_url: s.cover_image?.file_path || null,
                };
            } catch (err) {
                console.error('❌ Serialization error for session:', s.id, err);
                throw err;
            }
        });
        console.log('✅ Serialization complete');

        return NextResponse.json({ success: true, sessions: serializedSessions });
    } catch (error) {
        console.error('💥 GET sessions error details:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions', details: String(error) }, { status: 500 });
    }
}

// CREATE new session
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();

            if (!body.title || !body.slug) {
                return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
            }

            // Ensure media_ids is a JSON string
            const mediaIds = typeof body.media_ids === 'string'
                ? body.media_ids
                : JSON.stringify(body.media_ids || []);

            const session = await prisma.portfolioSession.create({
                data: {
                    title: body.title,
                    slug: body.slug,
                    category: body.category || 'wedding',
                    description: body.description || '',
                    cover_image_id: body.cover_image_id || null,
                    media_ids: mediaIds,
                    session_date: body.session_date ? new Date(body.session_date) : new Date(),
                    is_published: body.is_published || false,
                    meta_title: body.meta_title || body.title,
                    meta_description: body.meta_description || body.description || '',
                },
            });

            const serializedSession = {
                id: session.id,
                title: session.title,
                slug: session.slug,
                category: session.category,
                description: session.description,
                location: session.location,
                session_date: session.session_date?.toISOString() || null,
                cover_image_id: session.cover_image_id,
                media_ids: session.media_ids,
                meta_title: session.meta_title,
                meta_description: session.meta_description,
                is_published: session.is_published,
                display_order: session.display_order,
                created_at: session.created_at.toISOString(),
                updated_at: session.updated_at.toISOString(),
            };

            return NextResponse.json({ success: true, session: serializedSession });
        } catch (error: any) {
            console.error('Create session error:', error);
            return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
        }
    });
}

// UPDATE session
export async function PUT(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');

            if (!id) {
                return NextResponse.json({ error: 'ID is required' }, { status: 400 });
            }

            const body = await request.json();

            // Ensure media_ids is a JSON string
            const mediaIds = typeof body.media_ids === 'string'
                ? body.media_ids
                : JSON.stringify(body.media_ids || []);

            const session = await prisma.portfolioSession.update({
                where: { id: parseInt(id) },
                data: {
                    title: body.title,
                    slug: body.slug,
                    category: body.category,
                    description: body.description,
                    cover_image_id: body.cover_image_id || null,
                    media_ids: mediaIds,
                    session_date: body.session_date ? new Date(body.session_date) : new Date(),
                    is_published: body.is_published,
                    meta_title: body.meta_title || body.title,
                    meta_description: body.meta_description || body.description || '',
                },
            });

            const serializedSession = {
                id: session.id,
                title: session.title,
                slug: session.slug,
                category: session.category,
                description: session.description,
                location: session.location,
                session_date: session.session_date?.toISOString() || null,
                cover_image_id: session.cover_image_id,
                media_ids: session.media_ids,
                meta_title: session.meta_title,
                meta_description: session.meta_description,
                is_published: session.is_published,
                display_order: session.display_order,
                created_at: session.created_at.toISOString(),
                updated_at: session.updated_at.toISOString(),
            };

            return NextResponse.json({ success: true, session: serializedSession });
        } catch (error: any) {
            console.error('Update session error:', error);
            return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
        }
    });
}

// DELETE session
export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');

            if (!id) {
                return NextResponse.json({ error: 'ID is required' }, { status: 400 });
            }

            await prisma.portfolioSession.delete({
                where: { id: parseInt(id) }
            });

            return NextResponse.json({ success: true });
        } catch (error: any) {
            console.error('Delete session error:', error);
            return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
        }
    });
}
