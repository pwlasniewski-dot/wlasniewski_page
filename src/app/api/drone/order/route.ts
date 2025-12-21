
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { client_name, company_name, email, phone, service_type, details } = body;

        const order = await prisma.droneOrder.create({
            data: {
                client_name,
                company_name,
                email,
                phone: phone || '',
                service_type,
                details: details || '',
                status: 'NEW'
            }
        });

        // Optional: Trigger email notification here

        return NextResponse.json({ success: true, id: order.id });
    } catch (error) {
        console.error('Drone Order API error:', error);
        return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 });
    }
}
