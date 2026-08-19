import { NextResponse } from 'next/server';
import { loadDronePhotographyCmsPage } from '@/lib/dronePhotographyCms';

export const dynamic = 'force-dynamic';

export async function GET() {
    const page = await loadDronePhotographyCmsPage();
    return NextResponse.json({
        packages: page.config.packages.filter(item => item.active !== false),
        areas: page.config.areas,
        booking: {
            goalLabel: page.config.booking.goalLabel,
            goalOptions: page.config.booking.goalOptions,
        },
    });
}
