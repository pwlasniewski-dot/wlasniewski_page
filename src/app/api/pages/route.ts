import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { revalidatePath } from 'next/cache';

// GET all pages or specific page by slug or id
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    try {
        // Simple token check to allow admins to see all/draft pages
        const authHeader = request.headers.get('Authorization');
        const isAdmin = authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 20;

        // If id param exists, fetch by id
        if (id) {
            const page = await prisma.page.findUnique({ where: { id: parseInt(id) } });
            if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
            // Hide unpublished pages from public (return 404 instead of 401 to prevent side-channel)
            if (!isAdmin && !page.is_published) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
            return NextResponse.json({ success: true, page });
        }
        // If slug param exists (even if empty string), search for specific page
        else if (slug !== null) {
            const page = await prisma.page.findUnique({ where: { slug } });
            if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
            // Hide unpublished pages from public
            if (!isAdmin && !page.is_published) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
            return NextResponse.json({ success: true, page });
        } else {
            // No params - return all pages
            const where = isAdmin ? {} : { is_published: true };
            const pages = await prisma.page.findMany({ where });
            return NextResponse.json({ success: true, pages });
        }
    } catch (error) {
        console.error('Failed to fetch pages:', error);
        return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }
}

// POST (Update or Create page)
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const {
                id,
                slug,
                title,
                page_type,
                content,
                is_published,
                is_in_menu,
                menu_order,
                menu_title,
                parent_page_id,
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

            let page;

            if (id) {
                // UPDATE existing page
                page = await prisma.page.update({
                    where: { id: parseInt(id) },
                    data: {
                        title,
                        page_type: page_type || 'regular',
                        content: content || '',
                        is_published,
                        is_in_menu: is_in_menu ?? undefined,
                        menu_order: menu_order ?? undefined,
                        menu_title: menu_title ?? undefined,
                        parent_page_id: parent_page_id ?? undefined,
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
                    }
                });
            } else {
                // CREATE NEW page - check slug uniqueness first!
                const existing = await prisma.page.findUnique({ where: { slug } });
                if (existing) {
                    return NextResponse.json({
                        error: 'Strona z tym adresem (slug) już istnieje. Użyj innego adresu lub edytuj istniejącą stronę.'
                    }, { status: 400 });
                }

                page = await prisma.page.create({
                    data: {
                        slug,
                        title,
                        page_type: page_type || 'regular',
                        content: content || '',
                        is_published: is_published || false,
                        is_in_menu: is_in_menu || false,
                        menu_order: menu_order || 0,
                        menu_title: menu_title || title,
                        parent_page_id: parent_page_id || null,
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
            }

            // ISR revalidation
            try {
                revalidatePath(`/${page.slug}`);
                if (page.slug === 'strona-glowna') revalidatePath('/');
                if (page.slug === 'portfolio') revalidatePath('/portfolio');
                if (page.slug === 'dron') revalidatePath('/dron');
                revalidatePath('/', 'layout');
            } catch (revError) {
                console.warn('Revalidation failed:', revError);
            }

            return NextResponse.json({ success: true, page });
        } catch (error) {
            console.error('Error in POST /api/pages:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
