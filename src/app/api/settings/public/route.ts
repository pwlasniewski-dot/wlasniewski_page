import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });

        if (!settings) {
            return NextResponse.json({ success: true, settings: {} });
        }

        const [promoCode, promoExpiry, b2bFooterConfig, footerConfig, challenge] = await Promise.all([
            getSetting('promo_code'),
            getSetting('promo_code_expiry'),
            getSetting('b2b_footer_config'),
            getSetting('footer_config'),
            getChallengeSettings(),
        ]);

        // Only return public settings
        const publicSettings = {
            navbar_layout: settings.navbar_layout,
            navbar_sticky: settings.navbar_sticky,
            navbar_transparent: settings.navbar_transparent,
            navbar_font_size: settings.navbar_font_size,
            navbar_font_family: settings.navbar_font_family,
            p24_pos_id: settings.p24_pos_id,
            p24_test_mode: settings.p24_test_mode,
            favicon_url: settings.favicon_url,
            logo_url: settings.logo_url,
            logo_dark_url: settings.logo_dark_url,
            logo_size: settings.logo_size || 140,
            about_me_portrait: settings.about_me_portrait,
            // Seasonal Effects
            seasonal_effect: settings.seasonal_effect || 'none',
            // Urgency
            urgency_enabled: settings.urgency_enabled,
            urgency_slots_remaining: settings.urgency_slots_remaining,
            urgency_month: settings.urgency_month,
            // SEO (needed for layout/head injection mostly, but maybe helpful client side?)
            google_analytics_id: settings.google_analytics_id,
            facebook_pixel_id: settings.facebook_pixel_id,
            // Gift Card
            gift_card_promo_enabled: settings.gift_card_promo_enabled,
            gift_card_promo_title: settings.gift_card_promo_title,
            gift_card_promo_description: settings.gift_card_promo_description,
            gift_card_hero_image: settings.gift_card_hero_image,
            gift_card_promo_rotation_interval: settings.gift_card_promo_rotation_interval,
            // Promo Code
            promo_code_discount_enabled: settings.promo_code_discount_enabled,
            promo_code_discount_amount: settings.promo_code_discount_amount,
            promo_code_discount_type: settings.promo_code_discount_type,
            promo_code: promoCode,
            promo_code_expiry: promoExpiry,
            promo_code_expiry_date: promoExpiry,
            // Social Proof
            social_proof_enabled: settings.social_proof_enabled,
            social_proof_total_clients: settings.social_proof_total_clients,
            // B2B Branding
            b2b_footer_config: b2bFooterConfig,
            footer_config: footerConfig,
            // Photo Challenge
            challenge,
            // Split payment (zaliczka + dopłata)
            split_payment_enabled: settings.split_payment_enabled ?? false,
            split_payment_deposit_percent: settings.split_payment_deposit_percent ?? 50,
            split_payment_remaining_due_days: settings.split_payment_remaining_due_days ?? 7,
        };

        return NextResponse.json({ success: true, settings: publicSettings });
    } catch (error) {
        console.error('Failed to fetch public settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

async function getSetting(key: string) {
    const setting = await prisma.setting.findUnique({
        where: { setting_key: key }
    });
    return setting?.setting_value;
}

async function getChallengeSettings() {
    const enabled = await prisma.challengeSetting.findUnique({ where: { setting_key: 'module_enabled' } });
    const fomo = await prisma.challengeSetting.findUnique({ where: { setting_key: 'fomo_countdown_hours' } });
    return {
        module_enabled: enabled?.setting_value === 'true',
        fomo_hours: fomo?.setting_value ? Number(fomo.setting_value) : 24
    };
}
