
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
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
    try {
        const body = await request.json();
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
