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

        // First, delete all children (if any)
        await prisma.menuItem.deleteMany({
            where: { parent_id: Number(id) },
        });

        // Then delete the item itself
        await prisma.menuItem.delete({
            where: { id: Number(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting menu item:", error);
        return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
    }
}
