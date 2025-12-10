import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch menu tree
export async function GET() {
    try {
        const menuItems = await prisma.menuItem.findMany({
            orderBy: { order: "asc" },
            include: {
                page: {
                    select: {
                        slug: true,
                        title: true,
                    }
                },
                children: {
                    orderBy: { order: "asc" },
                    include: {
                        page: {
                            select: {
                                slug: true,
                                title: true,
                            }
                        }
                    }
                }
            },
            where: {
                parent_id: null // Only fetch top-level items, children are included via relation
            }
        });

        if (menuItems.length === 0) {
            // Fallback: build menu from pages where is_in_menu = true
            const pages = await prisma.page.findMany({
                where: { is_in_menu: true },
                orderBy: { menu_order: 'asc' },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    menu_title: true,
                    menu_order: true,
                    is_published: true
                }
            });

            const fallback = pages.map(p => ({
                id: p.id,
                title: p.menu_title || p.title,
                url: p.slug === 'strona-glowna' ? '/' : `/${p.slug}`,
                page_id: p.id,
                parent_id: null,
                order: p.menu_order || 0,
                is_active: p.is_published,
                page: { slug: p.slug, title: p.title },
                children: [],
                // mark source so frontend can detect this is pages-based fallback
                __source: 'pages'
            }));

            return NextResponse.json(fallback);
        }

        return NextResponse.json(menuItems);
    } catch (error) {
        console.error("Error fetching menu:", error);
        return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
    }
}

// POST: Create menu item
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, url, page_id, parent_id, order } = body;

        const menuItem = await prisma.menuItem.create({
            data: {
                title,
                url,
                page_id: page_id ? Number(page_id) : null,
                parent_id: parent_id ? Number(parent_id) : null,
                order: order ? Number(order) : 0,
            },
        });

        return NextResponse.json(menuItem);
    } catch (error) {
        console.error("Error creating menu item:", error);
        return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
    }
}

// PUT: Update menu item (move, rename, reorder)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, title, url, page_id, parent_id, order, is_active } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const menuItem = await prisma.menuItem.update({
            where: { id: Number(id) },
            data: {
                title,
                url,
                page_id: page_id ? Number(page_id) : null,
                parent_id: parent_id !== undefined ? (parent_id ? Number(parent_id) : null) : undefined,
                order: order !== undefined ? Number(order) : undefined,
                is_active: is_active !== undefined ? Boolean(is_active) : undefined,
            },
        });

        return NextResponse.json(menuItem);
    } catch (error) {
        console.error("Error updating menu item:", error);
        return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
    }
}

// DELETE: Remove menu item
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const numericId = Number(id);

        // If a menuItem exists with this id, delete it (and its children)
        const existing = await prisma.menuItem.findUnique({ where: { id: numericId } });
        if (existing) {
            await prisma.menuItem.deleteMany({ where: { parent_id: numericId } });
            await prisma.menuItem.delete({ where: { id: numericId } });
            return NextResponse.json({ success: true });
        }

        // Fallback: if no menuItem, maybe this is a Page id (from fallback). Unset is_in_menu on that page.
        const page = await prisma.page.findUnique({ where: { id: numericId } });
        if (page) {
            await prisma.page.update({ where: { id: numericId }, data: { is_in_menu: false } });
            return NextResponse.json({ success: true, fallback: true });
        }

        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    } catch (error) {
        console.error("Error deleting menu item:", error);
        return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
    }
}
