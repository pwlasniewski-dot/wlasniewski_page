import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { normalizeGoogleBusinessProfileUrl, normalizeGoogleReviewUrl } from '@/lib/marketing/gallery-trust';
import { PHOTO_FUNNEL_SETTING_KEY, parsePhotoFunnelConfig } from '@/lib/marketing/photo-funnel';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });

        if (!settings) {
            return NextResponse.json({ success: true, settings: {} });
        }

        const now = new Date();
        const [publicPromoCandidates, reviewLink, profileLink, b2bFooterConfig, footerConfig, challenge, photoFunnelConfig] = await Promise.all([
            prisma.promoCode.findMany({
                where: {
                    is_active: true,
                    valid_from: { lte: now },
                    AND: [
                        { OR: [{ show_in_gallery: true }, { show_in_banner: true }] },
                        { OR: [{ valid_until: null }, { valid_until: { gte: now } }] },
                    ],
                },
                orderBy: { created_at: 'desc' },
                take: 10,
            }),
            getSetting('gbp_review_link'),
            getSetting('gbp_profile_url'),
            getSetting('b2b_footer_config'),
            getSetting('footer_config'),
            getChallengeSettings(),
            getSetting(PHOTO_FUNNEL_SETTING_KEY),
        ]);
        const availablePublicPromos = publicPromoCandidates.filter(code => code.max_usage === null || code.usage_count < code.max_usage);
        const galleryPromo = availablePublicPromos.find(code => code.show_in_gallery) || null;
        const bannerPromo = availablePublicPromos.find(code => code.show_in_banner) || null;

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
            // Publiczny banner i benefit galerii mają osobne przełączniki, ale
            // oba odczytują ten sam model PromoCode co rezerwacja i checkout.
            promo_code_discount_enabled: Boolean(bannerPromo),
            promo_code_discount_amount: bannerPromo?.discount_value ?? null,
            promo_code_discount_type: bannerPromo?.discount_type ?? null,
            promo_code: bannerPromo?.code ?? null,
            promo_code_expiry: bannerPromo?.valid_until?.toISOString() ?? null,
            promo_code_expiry_date: bannerPromo?.valid_until?.toISOString() ?? null,
            gallery_loyalty_offer: galleryPromo ? {
                code: galleryPromo.code,
                discountValue: galleryPromo.discount_value,
                discountType: galleryPromo.discount_type,
                validUntil: galleryPromo.valid_until?.toISOString() ?? null,
            } : null,
            // Link zapisany ręcznie w Local SEO. Nie budujemy go z Place ID ani z fallbacku.
            gbp_review_link: normalizeGoogleReviewUrl(reviewLink),
            gbp_profile_url: normalizeGoogleBusinessProfileUrl(profileLink),
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
            // Walidowany, publiczny odczyt jednego źródła treści lejka.
            photo_funnel_config: parsePhotoFunnelConfig(photoFunnelConfig),
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
