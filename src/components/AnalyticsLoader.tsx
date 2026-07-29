import AnalyticsIntegration from './AnalyticsIntegration';
import prisma from '@/lib/db/prisma';
import { headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { isB2BContext } from '@/lib/context';

const getAnalyticsSettings = unstable_cache(
    () => prisma.setting.findFirst({
        orderBy: { id: 'asc' },
        select: {
            google_analytics_id: true,
            google_tag_manager_id: true,
            facebook_pixel_id: true,
            b2b_google_analytics_id: true,
            b2b_google_tag_manager_id: true,
            b2b_facebook_pixel_id: true,
        },
    }),
    ['public-analytics-settings'],
    { revalidate: 3600, tags: ['settings', 'analytics'] },
);

export default async function AnalyticsLoader() {
    // Skip database access during build time
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
        return null;
    }

    try {
        const headersList = await headers();
        const host = headersList.get('host') || '';
        const isB2B = isB2BContext({ hostname: host.split(':')[0] });

        const settings = await getAnalyticsSettings();

        if (!settings) return null;

        return (
            <AnalyticsIntegration
                googleAnalyticsId={settings.google_analytics_id || undefined}
                googleTagManagerId={settings.google_tag_manager_id || undefined}
                facebookPixelId={settings.facebook_pixel_id || undefined}
                b2bGoogleAnalyticsId={settings.b2b_google_analytics_id || undefined}
                b2bGoogleTagManagerId={settings.b2b_google_tag_manager_id || undefined}
                b2bFacebookPixelId={settings.b2b_facebook_pixel_id || undefined}
                isB2B={isB2B}
            />
        );
    } catch (error) {
        console.error('Failed to load analytics settings:', error);
        return null;
    }
}
