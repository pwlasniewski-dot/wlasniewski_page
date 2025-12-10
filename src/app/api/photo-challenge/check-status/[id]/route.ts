import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const challengeId = parseInt(id);

        if (isNaN(challengeId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const challenge = await prisma.photoChallenge.findUnique({
            where: { id: challengeId },
            include: {
                package: {
                    select: {
                        name: true,
                        base_price: true,
                        challenge_price: true,
                    }
                },
                location: {
                    select: {
                        name: true,
                    }
                },
            },
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: 'Wyzwanie nie znalezione' },
                { status: 404 }
            );
        }

        // Return only safe data
        const safeChallenge = {
            id: challenge.id,
            unique_link: challenge.unique_link,
            inviter_name: challenge.inviter_name,
            invitee_name: challenge.invitee_name,
            status: challenge.status,
            acceptance_deadline: challenge.acceptance_deadline,
            session_date: challenge.session_date,
            package: challenge.package,
            location: challenge.location,
            custom_location: challenge.custom_location,
            discount_amount: challenge.discount_amount,
            discount_percentage: challenge.discount_percentage,
        };

        return NextResponse.json({
            success: true,
            challenge: safeChallenge,
        });
    } catch (error) {
        console.error('Error fetching challenge status:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się pobrać statusu' },
            { status: 500 }
        );
    }
}
