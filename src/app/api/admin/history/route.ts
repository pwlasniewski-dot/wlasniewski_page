import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';

export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const photos = await prisma.historyPhoto.findMany({
                orderBy: {
                    filename: 'asc' // Alphabetical sort
                }
            });

            return NextResponse.json({ success: true, photos });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to fetch history photos' }, { status: 500 });
        }
    });
}

export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');

            if (!id) {
                return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
            }

            await prisma.historyPhoto.delete({
                where: { id }
            });

            // Optional: Delete from S3 (Requires extracting key from URL and calling deleteFromS3 if available)
            // For now, we just delete DB record logic.

            await logSystem('INFO', 'HISTORY', `Deleted history photo ID: ${id}`);

            return NextResponse.json({ success: true, message: 'Deleted' });
        } catch (error) {
            console.error('Delete error', error);
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
        }
    });
}
