import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import type { NextRequest } from 'next/server';

const prisma = new PrismaClient();

// Route segment config for Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Pobierz wszystkie notatki błędów
export async function GET(req: NextRequest) {
    const authError = await requireAuth(req);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status'); // OPEN, RESOLVED, IGNORED
        const category = searchParams.get('category'); // DATABASE, API, etc.

        const where: any = {};
        if (status) where.status = status;
        if (category) where.category = category;

        const notes = await prisma.errorNote.findMany({
            where,
            orderBy: [
                { status: 'asc' }, // OPEN first
                { severity: 'desc' }, // CRITICAL first
                { created_at: 'desc' }
            ]
        });

        return NextResponse.json({ success: true, notes });
    } catch (error) {
        console.error('Error fetching error notes:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch error notes' },
            { status: 500 }
        );
    }
}

// POST - Dodaj nową notatkę błędu
export async function POST(req: NextRequest) {
    const authError = await requireAuth(req);
    if (authError) return authError;

    try {
        const body = await req.json();
        const { title, category, severity, description, sql_query, notes } = body;

        if (!title || !description) {
            return NextResponse.json(
                { success: false, error: 'Title and description are required' },
                { status: 400 }
            );
        }

        const errorNote = await prisma.errorNote.create({
            data: {
                title,
                category: category || 'OTHER',
                severity: severity || 'MEDIUM',
                description,
                sql_query,
                notes,
                status: 'OPEN'
            }
        });

        return NextResponse.json({ success: true, errorNote });
    } catch (error) {
        console.error('Error creating error note:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create error note' },
            { status: 500 }
        );
    }
}

// PUT - Aktualizuj status notatki
export async function PUT(req: NextRequest) {
    const authError = await requireAuth(req);
    if (authError) return authError;

    try {
        const body = await req.json();
        const { id, status, notes } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Note ID is required' },
                { status: 400 }
            );
        }

        const updateData: any = {};
        if (status) {
            updateData.status = status;
            if (status === 'RESOLVED') {
                updateData.resolved_at = new Date();
            }
        }
        if (notes !== undefined) updateData.notes = notes;

        const errorNote = await prisma.errorNote.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        return NextResponse.json({ success: true, errorNote });
    } catch (error) {
        console.error('Error updating error note:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update error note' },
            { status: 500 }
        );
    }
}

// DELETE - Usuń notatkę
export async function DELETE(req: NextRequest) {
    const authError = await requireAuth(req);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Note ID is required' },
                { status: 400 }
            );
        }

        await prisma.errorNote.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting error note:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete error note' },
            { status: 500 }
        );
    }
}
