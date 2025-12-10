import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Create a new invite
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { inviter_name, partner_name, occasion, message, style } = body;

        if (!inviter_name || !partner_name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Generate unique slug
        const slug = `${inviter_name}-${partner_name}-${Math.random().toString(36).substring(2, 7)}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-");

        const invite = await prisma.sessionInvite.create({
            data: {
                slug,
                inviter_name,
                partner_name,
                occasion,
                message,
                style: style || "romantic",
            },
        });

        return NextResponse.json(invite);
    } catch (error) {
        console.error("Error creating invite:", error);
        return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }
}

// GET: Fetch invite by slug (passed as query param)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
        return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    try {
        const invite = await prisma.sessionInvite.findUnique({
            where: { slug },
        });

        if (!invite) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        return NextResponse.json(invite);
    } catch (error) {
        console.error("Error fetching invite:", error);
        return NextResponse.json({ error: "Failed to fetch invite" }, { status: 500 });
    }
}
