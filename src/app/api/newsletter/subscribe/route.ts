import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const subscriberSchema = z.object({
    email: z.string().email('Nieprawidłowy adres email'),
    source: z.string().optional().default('website'),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate input
        const result = subscriberSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation Error', details: result.error.errors },
                { status: 400 }
            );
        }

        const { email, source } = result.data;

        // Check if email exists
        const existing = await prisma.subscriber.findUnique({
            where: { email },
        });

        if (existing) {
            if (!existing.is_active) {
                // Reactivate
                const updated = await prisma.subscriber.update({
                    where: { email },
                    data: { is_active: true, source },
                });
                return NextResponse.json({ message: 'Subskrypcja przywrócona', subscriber: updated });
            }

            return NextResponse.json(
                { message: 'Ten email jest już zasubskrybowany' },
                { status: 409 }
            );
        }

        // Create new
        const newSubscriber = await prisma.subscriber.create({
            data: {
                email,
                source,
            },
        });

        return NextResponse.json(
            { message: 'Dziękujemy za subskrypcję!', subscriber: newSubscriber },
            { status: 201 }
        );

    } catch (error) {
        console.error('Newsletter API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
