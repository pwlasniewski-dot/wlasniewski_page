import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authError = await requireAuth(request);
        if (authError) return authError;

        const templates = await prisma.offer.findMany({
            where: { is_template: true },
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                title: true,
                type: true,
                category: true,
                template_data: true,
                created_at: true
            }
        });

        return NextResponse.json({ templates });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const authError = await requireAuth(request);
        if (authError) return authError;

        const body = await request.json();
        const { title, type, category, template_data } = body;

        if (!title || !template_data) {
            return NextResponse.json(
                { error: 'Nazwa szablonu i dane są wymagane' },
                { status: 400 }
            );
        }

        const template = await prisma.offer.create({
            data: {
                title,
                slug: `template-${Date.now()}`,
                type: type || 'b2c',
                category: category || 'standard',
                status: 'draft',
                is_template: true,
                template_data: template_data
            }
        });

        return NextResponse.json({ success: true, template });
    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json(
            { error: 'Failed to create template' },
            { status: 500 }
        );
    }
}
