import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    try {
        const media = await prisma.mediaLibrary.findMany({
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
}
