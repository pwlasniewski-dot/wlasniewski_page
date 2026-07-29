import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

const ALLOWED_STATUSES = new Set(['new', 'contacted', 'qualified', 'won', 'lost']);

// GET all inquiries
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const inquiries = await prisma.inquiry.findMany({
                orderBy: { created_at: 'desc' },
            });
            return NextResponse.json({ success: true, inquiries });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
        }
    });
}

export async function PATCH(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const body: unknown = await request.json();
            if (!body || typeof body !== 'object') {
                return NextResponse.json({ error: 'Nieprawidłowe dane' }, { status: 400 });
            }

            const { id, status } = body as { id?: unknown; status?: unknown };
            if (typeof id !== 'number' || !Number.isInteger(id) || typeof status !== 'string' || !ALLOWED_STATUSES.has(status)) {
                return NextResponse.json({ error: 'Nieprawidłowy identyfikator lub status' }, { status: 400 });
            }

            const inquiry = await prisma.inquiry.update({
                where: { id },
                data: { status },
            });
            return NextResponse.json({ success: true, inquiry });
        } catch (error: unknown) {
            const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
            if (code === 'P2025') {
                return NextResponse.json({ error: 'Zapytanie nie istnieje' }, { status: 404 });
            }
            return NextResponse.json({ error: 'Nie udało się zmienić statusu' }, { status: 500 });
        }
    });
}
