import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const challenges = await prisma.photoChallenge.findMany({
                orderBy: { created_at: 'desc' },
                include: {
                    package: {
                        select: {
                            name: true,
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

            return NextResponse.json({
                success: true,
                challenges,
            });
        } catch (error) {
            console.error('Error fetching challenges list:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się pobrać listy wyzwań' },
                { status: 500 }
            );
        }
    });
}
