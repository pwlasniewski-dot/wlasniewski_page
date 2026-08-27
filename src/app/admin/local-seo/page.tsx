import prisma from '@/lib/db/prisma';
import LocalSeoClient from './LocalSeoClient';

export const dynamic = 'force-dynamic';

async function getData() {
    // Settings related to Local SEO / Google Business Profile
    const settings = await prisma.setting.findMany({
        where: {
            setting_key: {
                in: [
                    'google_place_id',
                    'gbp_review_link',
                    'gbp_profile_url',
                    'gbp_categories',
                    'gbp_last_post_at',
                    'business_phone',
                    'business_address',
                    'business_name',
                ],
            },
        },
    });

    const settingMap: Record<string, string> = {};
    for (const s of settings) {
        if (s.setting_value) settingMap[s.setting_key] = s.setting_value;
    }

    // Recent completed bookings without review request log
    const completedBookings = await prisma.booking.findMany({
        where: { status: 'completed' },
        orderBy: { updated_at: 'desc' },
        take: 20,
        select: {
            id: true,
            client_name: true,
            email: true,
            service: true,
            date: true,
            updated_at: true,
            client_rating: true,
            client_review: true,
        },
    });

    // Citations directories status (stored as JSON in setting)
    const citationsSetting = await prisma.setting.findFirst({
        where: { setting_key: 'gbp_citations_status' },
    });
    let citations: { name: string; url: string; done: boolean }[] = [];
    if (citationsSetting?.setting_value) {
        try {
            citations = JSON.parse(citationsSetting.setting_value);
        } catch {
            citations = [];
        }
    }

    return { settingMap, completedBookings, citations };
}

export default async function LocalSeoPage() {
    const { settingMap, completedBookings, citations } = await getData();
    return (
        <LocalSeoClient
            initialSettings={settingMap}
            completedBookings={completedBookings.map(b => ({
                ...b,
                date: b.date.toISOString(),
                updated_at: b.updated_at.toISOString(),
            }))}
            initialCitations={citations}
        />
    );
}
