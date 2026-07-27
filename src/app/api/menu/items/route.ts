
import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { requireAdminAuth, withAdminAuth } from "@/lib/auth/middleware";
import { z } from 'zod';

const menuTypeSchema = z.enum(['b2c', 'b2b']);
const menuUrlSchema = z.string().trim().max(500).refine(
    value => value.startsWith('/') || /^https:\/\//i.test(value),
    'Menu URL must be a relative path or HTTPS URL'
);
const createMenuItemSchema = z.object({
    title: z.string().trim().min(1).max(80),
    url: menuUrlSchema.nullish(),
    page_id: z.number().int().positive().nullish(),
    parent_id: z.number().int().positive().nullish(),
    order: z.number().int().min(0).max(1000).optional(),
    menu_type: menuTypeSchema.optional(),
});
const updateMenuItemSchema = createMenuItemSchema.partial().extend({
    id: z.number().int().positive(),
    is_active: z.boolean().optional(),
});

// GET: Fetch menu tree
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "b2c";

        const authHeader = request.headers.get('authorization');
        const isAdmin = authHeader?.startsWith('Bearer ')
            ? (await requireAdminAuth(request)) === null
            : false;

        const where: any = {
            parent_id: null, // Only fetch top-level items
            menu_type: type,
        };

        if (!isAdmin) {
            where.is_active = true;
        }

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
                    where: isAdmin ? {} : { is_active: true }, // Filter sub-items if not admin
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
            where
        });

        if (menuItems.length === 0 && type === 'b2c') {
            // Fallback: build menu from pages where is_in_menu = true
            const pages = await prisma.page.findMany({
                where: {
                    is_in_menu: true,
                    ...(isAdmin ? {} : { is_published: true })
                },
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
export async function POST(request: NextRequest) {
    return withAdminAuth(request, async (req) => {
        try {
            const parsed = createMenuItemSchema.safeParse(await req.json());
            if (!parsed.success) {
                return NextResponse.json({ error: "Invalid menu item data" }, { status: 400 });
            }
            const { title, url, page_id, parent_id, order, menu_type } = parsed.data;

            const menuItem = await prisma.menuItem.create({
                data: {
                    title,
                    url,
                    page_id: page_id ? Number(page_id) : null,
                    parent_id: parent_id ? Number(parent_id) : null,
                    order: order ? Number(order) : 0,
                    menu_type: menu_type || 'b2c',
                },
            });

            return NextResponse.json(menuItem);
        } catch (error) {
            console.error("Error creating menu item:", error);
            return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
        }
    });
}

// PUT: Update menu item
export async function PUT(request: NextRequest) {
    return withAdminAuth(request, async (req) => {
        try {
            const parsed = updateMenuItemSchema.safeParse(await req.json());
            if (!parsed.success) {
                return NextResponse.json({ error: "Invalid menu item data" }, { status: 400 });
            }
            const { id, title, url, page_id, parent_id, order, is_active, menu_type } = parsed.data;
            if (parent_id === id) {
                return NextResponse.json({ error: "Item cannot be its own parent" }, { status: 400 });
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
                    menu_type: menu_type !== undefined ? menu_type : undefined,
                },
            });

            return NextResponse.json(menuItem);
        } catch (error) {
            console.error("Error updating menu item:", error);
            return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
        }
    });
}

// DELETE: Remove menu item
export async function DELETE(request: NextRequest) {
    return withAdminAuth(request, async () => {
        try {
            const { searchParams } = new URL(request.url);
            const parsedId = z.coerce.number().int().positive().safeParse(searchParams.get("id"));
            if (!parsedId.success) {
                return NextResponse.json({ error: "Valid ID is required" }, { status: 400 });
            }
            const numericId = parsedId.data;

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
    });
}
