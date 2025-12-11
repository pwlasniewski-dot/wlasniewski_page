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

        // Only return public settings
        const publicSettings = {
            navbar_layout: (settings as any).navbar_layout,
            navbar_sticky: (settings as any).navbar_sticky,
            navbar_transparent: (settings as any).navbar_transparent,
            navbar_font_size: (settings as any).navbar_font_size,
            navbar_font_family: (settings as any).navbar_font_family,
            favicon_url: (settings as any).favicon_url,
            logo_url: (settings as any).logo_url,
            logo_dark_url: (settings as any).logo_dark_url,
            logo_size: (settings as any).logo_size || 140,
            // Seasonal Effects
            seasonal_effect: (settings as any).seasonal_effect || 'none',
            // Urgency
            urgency_enabled: await getSetting('urgency_enabled'),
            urgency_slots_remaining: await getSetting('urgency_slots_remaining'),
            urgency_month: await getSetting('urgency_month'),
            // SEO (needed for layout/head injection mostly, but maybe helpful client side?)
            google_analytics_id: await getSetting('google_analytics_id'),
            facebook_pixel_id: await getSetting('facebook_pixel_id'),
            // Photo Challenge
            challenge: await getChallengeSettings()
        };

        return NextResponse.json({ success: true, settings: publicSettings });
    } catch (error) {
        console.error('Failed to fetch public settings', error);
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
