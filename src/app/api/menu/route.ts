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
