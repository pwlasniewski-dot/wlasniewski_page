import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET all slides
export async function GET(request: NextRequest) {
    try {
        const slides = await prisma.heroSlide.findMany({
            orderBy: { display_order: 'asc' },
            include: { image: true }
        });
        // Convert BigInt to Number
        const serializedSlides = slides.map(slide => ({
            ...slide,
            id: Number(slide.id),
            image_id: slide.image_id ? Number(slide.image_id) : null,
            image: slide.image ? {
                ...slide.image,
                id: Number(slide.image.id),
                file_size: Number(slide.image.file_size),
                uploaded_by: slide.image.uploaded_by ? Number(slide.image.uploaded_by) : null,
            } : null,
        }));
        return NextResponse.json({ success: true, slides: serializedSlides });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 });
    }
}

// POST (Create/Update slide)
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const { id, title, subtitle, button_text, button_link, image_id, is_active, display_mode } = body;

            let slide;
            if (id) {
                slide = await prisma.heroSlide.update({
                    where: { id },
                    data: { title, subtitle, button_text, button_link, image_id, is_active, display_mode },
                });
            } else {
                slide = await prisma.heroSlide.create({
                    data: { title, subtitle, button_text, button_link, image_id, is_active, display_mode },
                });
            }

            // Convert BigInt to Number
            const serializedSlide = {
                ...slide,
                id: Number(slide.id),
                image_id: slide.image_id ? Number(slide.image_id) : null,
            };
            return NextResponse.json({ success: true, slide: serializedSlide });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to save slide' }, { status: 500 });
        }
    });
}

// DELETE slide
export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req) => {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        try {
            await prisma.heroSlide.delete({ where: { id: Number(id) } });
            return NextResponse.json({ success: true });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to delete slide' }, { status: 500 });
        }
    });
}
