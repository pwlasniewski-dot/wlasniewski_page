import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET settings
export async function GET(request: NextRequest) {
    try {
        // Ensure we always fetch the SAME 'first' record
        const settings = await prisma.setting.findMany({
            orderBy: { id: 'asc' },
            take: 1
        });

        // 1. Start with Key/Value pairs
        const settingsMap = settings.reduce((acc, curr) => {
            if (curr.setting_key) {
                acc[curr.setting_key] = curr.setting_value;
            }
            return acc;
        }, {} as Record<string, any>);

        // 2. Merge columns from the first record (if exists)
        // This ensures new column-based settings (parallax, etc.) are included
        if (settings.length > 0) {
            const mainSettings = settings[0];
            const excludedKeys = ['id', 'setting_key', 'setting_value', 'updated_at'];

            Object.keys(mainSettings).forEach(key => {
                if (!excludedKeys.includes(key)) {
                    const val = (mainSettings as any)[key];
                    // Only overwrite if value is not null/empty, OR if it's a specific column we expect
                    if (val !== null) {
                        settingsMap[key] = val;
                    }
                }
            });
        }

        return NextResponse.json({ success: true, settings: settingsMap });
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// UPDATE settings
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();

            // Separate specific columns from generic key/value pairs
            const columnFields = [
                'parallax_home_1', 'parallax_home_2',
                'about_me_hero_image', 'about_me_portrait',
                'info_band_image', 'info_band_title', 'info_band_content',
                // Navbar
                'navbar_font_size', 'navbar_font_family',
                // Navbar
                'navbar_font_size', 'navbar_font_family',
                // Logo
                'logo_url', 'logo_dark_url', 'logo_size',
                // Payment Config
                'p24_merchant_id', 'p24_pos_id', 'p24_crc_key', 'p24_api_key',
                'p24_test_mode', 'p24_method_blik', 'p24_method_card', 'p24_method_transfer',
                // Portfolio
                'portfolio_categories',
                // Other
                'seasonal_effect'
            ];

            const columnUpdates: Record<string, any> = {};
            const kvUpdates: Record<string, string> = {};

            for (const [key, value] of Object.entries(body)) {
                if (columnFields.includes(key)) {
                    columnUpdates[key] = value;
                } else {
                    kvUpdates[key] = String(value);
                }
            }

            // 1. Update columns on the first record (or create if none)
            const firstSetting = await prisma.setting.findFirst({
                orderBy: { id: 'asc' }
            });

            if (firstSetting) {
                await prisma.setting.update({
                    where: { id: firstSetting.id },
                    data: columnUpdates
                });
            } else {
                // Should not happen usually, but create if empty
                await prisma.setting.create({
                    data: {
                        setting_key: 'system_init',
                        setting_value: 'true',
                        ...columnUpdates
                    }
                });
            }

            // 2. Upsert Key/Value pairs
            const updates = [];
            for (const [key, value] of Object.entries(kvUpdates)) {
                updates.push(
                    prisma.setting.upsert({
                        where: { setting_key: key },
                        update: { setting_value: value },
                        create: { setting_key: key, setting_value: value },
                    })
                );
            }

            if (updates.length > 0) {
                await prisma.$transaction(updates);
            }

            return NextResponse.json({ success: true, message: 'Settings updated' });
        } catch (error) {
            console.error('Settings update error:', error);
            return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
        }
    });
}
