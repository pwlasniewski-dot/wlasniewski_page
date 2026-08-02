import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { findActivePublicPackages } from '@/lib/publicPackagePricing';

// GET packages by service (public endpoint)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const serviceName = searchParams.get('serviceName');

    try {
        const packages = await findActivePublicPackages({
            ...(serviceId ? { serviceId: parseInt(serviceId, 10) } : {}),
            ...(serviceName ? { serviceName } : {}),
        });

        return NextResponse.json({ success: true, packages });
    } catch (error) {
        console.error('Failed to fetch packages:', error);
        return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }
}

// POST - Create or update package (accessible from admin)
export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();
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
            available_hours,
            blocks_entire_day,
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
                    ...(available_hours && { available_hours }),
                    ...(blocks_entire_day !== undefined && { blocks_entire_day }),
                    order: order ?? 0,
                    is_active: is_active !== undefined ? is_active : true
                } as any,
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
                    ...(available_hours && { available_hours }),
                    ...(blocks_entire_day !== undefined && { blocks_entire_day }),
                    order: order ?? 0,
                    is_active: is_active !== undefined ? is_active : true
                } as any,
                include: { service: true }
            });
            return NextResponse.json({ success: true, package: pkg });
        }
    } catch (error) {
        console.error('Error updating package:', error);
        return NextResponse.json({ error: 'Failed to save package' }, { status: 500 });
    }
}


export async function DELETE(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
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
}
