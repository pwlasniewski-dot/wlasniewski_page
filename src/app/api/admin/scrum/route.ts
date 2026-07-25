
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;
    try {
        const tasks = await prisma.scrumTask.findMany({
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json(tasks);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;
    try {
        const body = await request.json();
        const task = await prisma.scrumTask.create({
            data: {
                title: body.title,
                content: body.content,
                status: body.status || 'TODO',
                priority: body.priority || 'MEDIUM',
                due_date: body.due_date ? new Date(body.due_date) : null
            }
        });
        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (updates.due_date) updates.due_date = new Date(updates.due_date);

        const task = await prisma.scrumTask.update({
            where: { id: parseInt(id) },
            data: updates
        });
        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.scrumTask.delete({
            where: { id: parseInt(id) }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
