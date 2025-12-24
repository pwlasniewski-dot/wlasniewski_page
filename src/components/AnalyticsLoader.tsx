import AnalyticsIntegration from './AnalyticsIntegration';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AnalyticsLoader() {
    // Skip database access during build time
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
        return null;
    }

    try {
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });

        if (!settings) return null;

        return (
            <AnalyticsIntegration
                googleAnalyticsId={settings.google_analytics_id || undefined}
                googleTagManagerId={settings.google_tag_manager_id || undefined}
                facebookPixelId={settings.facebook_pixel_id || undefined}
            />
        );
    } catch (error) {
        console.error('Failed to load analytics settings:', error);
        return null;
    }
}
