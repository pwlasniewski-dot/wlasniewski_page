import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET packages by service (public endpoint)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const serviceName = searchParams.get('serviceName');

    try {
        let packages;
        
        if (serviceId) {
            packages = await prisma.package.findMany({
                where: {
                    service_id: parseInt(serviceId),
                    is_active: true
                },
                orderBy: { order: 'asc' }
            });
        } else if (serviceName) {
            packages = await prisma.package.findMany({
                where: {
                    service: {
                        name: serviceName
                    },
                    is_active: true
                },
                include: { service: true },
                orderBy: { order: 'asc' }
            });
        } else {
            // Get all packages with service info
            packages = await prisma.package.findMany({
                where: { is_active: true },
                include: { service: true },
                orderBy: [{ service_id: 'asc' }, { order: 'asc' }]
            });
        }

        return NextResponse.json({ success: true, packages });
    } catch (error) {
        console.error('Failed to fetch packages:', error);
        return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }
}

// POST - Create or update package
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const {
                id,
                service_id,
                name,
                icon,
                description,
                hours,
                price,
                subtitle,
                features,
                order,
                is_active
            } = body;

            if (!service_id || !name || !hours || price === undefined) {
                return NextResponse.json(
                    { error: 'Missing required fields: service_id, name, hours, price' },
                    { status: 400 }
                );
            }

            if (id) {
                // Update existing package
                const pkg = await prisma.package.update({
                    where: { id: parseInt(id) },
                    data: {
                        name,
                        icon,
                        description,
                        hours,
                        price,
                        subtitle,
                        features: typeof features === 'string' ? features : JSON.stringify(features || []),
                        order: order ?? 0,
                        is_active: is_active !== undefined ? is_active : true
                    },
                    include: { service: true }
                });
                return NextResponse.json({ success: true, package: pkg });
            } else {
                // Create new package
                const pkg = await prisma.package.create({
                    data: {
                        service_id,
                        name,
                        icon,
                        description,
                        hours,
                        price,
                        subtitle,
                        features: typeof features === 'string' ? features : JSON.stringify(features || []),
                        order: order ?? 0,
                        is_active: is_active !== undefined ? is_active : true
                    },
                    include: { service: true }
                });
                return NextResponse.json({ success: true, package: pkg });
            }
        } catch (error) {
            console.error('Error updating package:', error);
            return NextResponse.json({ error: 'Failed to save package' }, { status: 500 });
        }
    });
}

// DELETE package
export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req) => {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
        }

        try {
            await prisma.package.delete({
                where: { id: parseInt(id) }
            });
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('Error deleting package:', error);
            return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
        }
    });
}
