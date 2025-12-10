import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET all pages or specific page by slug or id
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    try {
        // If id param exists, fetch by id
        if (id) {
            const page = await prisma.page.findUnique({ where: { id: parseInt(id) } });
            if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
            return NextResponse.json({ success: true, page });
        }
        // If slug param exists (even if empty string), search for specific page
        else if (slug !== null) {
            const page = await prisma.page.findUnique({ where: { slug } });
            if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
            return NextResponse.json({ success: true, page });
        } else {
            // No params - return all pages
            const pages = await prisma.page.findMany();
            return NextResponse.json({ success: true, pages });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }
}

// POST (Update page content)
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const {
                slug,
                title,
                page_type,
                content,
                is_published,
                is_in_menu,
                menu_order,
                menu_title,
                hero_image,
                hero_subtitle,
                content_images,
                parallax_sections,
                content_cards,
                about_photo,
                about_text_side,
                home_sections,
                sections,
                meta_title,
                meta_description,
                meta_keywords
            } = body;

            const page = await prisma.page.upsert({
                where: { slug },
                update: {
                    title,
                    page_type: page_type || 'regular',
                    content: content || '',
                    is_published,
                    is_in_menu: is_in_menu ?? undefined,
                    menu_order: menu_order ?? undefined,
                    menu_title: menu_title ?? undefined,
                    hero_image,
                    hero_subtitle,
                    content_images,
                    parallax_sections,
                    content_cards,
                    about_photo,
                    about_text_side,
                    home_sections,
                    sections,
                    meta_title,
                    meta_description,
                    meta_keywords
                },
                create: {
                    slug,
                    title,
                    page_type: page_type || 'regular',
                    content: content || '',
                    is_published: is_published || false,
                    is_in_menu: is_in_menu || false,
                    menu_order: menu_order || 0,
                    menu_title: menu_title || title,
                    hero_image,
                    hero_subtitle,
                    content_images,
                    parallax_sections,
                    content_cards,
                    about_photo,
                    about_text_side,
                    home_sections,
                    sections,
                    meta_title,
                    meta_description,
                    meta_keywords
                },
            });

            // Menu jest teraz oparte TYLKO na pages.is_in_menu - bez synchronizacji z menu_items

            return NextResponse.json({ success: true, page });
        } catch (error) {
            console.error('Error updating page:', error);
            return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
        }
    });
}

// DELETE (Remove page)
export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req) => {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
        }

        try {
            await prisma.page.delete({
                where: { id: parseInt(id) },
            });

            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('Error deleting page:', error);
            return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
        }
    });
}
