// API Route: GET/PUT /api/photo-challenge/[uniqueLink]
// Pobiera szczegóły wyzwania i akceptuje/odrzuca wyzwanie

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hashPassword, generateToken } from '@/lib/auth/jwt';
import { sendEmail } from '@/lib/email';
import { generateChallengeAcceptedEmail } from '@/lib/email-templates';

// GET - Pobierz szczegóły wyzwania
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ uniqueLink: string }> }
) {
    try {
        const { uniqueLink } = await params;

        // Pobierz wyzwanie z relacjami
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link: uniqueLink },
            include: {
                package: true,
                location: true,
            },
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: 'Wyzwanie nie znalezione' },
                { status: 404 }
            );
        }

        // Jeśli status to 'sent' i nie ma viewed_at, zapisz 'viewed'
        if (challenge.status === 'sent' && !challenge.viewed_at) {
            await prisma.$transaction([
                prisma.photoChallenge.update({
                    where: { id: challenge.id },
                    data: {
                        status: 'viewed',
                        viewed_at: new Date(),
                    },
                }),
                prisma.challengeTimelineEvent.create({
                    data: {
                        challenge_id: challenge.id,
                        event_type: 'viewed',
                        event_description: 'Wyzwanie wyświetlone przez zaproszoną osobę',
                    },
                }),
            ]);
            challenge.status = 'viewed';
            challenge.viewed_at = new Date();
        }

        // Sprawdź czy nie wygasło
        if (challenge.acceptance_deadline && new Date(challenge.acceptance_deadline) < new Date()) {
            if (!['accepted', 'rejected', 'completed', 'expired'].includes(challenge.status)) {
                await prisma.photoChallenge.update({
                    where: { id: challenge.id },
                    data: { status: 'expired' },
                });
                challenge.status = 'expired';
            }
        }

        // Parse JSON fields
        const safePackage = challenge.package ? {
            ...challenge.package,
            included_items: (() => {
                try { return challenge.package.included_items ? JSON.parse(challenge.package.included_items) : []; } catch (e) { return []; }
            })()
        } : null;

        const responseChallenge = {
            ...challenge,
            package: safePackage,
            preferred_dates: (() => {
                try { return challenge.preferred_dates ? JSON.parse(challenge.preferred_dates) : []; } catch (e) { return []; }
            })(),
        };

        return NextResponse.json({
            success: true,
            challenge: responseChallenge,
        });
    } catch (error) {
        console.error('Error fetching challenge:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się pobrać wyzwania' },
            { status: 500 }
        );
    }
}

// PUT - Akceptuj lub odrzuć wyzwanie
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ uniqueLink: string }> }
) {
    try {
        const { uniqueLink } = await params;
        const body = await request.json();
        const { action, selected_date, auth_mode, email, password, name } = body;

        if (!action || !['accept', 'reject'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Nieprawidłowa akcja' }, { status: 400 });
        }

        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link: uniqueLink },
            include: { package: true }
        });

        if (!challenge) {
            return NextResponse.json({ success: false, error: 'Wyzwanie nie znalezione' }, { status: 404 });
        }

        if (['accepted', 'rejected', 'completed'].includes(challenge.status)) {
            return NextResponse.json({ success: false, error: 'Wyzwanie zostało już zakończone' }, { status: 400 });
        }

        if (action === 'accept') {
            // Handle Auth (Create Invitee User)
            let userId: number;

            if (auth_mode === 'register') {
                if (!email || !password || !name) {
                    return NextResponse.json({ success: false, error: 'Brak danych do rejestracji' }, { status: 400 });
                }
                const existing = await prisma.challengeUser.findUnique({ where: { email } });
                if (existing) {
                    return NextResponse.json({ success: false, error: 'Konto o tym emailu już istnieje. Zaloguj się.' }, { status: 400 });
                }
                const hashedPassword = await hashPassword(password);
                const newUser = await prisma.challengeUser.create({
                    data: {
                        email,
                        name,
                        password_hash: hashedPassword,
                        auth_provider: 'email',
                        created_at: new Date()
                    }
                });
                userId = newUser.id;
            } else {
                // Login
                if (!email) {
                    return NextResponse.json({ success: false, error: 'Brak emaila' }, { status: 400 });
                }
                const user = await prisma.challengeUser.findUnique({ where: { email } });
                if (!user) {
                    return NextResponse.json({ success: false, error: 'Użytkownik nie istnieje' }, { status: 404 });
                }
                userId = user.id;
            }

            // Update Challenge
            await prisma.$transaction([
                prisma.photoChallenge.update({
                    where: { id: challenge.id },
                    data: {
                        status: 'accepted',
                        accepted_at: new Date(),
                        invitee_user_id: userId,
                        session_date: selected_date ? new Date(selected_date) : null,
                    },
                }),
                prisma.challengeTimelineEvent.create({
                    data: {
                        challenge_id: challenge.id,
                        event_type: 'accepted',
                        event_description: `Wyzwanie zaakceptowane przez ${challenge.invitee_name}. Wybrany termin: ${selected_date}`,
                    },
                }),
            ]);

            // Email to Inviter
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
            const acceptedHtml = generateChallengeAcceptedEmail({
                inviterName: challenge.inviter_name,
                inviteeName: challenge.invitee_name,
                link: `${baseUrl}/foto-wyzwanie/status/${challenge.id}`,
                packageName: challenge.package?.name || ''
            });

            // Use inviter_contact as email
            await sendEmail({
                to: challenge.inviter_contact,
                subject: `Wyzwanie zaakceptowane przez ${challenge.invitee_name}! 🎉`,
                html: acceptedHtml
            });

            // Return Token for Invitee
            const token = await generateToken({ id: userId, email });

            return NextResponse.json({
                success: true,
                message: 'Wyzwanie zaakceptowane!',
                token
            });
        } else {
            // Reject logic remains simple
            await prisma.$transaction([
                prisma.photoChallenge.update({
                    where: { id: challenge.id },
                    data: { status: 'rejected', rejected_at: new Date() },
                }),
                prisma.challengeTimelineEvent.create({
                    data: {
                        challenge_id: challenge.id,
                        event_type: 'rejected',
                        event_description: 'Wyzwanie odrzucone',
                    },
                }),
            ]);
            return NextResponse.json({ success: true, message: 'Wyzwanie odrzucone' });
        }

    } catch (error) {
        console.error('Error updating challenge:', error);
        return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
    }
}
