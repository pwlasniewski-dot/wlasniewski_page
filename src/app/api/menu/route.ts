import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// UPROSZCZONE MENU - tylko z tabeli pages (is_in_menu = true)
export async function GET() {
    try {
        const menuPages = await prisma.page.findMany({
            where: {
                is_in_menu: true,
                is_published: true,
            },
            orderBy: {
                menu_order: "asc",
            },
            select: {
                id: true,
                title: true,
                slug: true,
                menu_title: true,
                menu_order: true,
                page_type: true,
            },
        });

        // Formatuj do prostej struktury menu
        const menu = menuPages.map(page => ({
            id: page.id,
            title: page.menu_title || page.title,
            slug: page.slug,
            url: page.slug === 'strona-glowna' ? '/' : `/${page.slug}`,
            order: page.menu_order || 0,
        }));

        // If pages-based menu is empty, fallback to legacy `menu_items` table
        if (menu.length === 0) {
            try {
                const legacy = await prisma.menuItem.findMany({
                    where: { is_active: true },
                    orderBy: { order: 'asc' },
                    include: { children: true, page: true }
                });

                // Build hierarchy: top-level items (parent_id == null)
                const top = legacy.filter(item => item.parent_id === null || item.parent_id === undefined);

                const mapped = top.map(item => {
                    const children = legacy
                        .filter(c => c.parent_id === item.id)
                        .map(c => ({
                            id: c.id,
                            title: c.title,
                            url: c.url || (c.page ? (c.page.slug === 'strona-glowna' ? '/' : `/${c.page.slug}`) : '#'),
                            order: c.order || 0,
                        }));

                    return {
                        id: item.id,
                        title: item.title,
                        url: item.url || (item.page ? (item.page.slug === 'strona-glowna' ? '/' : `/${item.page.slug}`) : '#'),
                        order: item.order || 0,
                        children
                    };
                });

                return NextResponse.json(mapped);
            } catch (e) {
                console.error('Error fetching legacy menu_items fallback:', e);
                return NextResponse.json([]);
            }
        }

        return NextResponse.json(menu);
    } catch (error) {
        console.error("Error fetching menu:", error);
        return NextResponse.json([]);
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { items } = body; // Expecting array of { id, menu_order, is_in_menu, menu_title }

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
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
