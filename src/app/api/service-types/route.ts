import { revalidatePublicOffer } from '@/lib/revalidate-public-offer';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { loadActivePromotionsForPackages, type PublicPackagePromotion } from '@/lib/packagePromotions';
import { applyPublicPackagePrices } from '@/lib/packagePromotionPricing';

const PACKAGE_PROMOTION_RELEASE = 'package-promotion-save-v2';

// GET all service types. Public prices are decorated with the active package
// promotion, but the regular price remains available as `regular_price`.
export async function GET(request: NextRequest) {
    const adminView = new URL(request.url).searchParams.get('view') === 'admin';
    try {
        const serviceTypes = await prisma.serviceType.findMany({
            include: {
                packages: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        });

        let promotions = new Map<number, PublicPackagePromotion>();
        try {
            const packageIds = serviceTypes.flatMap(service => service.packages.map(pkg => pkg.id));
            promotions = await loadActivePromotionsForPackages(packageIds);
        } catch (promotionError) {
            // Additive rollout: the public offer must remain available before the
            // migration is committed. No promotion is shown until the table exists.
            console.warn('[service-types] Package promotions unavailable; using regular prices.', promotionError);
        }

        return NextResponse.json({
            success: true,
            serviceTypes: serviceTypes.map(service => ({
                ...service,
                packages: applyPublicPackagePrices(service.packages, promotions).map(pkg => ({
                    ...pkg,
                    price: adminView ? pkg.regular_price : pkg.price,
                })),
            })),
        }, {
            headers: {
                'X-Wlasniewski-Release': PACKAGE_PROMOTION_RELEASE,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('Failed to fetch service types:', error);
        return NextResponse.json({ error: 'Failed to fetch service types' }, { status: 500 });
    }
}

// POST - Create or update service type
export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const {
            id,
            name,
            icon,
            description,
            order,
            is_active,
        } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 },
            );
        }

        if (id) {
            const serviceType = await prisma.serviceType.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    icon,
                    description,
                    order: order ?? 0,
                    is_active: is_active !== undefined ? is_active : true,
                },
                include: {
                    packages: { orderBy: { order: 'asc' } },
                },
            });
            revalidatePublicOffer();
            return NextResponse.json({ success: true, serviceType });
        }

        const serviceType = await prisma.serviceType.create({
            data: {
                name,
                icon,
                description,
                order: order ?? 0,
                is_active: is_active !== undefined ? is_active : true,
            },
            include: {
                packages: { orderBy: { order: 'asc' } },
            },
        });
        revalidatePublicOffer();
        return NextResponse.json({ success: true, serviceType });
    } catch (error) {
        console.error('Error updating service type:', error);
        return NextResponse.json({ error: 'Failed to save service type' }, { status: 500 });
    }
}

// DELETE service type
export async function DELETE(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json(
            { error: 'Service type ID is required' },
            { status: 400 },
        );
    }

    try {
        await prisma.serviceType.delete({
            where: { id: parseInt(id) },
        });
        revalidatePublicOffer();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting service type:', error);
        return NextResponse.json({ error: 'Failed to delete service type' }, { status: 500 });
    }
}
