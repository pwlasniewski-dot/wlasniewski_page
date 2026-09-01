import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { findActivePublicPackages } from '@/lib/publicPackagePricing';
import { loadActivePromotionsForPackages, type PublicPackagePromotion } from '@/lib/packagePromotions';

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
        let promotions = new Map<number, PublicPackagePromotion>();
        try {
            promotions = await loadActivePromotionsForPackages(packages.map(pkg => pkg.id));
        } catch (promotionError) {
            console.warn('[packages] Package promotions unavailable; using regular prices.', promotionError);
        }

        return NextResponse.json({
            success: true,
            packages: packages.map(pkg => ({
                ...pkg,
                regular_price: pkg.price,
                effective_price: promotions.get(pkg.id)?.price ?? pkg.price,
                price: promotions.get(pkg.id)?.price ?? pkg.price,
                promotion: promotions.get(pkg.id) || null,
            })),
        });
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
            is_active,
        } = body;

        if (!service_id || !name || !hours || price === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: service_id, name, hours, price' },
                { status: 400 },
            );
        }

        const normalizedServiceId = Number(service_id);
        const normalizedHours = Number(hours);
        const normalizedPrice = Number(price);
        if (
            !Number.isInteger(normalizedServiceId) || normalizedServiceId <= 0
            || !Number.isInteger(normalizedHours) || normalizedHours <= 0 || normalizedHours > 24
            || !Number.isInteger(normalizedPrice) || normalizedPrice < 0
        ) {
            return NextResponse.json(
                { error: 'service_id, hours and price must be valid non-negative integers' },
                { status: 400 },
            );
        }

        let normalizedAvailableHours: string | null | undefined;
        if (available_hours !== undefined) {
            const rawHours = String(available_hours).trim();
            if (!rawHours) {
                normalizedAvailableHours = null;
            } else {
                const parsedHours = rawHours.split(',').map(value => value.trim());
                if (parsedHours.some(value => !/^\d{1,2}$/.test(value) || Number(value) > 23)) {
                    return NextResponse.json(
                        { error: 'available_hours must be a comma-separated list of hours from 0 to 23' },
                        { status: 400 },
                    );
                }
                normalizedAvailableHours = Array.from(new Set(parsedHours.map(Number)))
                    .sort((a, b) => a - b)
                    .join(',');
            }
        }

        if (id) {
            const packageId = Number(id);
            if (!Number.isInteger(packageId) || packageId <= 0) {
                return NextResponse.json({ error: 'Invalid package id' }, { status: 400 });
            }

            const result = await prisma.$transaction(async tx => {
                await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`package-promotion:${packageId}`}))`;
                const current = await tx.package.findUnique({ where: { id: packageId } });
                if (!current) return { error: 'PACKAGE_NOT_FOUND' as const };

                if (current.price !== normalizedPrice) {
                    try {
                        const now = new Date();
                        const blockingPromotion = await tx.packagePromotion.findFirst({
                            where: {
                                package_id: packageId,
                                is_enabled: true,
                                OR: [
                                    { ends_at: null },
                                    { ends_at: { gt: now } },
                                ],
                            },
                            select: { id: true },
                        });
                        if (blockingPromotion) return { error: 'ACTIVE_PROMOTION' as const };
                    } catch (promotionLookupError: any) {
                        // During additive deployment the promotion table may not
                        // exist yet. The legacy package editor must keep working.
                        if (promotionLookupError?.code !== 'P2021') throw promotionLookupError;
                    }
                }

                const pkg = await tx.package.update({
                    where: { id: packageId },
                    data: {
                        name,
                        icon,
                        description,
                        hours: normalizedHours,
                        price: normalizedPrice,
                        subtitle,
                        features: typeof features === 'string' ? features : JSON.stringify(features || []),
                        ...(normalizedAvailableHours !== undefined && { available_hours: normalizedAvailableHours }),
                        ...(blocks_entire_day !== undefined && { blocks_entire_day }),
                        order: order ?? 0,
                        is_active: is_active !== undefined ? is_active : true,
                    } as any,
                    include: { service: true },
                });
                return { package: pkg };
            });

            if ('error' in result) {
                if (result.error === 'PACKAGE_NOT_FOUND') {
                    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
                }
                return NextResponse.json({
                    error: 'Najpierw zakończ lub anuluj promocję tego pakietu. Zmiana zwykłej ceny w trakcie promocji zaburzyłaby historię cen.',
                    code: 'PACKAGE_PRICE_LOCKED_BY_PROMOTION',
                }, { status: 409 });
            }
            return NextResponse.json({ success: true, package: result.package });
        }

        const pkg = await prisma.package.create({
            data: {
                service_id: normalizedServiceId,
                name,
                icon,
                description,
                hours: normalizedHours,
                price: normalizedPrice,
                subtitle,
                features: typeof features === 'string' ? features : JSON.stringify(features || []),
                ...(normalizedAvailableHours !== undefined && { available_hours: normalizedAvailableHours }),
                ...(blocks_entire_day !== undefined && { blocks_entire_day }),
                order: order ?? 0,
                is_active: is_active !== undefined ? is_active : true,
            } as any,
            include: { service: true },
        });
        return NextResponse.json({ success: true, package: pkg });
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
            where: { id: parseInt(id) },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting package:', error);
        return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
    }
}
