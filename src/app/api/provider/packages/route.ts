import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// Helper to check provider permissions
async function getProvider(request: NextRequest) {
    // Basic auth check
    const token = request.headers.get('authorization')?.split(' ')[1];
    // In real app use verified token from withAuth context, 
    // but here we trust the middleware wrapper
    return null; // Logic is handled inside routes, this is placeholder
}

// GET: Fetch packages for the logged-in provider
export async function GET(request: NextRequest) {
    try {
        // Extract user ID from header (middleware should inject this, or we parse token)
        // For now, let's assume client sends ID or we decode token. 
        // Better: decode token manually since NextRequest doesn't easily carry custom context without hacks.
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Simple token decoding (same logic as in middleware)
        const token = authHeader.split(' ')[1];
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-this');

        let payload;
        try {
            const result = await jwtVerify(token, secret);
            payload = result.payload as { id: number; role: string };
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (payload.role !== 'PHOTOGRAPHER' && payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const packages = await prisma.package.findMany({
            where: {
                provider_id: payload.id
            },
            include: {
                service: true // Include service type name
            },
            orderBy: {
                order: 'asc'
            }
        });

        return NextResponse.json({ success: true, packages });

    } catch (error) {
        console.error('Provider packages error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: Create a new package
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-this');

        let payload;
        try {
            const result = await jwtVerify(token, secret);
            payload = result.payload as { id: number; role: string };
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (payload.role !== 'PHOTOGRAPHER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, service_id, price, hours, description } = body;

        // Validation
        if (!name || !service_id || !price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create Package
        // Status defaults to active, but maybe Admin approval is needed?
        // For now, let's auto-approve or add is_active=false if explicit verification logic exists.
        // Schema default is true.

        const newPackage = await prisma.package.create({
            data: {
                name,
                service_id: Number(service_id),
                price: Number(price),
                hours: Number(hours || 0),
                description: description || '',
                provider_id: payload.id,
                is_active: true // Auto-active for MVP
            }
        });

        return NextResponse.json({ success: true, package: newPackage });

    } catch (error) {
        console.error('Create package error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PUT: Update package
export async function PUT(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-this');

        let payload;
        try {
            const result = await jwtVerify(token, secret);
            payload = result.payload as { id: number; role: string };
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'Package ID required' }, { status: 400 });

        // Verify ownership
        const existing = await prisma.package.findUnique({ where: { id: Number(id) } });
        if (!existing || existing.provider_id !== payload.id) {
            return NextResponse.json({ error: 'Package not found or forbidden' }, { status: 403 });
        }

        const updated = await prisma.package.update({
            where: { id: Number(id) },
            data: {
                ...updates,
                price: updates.price ? Number(updates.price) : undefined,
                hours: updates.hours ? Number(updates.hours) : undefined,
                service_id: updates.service_id ? Number(updates.service_id) : undefined
            }
        });

        return NextResponse.json({ success: true, package: updated });

    } catch (error) {
        console.error('Update package error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE: Remove package
export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const authHeader = request.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-this');

        let payload;
        try {
            const result = await jwtVerify(token, secret);
            payload = result.payload as { id: number; role: string };
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Verify ownership
        const existing = await prisma.package.findUnique({ where: { id: Number(id) } });
        if (!existing || existing.provider_id !== payload.id) {
            return NextResponse.json({ error: 'Package not found or forbidden' }, { status: 403 });
        }

        await prisma.package.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete package error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
