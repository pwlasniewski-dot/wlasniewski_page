import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET settings
// Keys that should NEVER be exposed to non-admin users
const SENSITIVE_KEYS = [
    'smtp_host',
    'smtp_port',
    'smtp_user',
    'smtp_password',
    'smtp_from',
    'admin_email',
    'p24_api_key',
    'p24_pos_id',
    'p24_merchant_id',
    'p24_crc_key',
    'payu_client_id',
    'payu_client_secret',
    'payu_merchant_pos_id',
    'payu_md5_key',
    'stripe_secret_key',
    'stripe_webhook_secret'
];

export async function GET(request: NextRequest) {
    try {
        // Public GET is allowed, but admin-only fields require real token validation.
        let isAdmin = false;
        const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const authError = await requireAuth(request);
            isAdmin = !authError;
        }

        // Ensure we always fetch the SAME 'first' record
        const settings = await prisma.setting.findMany({
            orderBy: { id: 'asc' }
        });

        // 1. Start with Key/Value pairs
        const settingsMap = settings.reduce((acc, curr) => {
            if (curr.setting_key) {
                if (!isAdmin && SENSITIVE_KEYS.includes(curr.setting_key)) {
                    return acc;
                }
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
                    // Smart Filtering: Skip sensitive keys for non-admins
                    if (!isAdmin && SENSITIVE_KEYS.includes(key)) {
                        return;
                    }

                    const val = (mainSettings as any)[key];
                    // Include ALL fields (even if null/empty), except excluded keys
                    settingsMap[key] = val;
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
            console.log('[API] Settings POST received body:', JSON.stringify(body, null, 2));

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
                'payu_client_id', 'payu_client_secret', 'payu_merchant_pos_id', 'payu_md5_key', 'payu_environment', 'payu_notify_url',
                // Booking Settings
                'booking_require_payment', 'booking_payment_method', 'booking_currency', 'booking_min_days_ahead',
                // Split payment (Foto-Match + standard)
                'split_payment_enabled', 'split_payment_deposit_percent', 'split_payment_remaining_due_days',
                // Bank account (zaliczki / przypomnienia)
                'bank_account_number', 'bank_account_holder', 'bank_name', 'bank_swift',
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
                // Gift Card Hero
                'gift_card_hero_image', 'gift_card_hero_opacity',
                // Portfolio
                'portfolio_categories',
                // Seasonal
                'seasonal_effect',
                'portfolio_layout',
                // B2B Analytics (aeroanaliza.pl)
                'b2b_google_analytics_id',
                'b2b_google_tag_manager_id',
                'b2b_facebook_pixel_id'
            ];

            const columnUpdates: Record<string, any> = {};
            const kvUpdates: Record<string, string> = {};

            // Map of boolean fields that need type conversion
            const booleanFields = [
                'navbar_sticky', 'navbar_transparent',
                'urgency_enabled', 'promo_code_discount_enabled',
                'gift_card_promo_enabled', 'p24_test_mode',
                'p24_method_blik', 'p24_method_card', 'p24_method_transfer',
                'booking_require_payment', 'social_proof_enabled',
                'split_payment_enabled'
            ];

            // Map of numeric fields that need type conversion
            const numericFields = [
                'navbar_font_size', 'logo_size', 'smtp_port',
                'urgency_slots_remaining', 'social_proof_total_clients',
                'booking_min_days_ahead', 'gift_card_promo_rotation_interval',
                'gift_card_hero_opacity', 'promo_code_discount_amount',
                'split_payment_deposit_percent', 'split_payment_remaining_due_days'
            ];

            for (const [key, value] of Object.entries(body)) {
                // Legacy PayU keys -> map to DB columns
                if (key === 'payu_pos_id' || key === 'payu_merchant_pos_id') {
                    // Always use the non-empty value if both are present, 
                    // or prioritize payu_pos_id as it's the primary field in frontend state.
                    if (key === 'payu_pos_id' || !columnUpdates.payu_merchant_pos_id) {
                        columnUpdates.payu_merchant_pos_id = value;
                    }
                    continue;
                }

                if (key === 'payu_test_mode') {
                    // Handle boolean or string inputs robustly
                    const isSandbox = value === 'true' || value === true || value === '1' || value === 1;
                    columnUpdates.payu_environment = isSandbox ? 'sandbox' : 'secure';
                    continue;
                }

                if (key === 'payu_environment') {
                    // If payu_environment is sent directly, only set it if not already set by payu_test_mode
                    if (!columnUpdates.payu_environment) {
                        columnUpdates.payu_environment = value;
                    }
                    continue;
                }

                if (columnFields.includes(key)) {
                    // Convert string booleans to actual booleans
                    if (booleanFields.includes(key)) {
                        columnUpdates[key] = value === 'true' || value === true;
                    } else if (numericFields.includes(key)) {
                        // Convert to number, but handle empty strings
                        if (value === '' || value === null || value === undefined) {
                            columnUpdates[key] = null;
                        } else {
                            columnUpdates[key] = Number(value);
                        }
                    } else {
                        columnUpdates[key] = value;
                    }
                } else {
                    kvUpdates[key] = String(value);
                }
            }

            // ✅ FIX: Moved console.log OUTSIDE the for loop
            console.log('[API] Computed columnUpdates:', JSON.stringify(columnUpdates, null, 2));


            // 1. Update columns on the first record (or create if none)
            const firstSetting = await prisma.setting.findFirst({
                orderBy: { id: 'asc' }
            });

            try {
                if (firstSetting) {
                    const updated = await prisma.setting.update({
                        where: { id: firstSetting.id },
                        data: columnUpdates
                    });
                    console.log('[API] Settings updated successfully. Record ID:', updated.id);
                } else {
                    // Should not happen usually, but create if empty
                    const created = await prisma.setting.create({
                        data: {
                            setting_key: 'system_init',
                            setting_value: 'true',
                            ...columnUpdates
                        }
                    });
                    console.log('[API] Settings record created. ID:', created.id);
                }
            } catch (error: any) {
                console.error('[API] Failed to update settings in database:', error);
                return NextResponse.json({
                    success: false,
                    error: `Database update failed: ${error.message}`
                }, { status: 500 });
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

            // Ensure changes are visible immediately (ISR cache invalidation)
            // Revalidate everything since layout includes analytics, logo, etc.
            const { revalidatePath } = await import('next/cache');
            revalidatePath('/', 'layout');

            return NextResponse.json({ success: true, message: 'Settings updated' });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
        }
    });
}
