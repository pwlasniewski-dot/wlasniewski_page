import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: Request) {
    try {
        // Note: Authentication is handled by Middleware for /admin routes
        const subscribers = await prisma.subscriber.findMany({
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json(subscribers);
    } catch (error) {
        console.error('Admin Subscribers API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
