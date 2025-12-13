import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req) => {
        try {
            // Awaiting params to satisfy Next.js 15 requirement
            const resolvedParams = await params;
            const id = parseInt(resolvedParams.id);
            if (isNaN(id)) {
                return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
            }

            const body = await request.json();
            const { folder, alt_text, file_name } = body;

            // Prepare update data
            const updateData: any = {};
            if (typeof folder !== 'undefined') updateData.folder = folder;
            if (typeof alt_text !== 'undefined') updateData.alt_text = alt_text;
            if (typeof file_name !== 'undefined') updateData.file_name = file_name;

            const updatedMedia = await prisma.mediaLibrary.update({
                where: { id },
                data: updateData
            });

            // Serialize BigInt
            const serializedMedia = {
                ...updatedMedia,
                id: Number(updatedMedia.id),
                file_size: Number(updatedMedia.file_size),
                uploaded_by: updatedMedia.uploaded_by ? Number(updatedMedia.uploaded_by) : null,
            };

            return NextResponse.json({ success: true, media: serializedMedia });
        } catch (error: any) {
            console.error('Update media error:', error);
            return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
        }
    });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req) => {
        try {
            const resolvedParams = await params;
            const id = parseInt(resolvedParams.id);
            if (isNaN(id)) {
                return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
            }

            // Check if media exists
            const media = await prisma.mediaLibrary.findUnique({ where: { id } });
            if (!media) {
                return NextResponse.json({ error: 'Media not found' }, { status: 404 });
            }

            // Delete from Database
            await prisma.mediaLibrary.delete({ where: { id } });

            return NextResponse.json({ success: true });
        } catch (error: any) {
            console.error('Delete media error:', error);
            return NextResponse.json({ error: 'Failed to delete media', details: String(error) }, { status: 500 });
        }
    });
}
