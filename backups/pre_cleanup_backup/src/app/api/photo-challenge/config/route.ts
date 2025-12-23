// API Route: POST /api/photo-challenge/config
// Updates PageEffect for photo challenge carousel

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();
            const { page_slug, section_name, effect_type, is_enabled, manual_photos, config } = body;

            if (!page_slug || !section_name) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            // Find existing effect or create new one
            // Ideally we use upsert but unique constraint is a composite key [page_slug, section_name]
            // Standard Prisma upsert works on unique fields, so it should be fine if we have @@unique

            const effect = await prisma.pageEffect.upsert({
                where: {
                    page_slug_section_name: {
                        page_slug,
                        section_name
                    }
                },
                update: {
                    effect_type,
                    is_enabled,
                    manual_photos: typeof manual_photos === 'string' ? manual_photos : JSON.stringify(manual_photos),
                    config: typeof config === 'string' ? config : JSON.stringify(config),
                    photos_source: 'manual' // Force manual source for this config page
                },
                create: {
                    page_slug,
                    section_name,
                    effect_type: effect_type || 'carousel',
                    is_enabled: is_enabled ?? true,
                    manual_photos: typeof manual_photos === 'string' ? manual_photos : JSON.stringify(manual_photos),
                    config: typeof config === 'string' ? config : JSON.stringify(config),
                    photos_source: 'manual'
                }
            });

            return NextResponse.json({ success: true, effect });
        } catch (error) {
            console.error('Failed to update config:', error);
            return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
        }
    });
}
