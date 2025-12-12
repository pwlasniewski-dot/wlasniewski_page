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

            // Normalize legacy PayU fields
            const payuPosId = (mainSettings as any).payu_merchant_pos_id;
            if (payuPosId !== undefined) {
                settingsMap.payu_merchant_pos_id = payuPosId;
                settingsMap.payu_pos_id = payuPosId;
            }

            const payuEnvironment = (mainSettings as any).payu_environment;
            if (payuEnvironment !== undefined) {
                settingsMap.payu_environment = payuEnvironment;
                settingsMap.payu_test_mode = payuEnvironment === 'sandbox';
            }
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
                'navbar_layout', 'navbar_sticky', 'navbar_transparent',
                'navbar_font_size', 'navbar_font_family',
                // Logo & Favicon
                'favicon_url', 'logo_url', 'logo_dark_url', 'logo_size',
                // Payment Config
                'p24_merchant_id', 'p24_pos_id', 'p24_crc_key', 'p24_api_key',
                'p24_test_mode', 'p24_method_blik', 'p24_method_card', 'p24_method_transfer',
                // PayU Config (stored as merchant_pos_id/environment in DB)
                'payu_client_id', 'payu_client_secret', 'payu_merchant_pos_id', 'payu_environment',
                // Booking Settings
                'booking_require_payment', 'booking_payment_method', 'booking_currency', 'booking_min_days_ahead',
                // Email SMTP
                'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from',
                // SEO & Analytics
                'google_analytics_id', 'google_tag_manager_id', 'facebook_pixel_id',
                'meta_verification_google', 'meta_verification_facebook',
                // Urgency
                'urgency_enabled', 'urgency_slots_remaining', 'urgency_month',
                // Social Proof
                'social_proof_total_clients',
                // Promo Code
                'promo_code_discount_enabled', 'promo_code_discount_amount', 'promo_code_discount_type',
                // Gift Card Promo
                'gift_card_promo_enabled', 'gift_card_promo_title', 'gift_card_promo_description', 'gift_card_promo_rotation_interval',
                // Portfolio
                'portfolio_categories',
                // Seasonal
                'seasonal_effect'
            ];

            const columnUpdates: Record<string, any> = {};
            const kvUpdates: Record<string, string> = {};

            // Map of boolean fields that need type conversion
            const booleanFields = [
                'navbar_sticky', 'navbar_transparent',
                'urgency_enabled', 'promo_code_discount_enabled',
                'gift_card_promo_enabled', 'p24_test_mode',
                'p24_method_blik', 'p24_method_card', 'p24_method_transfer',
                'booking_require_payment'
            ];

            // Map of numeric fields that need type conversion
            const numericFields = [
                'navbar_font_size', 'logo_size',
                'smtp_port', 'booking_min_days_ahead',
                'promo_code_discount_amount', 'gift_card_promo_rotation_interval',
                'urgency_slots_remaining', 'social_proof_total_clients'
            ];

            for (const [key, value] of Object.entries(body)) {
                // Legacy PayU keys -> map to DB columns
                if (key === 'payu_pos_id') {
                    columnUpdates.payu_merchant_pos_id = value;
                    kvUpdates.payu_pos_id = String(value);
                    continue;
                }
                if (key === 'payu_test_mode') {
                    columnUpdates.payu_environment = value === 'true' || value === true ? 'sandbox' : 'secure';
                    kvUpdates.payu_test_mode = (value === 'true' || value === true).toString();
                    continue;
                }

                if (columnFields.includes(key)) {
                    // Convert string booleans to actual booleans
                    if (booleanFields.includes(key)) {
                        columnUpdates[key] = value === 'true' || value === true;
                    } else if (numericFields.includes(key)) {
                        // Convert to number, but skip invalid/empty inputs
                        if (value !== '' && value !== null && value !== undefined) {
                            const numericValue = Number(value);
                            if (!Number.isNaN(numericValue)) {
                                columnUpdates[key] = numericValue;
                            }
                        }
                    } else {
                        columnUpdates[key] = value;
                    }
                } else {
                    kvUpdates[key] = String(value);
                }
            }

            // 1. Update columns on the first record (or create if none)
            const firstSetting = await prisma.setting.findFirst({
                orderBy: { id: 'asc' }
            });

            if (firstSetting) {
                if (Object.keys(columnUpdates).length > 0) {
                    await prisma.setting.update({
                        where: { id: firstSetting.id },
                        data: columnUpdates
                    });
                }
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
