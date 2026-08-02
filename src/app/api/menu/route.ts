import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { requireAdminAuth } from '@/lib/auth/middleware';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const menuUpdateSchema = z.object({
    items: z.array(z.object({
        id: z.number().int().positive(),
        menu_order: z.number().int().min(0).max(1000),
        is_in_menu: z.boolean(),
        menu_title: z.string().trim().min(1).max(80),
    })).max(100),
});

// UPROSZCZONE MENU - tylko z tabeli pages (is_in_menu = true)
// UPROSZCZONE MENU - tylko z tabeli pages (is_in_menu = true)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "b2c"; // Default to b2c
        const guidePage = type === 'b2c' ? await prisma.page.findUnique({
            where: { slug: 'jak-sie-ubrac' },
            select: { id: true, page_type: true, is_published: true, is_in_menu: true, menu_title: true, menu_order: true },
        }) : null;
        const shouldShowGuide = type === 'b2c' && (
            !guidePage || guidePage.page_type !== 'public-guide' || (guidePage.is_published && guidePage.is_in_menu)
        );
        const withPublicGuide = (items: any[]) => {
            const withoutGuide = items.filter(item => item.url !== '/jak-sie-ubrac');
            if (!shouldShowGuide) return withoutGuide;
            return [...withoutGuide, {
                id: guidePage?.id || -101,
                title: guidePage?.menu_title || 'Jak się ubrać',
                url: '/jak-sie-ubrac',
                order: guidePage?.menu_order || 65,
                children: [],
            }].sort((a, b) => (a.order || 0) - (b.order || 0));
        };

        // 1. Try to fetch from custom menu_items table first
        const menuItems = await prisma.menuItem.findMany({
            where: {
                parent_id: null, // Top-level items
                is_active: true,
                menu_type: type // Filter by type!
            },
            orderBy: {
                order: "asc"
            },
            include: {
                page: {
                    select: { slug: true, title: true }
                },
                children: {
                    where: { is_active: true },
                    orderBy: { order: "asc" },
                    include: {
                        page: {
                            select: { slug: true, title: true }
                        },
                        children: { // Support 3 levels of nesting
                            where: { is_active: true },
                            orderBy: { order: "asc" },
                            include: {
                                page: { select: { slug: true, title: true } }
                            }
                        }
                    }
                }
            }
        });

        if (menuItems.length > 0) {
            // Map to frontend structure
            const mapItem = (item: any) => ({
                id: item.id,
                title: item.title,
                url: item.page ? (item.page.slug === 'strona-glowna' ? '/' : `/${item.page.slug}`) : item.url,
                order: item.order,
                children: item.children ? item.children.map(mapItem) : []
            });

            return NextResponse.json(withPublicGuide(menuItems.map(mapItem)));
        }

        // 2. FALLBACK: If menu_items is empty AND type is b2c, fetch pages (Old Logic)
        if (type === 'b2c') {
            const menuPages = await prisma.page.findMany({
                where: {
                    is_in_menu: true,
                    is_published: true,
                    parent_page_id: null,
                },
                orderBy: {
                    menu_order: "asc",
                },
                include: {
                    children: {
                        where: { is_published: true },
                        orderBy: { menu_order: "asc" }
                    }
                }
            });

            const menu = menuPages.map(page => ({
                id: page.id,
                title: page.menu_title || page.title,
                slug: page.slug,
                url: page.slug === 'strona-glowna' ? '/' : `/${page.slug}`,
                order: page.menu_order || 0,
                children: page.children.map(child => ({
                    id: child.id,
                    title: child.menu_title || child.title,
                    slug: child.slug,
                    url: child.slug === 'strona-glowna' ? '/' : `/${child.slug}`,
                    order: child.menu_order || 0,
                }))
            }));

            return NextResponse.json(withPublicGuide(menu));
        }

        return NextResponse.json([]);
    } catch (error) {
        console.error("Error fetching menu:", error);
        return NextResponse.json([]);
    }
}

export async function PUT(request: NextRequest) {
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    try {
        const parsed = menuUpdateSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }
        const { items } = parsed.data;
        if (new Set(items.map(item => item.id)).size !== items.length) {
            return NextResponse.json({ error: "Duplicate menu item IDs" }, { status: 400 });
        }

        // Transaction to update all items
        await prisma.$transaction(
            items.map((item) =>
                prisma.page.update({
                    where: { id: item.id },
                    data: {
                        menu_order: item.menu_order,
                        is_in_menu: item.is_in_menu,
                        menu_title: item.menu_title,
                    },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating menu:", error);
        return NextResponse.json({ error: "Failed to update menu" }, { status: 500 });
    }
}
