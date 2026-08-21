import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { preserveFirstPublication, publicationRegistryIdentity } from '@/lib/analytics/pagePublicationRegistry';
import { requireAuth, withAuth } from '@/lib/auth/middleware';
import { revalidatePath } from 'next/cache';
import { validateDronePhotographyConfig } from '@/lib/dronePhotographyOffer';
import { validateAeroPageSections } from '@/lib/aeroanaliza/page-validation';

async function preservePagePublicationBestEffort(page: {
    slug: string;
    page_type: string | null;
    is_published: boolean;
}) {
    if (!page.is_published) return;
    try {
        await preserveFirstPublication(prisma, publicationRegistryIdentity('page', page));
    } catch (error) {
        // Rejestr analityczny jest pomocniczy. Brak jego migracji lub chwilowa
        // awaria nie może cofnąć zapisu treści wykonanej przez administratora.
        console.warn('[API/Pages] Page saved, but publication registry update failed:', error);
    }
}

// GET all pages or specific page by slug or id
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    try {
        // Drafts are visible only after cryptographic token verification.
        const authHeader = request.headers.get('authorization');
        const isAdmin = authHeader?.startsWith('Bearer ')
            ? (await requireAuth(request)) === null
            : false;

        // If id param exists, fetch by id
        if (id) {
            const page = await prisma.page.findUnique({ where: { id: parseInt(id) } });
            if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
            // Hide unpublished pages from public (return 404 instead of 401 to prevent side-channel)
            if (!isAdmin && !page.is_published) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
            return NextResponse.json({ success: true, page });
        }
        // If slug param exists (even if empty string), search for specific page (case-insensitive)
        else if (slug !== null) {
            const page = await prisma.page.findFirst({
                where: {
                    slug: { equals: slug, mode: 'insensitive' }
                }
            });
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
            const { id, title, page_type, content, is_published, is_in_menu, menu_order, menu_title, parent_page_id, hero_image, hero_subtitle, content_images, parallax_sections, content_cards, about_photo, about_text_side, home_sections, sections, meta_title, meta_description, meta_keywords } = body;
            let slug = body.slug;

            // Normalize slug to lowercase
            if (slug) slug = slug.toLowerCase().trim();

            if (slug === 'fotografia-z-drona') {
                const validation = validateDronePhotographyConfig(sections);
                if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
            }

            if (page_type === 'b2b' && is_published !== false) {
                const validation = validateAeroPageSections(sections);
                if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
            }

            let page;

            if (id) {
                // UPDATE existing page
                page = await prisma.$transaction(async tx => {
                  return tx.page.update({
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
                });
            } else {
                // CREATE NEW page - check slug uniqueness first (case-insensitive)!
                const existing = await prisma.page.findFirst({
                    where: {
                        slug: { equals: slug, mode: 'insensitive' }
                    }
                });
                if (existing) {
                    return NextResponse.json({
                        error: 'Strona z tym adresem (slug) już istnieje. Użyj innego adresu lub edytuj istniejącą stronę.'
                    }, { status: 400 });
                }

                console.log('[API/Pages] Creating page with data:', { slug, title, page_type });

                try {
                    page = await prisma.$transaction(async tx => {
                      return tx.page.create({
                        data: {
                            slug,
                            title,
                            page_type: page_type || 'regular',
                            content: content || '',
                            is_published: is_published || false,
                            is_in_menu: is_in_menu || false,
                            menu_order: menu_order || 0,
                            menu_title: menu_title || title,
                            parent_page_id: parent_page_id || null, // Ensure this is acceptable by Prisma
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
                    });
                } catch (createError) {
                    console.error('[API/Pages] Create failed:', createError);
                    throw createError;
                }
            }

            await preservePagePublicationBestEffort(page);

            // ISR revalidation
            try {
                revalidatePath(`/${page.slug}`);
                if (page.slug === 'strona-glowna') revalidatePath('/');
                if (page.slug === 'portfolio') revalidatePath('/portfolio');
                if (page.slug === 'dron') revalidatePath('/dron');
                if (page.slug === 'fotografia-z-drona') {
                    revalidatePath('/fotografia-z-drona');
                    revalidatePath('/rezerwacja/dron');
                }
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
