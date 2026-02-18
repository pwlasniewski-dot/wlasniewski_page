import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { generateOfferNumber } from '@/lib/services/numbering';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Check auth
        const authError = await requireAuth(request);
        if (authError) return authError;

        // Get filters from query params
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const status = searchParams.get('status');

        // Safely parse pagination
        let limit = parseInt(searchParams.get('limit') || '50');
        let offset = parseInt(searchParams.get('offset') || '0');

        if (isNaN(limit) || limit < 1) limit = 50;
        if (isNaN(offset) || offset < 0) offset = 0;

        // Build where clause
        const where: any = {};
        if (type) {
            // Case-insensitive match for b2c/b2b
            where.type = type.toLowerCase();
        }
        if (status) where.status = status;

        // Fetch offers with related data
        const [offers, total] = await Promise.all([
            prisma.offer.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { created_at: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            last_login: true,
                            last_failed_login: true,
                        },
                    },
                    sections: {
                        include: {
                            items: true,
                        },
                    },
                    negotiations: true,
                    contract: true,
                },
            }),
            prisma.offer.count({ where }),
        ]);

        return NextResponse.json({
            offers,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error('❌ Error fetching offers:', error);

        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';

        // Log details to console for easier debugging in Next.js logs
        console.error(`[Admin Offers API] CRITICAL ERROR: ${errorMsg}\nStack: ${errorStack}`);

        return NextResponse.json(
            { error: 'Failed to fetch offers', details: errorMsg },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('📥 POST /api/admin/offers called');

        // Check auth
        const authError = await requireAuth(request);
        if (authError) {
            console.log('❌ Auth failed');
            return authError;
        }

        console.log('✅ Auth passed');

        const body = await request.json();
        console.log('📦 Request body received:', {
            title: body.title,
            slug: body.slug,
            type: body.type,
            sections_count: body.sections?.length
        });

        const {
            slug,
            title,
            type = 'b2c',
            category,
            client_id,
            client_email,
            valid_until,
            is_template,
            sections = [],
            template_data = null, // New field
        } = body;

        // ... validation ...
        if (!title || !slug) {
            return NextResponse.json(
                { error: 'Missing required fields: title, slug' },
                { status: 400 }
            );
        }

        // Validate client_id
        let parsedClientId: number | null = null;
        if (client_id !== undefined && client_id !== null && client_id !== '') {
            const parsed = parseInt(String(client_id), 10);
            if (!isNaN(parsed)) {
                parsedClientId = parsed;
            }
        }

        // Generate unique offer number
        const offerNumber = await generateOfferNumber(type === 'b2b' ? 'B2B' : 'B2C');

        // Initial total price calculation
        let totalPrice = 0;

        // Handle template_data (A4 Builder context)
        if (template_data) {
            // Extract total price from footerPrices if possible
            const prices = template_data.footerPrices || [];
            if (prices.length > 1) {
                // Try to find the recommended column total or just the first price column
                const colIdx = template_data.recommendationColumnIndex > 0 ? template_data.recommendationColumnIndex : 1;
                const priceStr = prices[colIdx] || prices[1] || '0';
                totalPrice = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
            }
        } else {
            // Legacy/Relational calculation
            sections.forEach((s: any) => {
                (s.items || []).forEach((item: any) => {
                    if (!item.is_optional) {
                        const p = Number(item.price) || 0;
                        const q = Number(item.quantity) || 1;
                        totalPrice += p * q;
                    }
                });
            });
        }

        const offer = await prisma.offer.create({
            data: {
                slug,
                title,
                type,
                category,
                offerNumber,
                client_id: parsedClientId,
                client_email,
                is_template: is_template || false,
                valid_until: valid_until ? new Date(valid_until) : null,
                status: 'draft',
                template_data: template_data,
                total_price: totalPrice,
                sections: template_data ? undefined : {
                    create: sections.map((section: any, idx: number) => ({
                        title: String(section.title || ''),
                        description: String(section.description || ''),
                        order: idx,
                        items: {
                            create: (section.items || []).map((item: any) => ({
                                title: String(item.title || ''),
                                price: Number(item.price) || 0,
                                quantity: Number(item.quantity) || 1,
                            }))
                        }
                    }))
                },
            },
        });

        return NextResponse.json({ offer }, { status: 201 });
    } catch (error) {
        console.error('❌ Error creating offer:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('📋 Error details:', { errorMessage, errorStack });
        return NextResponse.json(
            { error: 'Failed to create offer', details: errorMessage },
            { status: 500 }
        );
    }
}
