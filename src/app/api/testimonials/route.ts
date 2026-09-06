import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { loadPublicReviews } from '@/lib/public-reviews.server';
import { revalidatePublicOffer } from '@/lib/revalidate-public-offer';

export async function GET() {
    try {
        const testimonials = await loadPublicReviews();
        return NextResponse.json(testimonials, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error("Error fetching testimonials:", error);
        return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { client_name, testimonial_text, client_photo_id, rating, source, photo_size, is_featured, show_on_booking_page, display_order } = body;

        const testimonial = await prisma.testimonial.create({
            data: {
                client_name,
                testimonial_text,
                client_photo_id: client_photo_id ? Number(client_photo_id) : null,
                rating: rating ? Number(rating) : 5,
                source,
                photo_size: photo_size ? Number(photo_size) : 80,
                is_featured: is_featured || false,
                show_on_booking_page: show_on_booking_page || false,
                display_order: display_order ? Number(display_order) : 0,
            },
        });

        revalidatePublicOffer();
        return NextResponse.json(testimonial);
    } catch (error) {
        console.error("Error creating testimonial:", error);
        return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { id, client_name, testimonial_text, client_photo_id, rating, source, photo_size, is_featured, show_on_booking_page, display_order } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const testimonial = await prisma.testimonial.update({
            where: { id: Number(id) },
            data: {
                client_name,
                testimonial_text,
                client_photo_id: client_photo_id ? Number(client_photo_id) : null,
                rating: rating ? Number(rating) : 5,
                source,
                photo_size: photo_size ? Number(photo_size) : 80,
                is_featured: is_featured,
                show_on_booking_page: show_on_booking_page,
                display_order: display_order ? Number(display_order) : 0,
            },
        });

        revalidatePublicOffer();
        return NextResponse.json(testimonial);
    } catch (error) {
        console.error("Error updating testimonial:", error);
        return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.testimonial.delete({
            where: { id: Number(id) },
        });

        revalidatePublicOffer();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting testimonial:", error);
        return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
    }
}
