import AnalyticsIntegration from './AnalyticsIntegration';
import prisma from '@/lib/db/prisma';

export default async function AnalyticsLoader() {
    // Skip database access during build time
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
        return null;
    }

    try {
        const settings = await prisma.setting.findMany({
            where: {
                setting_key: {
                    in: ['google_analytics_id', 'google_tag_manager_id', 'facebook_pixel_id']
                }
            }
        });

        const analyticsSettings = settings.reduce((acc, curr) => {
            acc[curr.setting_key] = curr.setting_value;
            return acc;
        }, {} as Record<string, string | null>);

        return (
            <AnalyticsIntegration
                googleAnalyticsId={analyticsSettings.google_analytics_id || undefined}
                googleTagManagerId={analyticsSettings.google_tag_manager_id || undefined}
                facebookPixelId={analyticsSettings.facebook_pixel_id || undefined}
            />
        );
    } catch (error) {
        console.error('Failed to load analytics settings:', error);
        return null;
    }
}
