import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { searchParams } = new URL(request.url);
            const mode = searchParams.get('mode');
            const folder = searchParams.get('folder');

            // Mode: Get distinct folders
            if (mode === 'folders') {
                const folders = await prisma.mediaLibrary.groupBy({
                    by: ['folder'],
                    _count: {
                        id: true
                    }
                });

                return NextResponse.json({
                    success: true,
                    folders: folders.map(f => ({ name: f.folder, count: f._count.id }))
                });
            }

            // Verify Token & Role
            const authHeader = request.headers.get('authorization');
            const token = authHeader?.split(' ')[1];
            let userId: number | undefined;
            let userRole: string | undefined;

            if (token) {
                const { jwtVerify } = await import('jose');
                const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-this');
                try {
                    const { payload } = await jwtVerify(token, secret);
                    userId = (payload as any).id;
                    userRole = (payload as any).role;
                } catch (e) { }
            }

            // Standard: Get media with optional folder filter
            const whereClause: any = {};
            if (folder) {
                whereClause.folder = folder;
            }

            // Security: Provider Isolation
            if (userRole === 'PHOTOGRAPHER' && userId) {
                whereClause.uploaded_by = userId;
            }

            const media = await prisma.mediaLibrary.findMany({
                where: whereClause,
                orderBy: { created_at: 'desc' },
            });

            // Convert BigInt to Number for JSON serialization
            const serializedMedia = media.map(item => ({
                ...item,
                id: Number(item.id),
                file_size: Number(item.file_size),
                uploaded_by: item.uploaded_by ? Number(item.uploaded_by) : null,
            }));

            return NextResponse.json({ success: true, media: serializedMedia });
        } catch (error: any) {
            return NextResponse.json(
                { error: 'Failed to fetch media' },
                { status: 500 }
            );
        }
    });
}

export async function PATCH(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();
            const { ids, updates } = body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return NextResponse.json(
                    { error: 'No IDs provided' },
                    { status: 400 }
                );
            }

            if (!updates || Object.keys(updates).length === 0) {
                return NextResponse.json(
                    { error: 'No updates provided' },
                    { status: 400 }
                );
            }

            // Allowed fields to bulk update
            const dataToUpdate: any = {};
            if (updates.folder !== undefined) dataToUpdate.folder = updates.folder;
            if (updates.alt_text !== undefined) dataToUpdate.alt_text = updates.alt_text;

            const result = await prisma.mediaLibrary.updateMany({
                where: {
                    id: { in: ids }
                },
                data: dataToUpdate
            });

            return NextResponse.json({
                success: true,
                count: result.count,
                message: `Updated ${result.count} items`
            });

        } catch (error: any) {
            console.error('Bulk update error:', error);
            return NextResponse.json(
                { error: 'Bulk update failed' },
                { status: 500 }
            );
        }
    });
}
