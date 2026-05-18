// API Route: POST /api/admin/galleries/[id]/participants/bulk
// Bulk create participants for group galleries (e.g., create 60 kids at once)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import crypto from 'crypto';

function generateParticipantCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const galleryId = Number(id);
            const { count, name_prefix, max_selections } = await request.json();

            if (!count || count < 1 || count > 100) {
                return NextResponse.json(
                    { error: 'Liczba uczestników musi być między 1 a 100' },
                    { status: 400 }
                );
            }

            const participants = [];
            const usedCodes = new Set<string>();

            // Generate unique codes
            for (let i = 1; i <= count; i++) {
                let code: string;
                do {
                    code = generateParticipantCode();
                } while (usedCodes.has(code));
                
                usedCodes.add(code);

                participants.push({
                    gallery_id: galleryId,
                    name: `${name_prefix || 'Uczestnik'} ${i}`,
                    participant_code: code,
                    max_selections: max_selections || 5,
                });
            }

            // Check for existing codes in database
            const existingCodes = await prisma.galleryParticipant.findMany({
                where: {
                    participant_code: {
                        in: Array.from(usedCodes)
                    }
                },
                select: { participant_code: true }
            });

            if (existingCodes.length > 0) {
                return NextResponse.json(
                    { error: 'Wystąpił konflikt kodów dostępu. Spróbuj ponownie.' },
                    { status: 409 }
                );
            }

            // Bulk insert
            await prisma.galleryParticipant.createMany({
                data: participants
            });

            return NextResponse.json({
                success: true,
                message: `Dodano ${count} uczestników`,
                count,
            });

        } catch (error) {
            console.error('Error bulk creating participants:', error);
            return NextResponse.json(
                { error: 'Błąd dodawania uczestników' },
                { status: 500 }
            );
        }
    });
}
