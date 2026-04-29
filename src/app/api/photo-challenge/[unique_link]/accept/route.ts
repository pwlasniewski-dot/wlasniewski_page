import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { generateVoucherPdfBuffer, generateIcs } from '@/lib/photo-challenge/voucher';
import { deriveShortCode } from '@/lib/photo-challenge/short-code';
import { getSiteUrl } from '@/lib/site-url';
import { createMagicLinkToken } from '@/lib/photo-challenge/magic-link';
import { verifyAcceptToken } from '@/lib/photo-challenge/accept-token';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ unique_link: string }> }
) {
    try {
        const { unique_link } = await params;
        const body = await request.json();
        const { name, date, hour, t: bodyToken } = body;

        // Token może przyjść w body lub w nagłówku x-challenge-token
        const headerToken = request.headers.get('x-challenge-token');
        const acceptToken = bodyToken || headerToken;

        if (!date || hour === null) {
            return NextResponse.json(
                { success: false, error: 'Missing date or hour' },
                { status: 400 }
            );
        }

        // Fetch challenge
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link },
            include: { package: true, location: true }
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        // Token akceptacji jest opcjonalny — jeśli przyszedł z osobistego maila,
        // weryfikujemy go (i sprawdzamy challengeId), ale brak tokenu nie blokuje akceptacji.
        if (acceptToken) {
            const payload = await verifyAcceptToken(acceptToken);
            if (!payload || payload.challengeId !== challenge.id) {
                return NextResponse.json(
                    { success: false, error: 'INVALID_INVITEE_TOKEN', message: 'Link akceptacji nieprawidłowy lub wygasł.' },
                    { status: 401 }
                );
            }
        }

        // Check if a booking already exists for this challenge
        const existingBooking = await prisma.booking.findFirst({
            where: { challenge_id: challenge.id }
        });

        const startTimeText = `${String(hour).padStart(2, '0')}:00`;
        const endTimeText = `${String(hour + 1).padStart(2, '0')}:00`;
        const sessionDate = new Date(`${date}T00:00:00.000Z`);

        let booking;
        if (existingBooking) {
            // Update existing booking
            booking = await prisma.booking.update({
                where: { id: existingBooking.id },
                data: {
                    date: sessionDate,
                    start_time: startTimeText,
                    end_time: endTimeText,
                    client_name: name,
                    status: 'confirmed'
                }
            });
        } else {
            // Create new booking (fallback)
            booking = await prisma.booking.create({
                data: {
                    service: 'Foto-wyzwanie',
                    package: challenge.package?.name || 'Challenge',
                    price: challenge.package?.challenge_price || 0,
                    date: sessionDate,
                    start_time: startTimeText,
                    end_time: endTimeText,
                    client_name: name,
                    email: challenge.invitee_contact,
                    phone: challenge.inviter_contact, // Use inviter phone for contact
                    status: 'confirmed',
                    challenge_id: challenge.id
                }
            });
        }

        // Create or find User (CRM) for the invitee — unified user table
        let userId = challenge.invitee_user_id;
        if (!userId) {
            const bcrypt = (await import('bcryptjs')).default;
            const crypto = await import('crypto');
            // Hasło: jeśli istnieje, zostaw; jeśli nie, ustaw losowe (klient i tak loguje się magic-linkiem).
            const existing = await prisma.user.findUnique({ where: { email: challenge.invitee_contact } });
            if (existing) {
                if (name && existing.name !== name) {
                    await prisma.user.update({ where: { id: existing.id }, data: { name } });
                }
                userId = existing.id;
            } else {
                const randomPwd = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
                const created = await prisma.user.create({
                    data: {
                        email: challenge.invitee_contact,
                        password_hash: randomPwd,
                        name,
                        phone: challenge.inviter_contact,
                        role: 'CLIENT',
                        is_active: true,
                    },
                });
                userId = created.id;
            }
        }

        // Update challenge status and link user
        await prisma.photoChallenge.update({
            where: { unique_link },
            data: {
                status: 'accepted',
                accepted_at: new Date(),
                session_date: sessionDate,
                invitee_user_id: userId
            } as any
        });

        // Send confirmation email to invitee
        // Send confirmation e-mails
        const baseUrl = getSiteUrl();
        // Magic-link: pozwala zaproszonemu zalogować się 1-klikiem do panelu (bez hasła).
        const magicToken = await createMagicLinkToken({ userId: userId!, email: challenge.invitee_contact, challengeId: challenge.id, ttl: '60d' });
        const magicLoginLink = `${baseUrl}/foto-wyzwanie/wejdz?token=${encodeURIComponent(magicToken)}`;
        const galleryLink = `${baseUrl}/foto-wyzwanie/gallery/${challenge.id}`;
        const formattedDate = sessionDate.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const locationName = challenge.location?.name || challenge.custom_location || 'Będzie podane wkrótce';
        const shortCode = deriveShortCode(challenge.unique_link);

        // Generate voucher PDF + ICS attachments (best-effort; do NOT block accept on failure)
        let attachments: any[] | undefined;
        try {
            const challengeFull = await prisma.photoChallenge.findUnique({
                where: { unique_link },
                include: { package: true, location: true },
            });
            const bookingTimes = { date: sessionDate, start_time: startTimeText, end_time: endTimeText };
            if (challengeFull) {
                const [pdfBuffer, ics] = await Promise.all([
                    generateVoucherPdfBuffer(challengeFull, bookingTimes, baseUrl),
                    Promise.resolve(generateIcs(challengeFull, bookingTimes, baseUrl)),
                ]);
                attachments = [
                    {
                        filename: `voucher-foto-wyzwanie-${shortCode}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    },
                ];
                if (ics) {
                    attachments.push({
                        filename: `foto-wyzwanie-${shortCode}.ics`,
                        content: ics,
                        contentType: 'text/calendar; charset=utf-8',
                    });
                }
            }
        } catch (attachErr) {
            console.error('[accept] voucher/ics generation failed (continuing without attachments):', attachErr);
        }

        // 1. Notify Invitee (the one who just accepted)
        try {
            await sendEmail({
                to: challenge.invitee_contact, // Assuming email is in contact
                subject: '✅ Wyzwanie zaakceptowane! Szczegóły sesji',
                template: 'challenge-accepted-invitee',
                data: {
                    inviteeName: name,
                    inviterName: challenge.inviter_name,
                    sessionDate: formattedDate,
                    sessionTime: startTimeText,
                    location: locationName,
                    galleryLink,
                    panelLink: magicLoginLink,
                },
                attachments,
            });
        } catch (emailError) {
            console.error('Failed to send acceptance email to invitee:', emailError);
        }

        // 2. Notify Inviter
        if (challenge.inviter_email) {
            try {
                const isDifferentDate = existingBooking && (
                    new Date(existingBooking.date).toISOString().split('T')[0] !== date ||
                    existingBooking.start_time !== startTimeText
                );

                await sendEmail({
                    to: challenge.inviter_email,
                    subject: isDifferentDate
                        ? `📅 ${name} zaakceptował(a) wyzwanie, ale wybrał(a) inny termin!`
                        : `🎉 ${name} właśnie zaakceptował(a) Twoje Foto Wyzwanie!`,
                    template: 'challenge-accepted-inviter',
                    data: {
                        inviterName: challenge.inviter_name,
                        inviteeName: name,
                        sessionDate: formattedDate,
                        sessionTime: startTimeText,
                        location: locationName,
                        isDifferentDate
                    }
                });
            } catch (inviterEmailError) {
                console.error('Failed to send notification email to inviter:', inviterEmailError);
            }
        }

        return NextResponse.json({
            success: true,
            booking_id: booking.id
        });
    } catch (error) {
        console.error('Error accepting challenge:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
