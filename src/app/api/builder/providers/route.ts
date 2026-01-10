import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        if (!dateParam) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        const selectedDate = new Date(dateParam);
        // Normalize to start of day for accurate comparison (if needed), 
        // but Prisma Date filter usually handles simple equality if stored as midnight.
        // Assuming 'date' in DB is DateTime. Ideally we compare range or use day-level precision.

        // Define day range to catch time-based bookings
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Fetch all Categories (ServiceTypes) with active Packages
        const serviceTypes = await prisma.serviceType.findMany({
            where: { is_active: true },
            include: {
                packages: {
                    where: { is_active: true },
                    include: {
                        provider: {
                            include: {
                                photographer_profile: true,
                                availability: {
                                    where: {
                                        date: {
                                            gte: startOfDay,
                                            lte: endOfDay
                                        }
                                    }
                                },
                                assigned_bookings: {
                                    where: {
                                        date: {
                                            gte: startOfDay,
                                            lte: endOfDay
                                        },
                                        status: { notIn: ['cancelled', 'rejected'] }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { order: 'asc' }
        });

        // 2. Transform and Filter Data
        const availableCategories = serviceTypes.map(service => {
            // Group packages by Provider within this Service
            // But 'packages' list is flat. We need unique providers for this service.

            const providersMap = new Map();

            service.packages.forEach(pkg => {
                if (!pkg.provider) return; // Generic package without provider? Ignored for Builder?
                // OR generic packages are "Admin" packages. Let's include them?
                // The prompt says "moje admina pakiety mogą zostać np widoczne niżej jako gotowce".
                // Ideally we separate them. Let's focus on Providers first.
                // If provider is null, map it to "Standard/Admin".

                const providerId = pkg.provider?.id || 'admin';
                const providerName = pkg.provider?.name || 'Standard';

                // CHECK AVAILABILITY
                let isAvailable = true;

                if (pkg.provider) {
                    // Check manual block
                    if (pkg.provider.availability.length > 0) {
                        const availEntry = pkg.provider.availability[0];
                        if (!availEntry.is_available) isAvailable = false;
                    }

                    // Check existing bookings
                    // Simplification: Any booking on this day blocks the provider.
                    // Future: check hours.
                    if (pkg.provider.assigned_bookings.length > 0) {
                        isAvailable = false;
                    }
                }

                if (!isAvailable) return;

                if (!providersMap.has(providerId)) {
                    providersMap.set(providerId, {
                        id: providerId,
                        name: providerName,
                        is_admin: !pkg.provider,
                        profile: pkg.provider?.photographer_profile ? {
                            avatar_url: pkg.provider.photographer_profile.avatar_url,
                            bio: pkg.provider.photographer_profile.bio,
                            rating: pkg.provider.photographer_profile.rating,
                            highlight_photos: pkg.provider.photographer_profile.highlight_photos
                        } : null,
                        packages: []
                    });
                }

                providersMap.get(providerId).packages.push({
                    id: pkg.id,
                    name: pkg.name,
                    price: pkg.price,
                    hours: pkg.hours,
                    description: pkg.description,
                    features: pkg.features
                });
            });

            // Convert Map to Array and Sort
            const providers = Array.from(providersMap.values());

            // Sort by Price (Avg) or Rating? User said "Sort from most expensive".
            // Let's sort by max package price desc.
            providers.sort((a, b) => {
                const maxA = Math.max(...a.packages.map((p: any) => p.price));
                const maxB = Math.max(...b.packages.map((p: any) => p.price));
                return maxB - maxA;
            });

            return {
                id: service.id,
                name: service.name,
                icon: service.icon,
                providers
            };
        }).filter(cat => cat.providers.length > 0); // Hide empty categories

        return NextResponse.json({
            success: true,
            date: dateParam,
            categories: availableCategories
        });

    } catch (error) {
        console.error('Builder API Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
