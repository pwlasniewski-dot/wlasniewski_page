import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - Update testimonial
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { client_name, testimonial_text, rating, source, photo_size, is_featured, display_order, client_photo_path } = body;

        // Find photo ID if path provided
        let client_photo_id = null;
        if (client_photo_path) {
            const photo = await prisma.mediaLibrary.findFirst({
                where: { file_path: client_photo_path }
            });
            client_photo_id = photo?.id || null;
        }

        const testimonial = await prisma.testimonial.update({
            where: { id: parseInt(id) },
            data: {
                client_name,
                testimonial_text,
                rating: rating || null,
                source: source || null,
                photo_size: photo_size || 80,
                is_featured: is_featured || false,
                display_order: display_order || 0,
                client_photo_id
            }
        });

        return NextResponse.json({ success: true, testimonial });
    } catch (error) {
        console.error('Error updating testimonial:', error);
        return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
    }
}

// DELETE - Delete testimonial
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.testimonial.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
    }
}
