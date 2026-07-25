
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { z } from 'zod';

const templateSchema = z.object({
    title: z.string().trim().min(1).max(120),
    subject: z.string().trim().min(1).max(180),
    content: z.string().trim().min(1).max(100_000),
    category: z.string().trim().max(40).optional(),
    variables: z.array(z.string().trim().max(64)).max(30).optional(),
});

export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;
    try {
        const templates = await prisma.marketingTemplate.findMany({
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;
    try {
        const parsed = templateSchema.safeParse(await request.json());
        if (!parsed.success) return NextResponse.json({ error: 'Nieprawidłowe dane szablonu' }, { status: 400 });
        const body = parsed.data;
        const template = await prisma.marketingTemplate.create({
            data: {
                title: body.title,
                subject: body.subject,
                content: body.content,
                category: body.category || 'GENERAL',
                variables: body.variables ? JSON.stringify(body.variables) : null
            }
        });
        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }
}
