import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';

// UPROSZCZONE MENU - tylko z tabeli pages (is_in_menu = true)
export async function GET() {
    try {
        // 1. Try to fetch from custom menu_items table first
        const menuItems = await prisma.menuItem.findMany({
            where: {
                parent_id: null, // Top-level items
                is_active: true
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

            return NextResponse.json(menuItems.map(mapItem));
        }

        // 2. FALLBACK: If menu_items is empty, fetch pages (Old Logic)
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
