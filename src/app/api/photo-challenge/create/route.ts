// API Route: POST /api/photo-challenge/create
// Tworzy nowe wyzwanie z obsługą konta i płatności

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma'; // Use default export
import { generateUniqueLink, generateShareableUrl } from '@/lib/photo-challenge/link-generator';
import { getSetting, getAcceptanceDeadline } from '@/lib/photo-challenge/settings';
import { hashPassword, generateToken } from '@/lib/auth/jwt';
import { sendEmail } from '@/lib/email/sender';
import { generateChallengeCreatedEmail, generateChallengeInviteEmail } from '@/lib/email-templates';
import { logSystem } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 1. Validate Basic Fields
        if (!body.package_id || !body.inviter_name || !body.invitee_name || !body.inviter_email) {
            await logSystem('WARN', 'CHALLENGE', 'Create Challenge: Missing fields', body);
            return NextResponse.json(
                { success: false, error: 'Brakujące wymagane pola' },
                { status: 400 }
            );
        }

        // 2. Handle User (Inviter)
        let inviterUser;

        if (body.auth_mode === 'register') {
            // Check if exists
            const existing = await prisma.challengeUser.findUnique({ where: { email: body.inviter_email } });
            if (existing) {
                await logSystem('WARN', 'AUTH', 'Create Challenge: User exists', { email: body.inviter_email });
                return NextResponse.json({ success: false, error: 'Użytkownik z tym emailem już istnieje. Zaloguj się.' }, { status: 400 });
            }

            const hashedPassword = await hashPassword(body.inviter_password || 'temp1234'); // Fallback if missing
            inviterUser = await prisma.challengeUser.create({
                data: {
                    email: body.inviter_email,
                    name: body.inviter_name,
                    phone: body.inviter_phone,
                    password_hash: hashedPassword,
                    auth_provider: 'email',
                    created_at: new Date(),
                }
            });
            await logSystem('INFO', 'AUTH', `New Challenge User Registered: ${inviterUser.email}`, { userId: inviterUser.id });
        } else {
            inviterUser = await prisma.challengeUser.findUnique({ where: { email: body.inviter_email } });
            if (!inviterUser) {
                await logSystem('WARN', 'AUTH', 'Create Challenge: Login failed, user not found', { email: body.inviter_email });
                return NextResponse.json({ success: false, error: 'Użytkownik nie istnieje.' }, { status: 404 });
            }
        }

        // 3. Get Package & Calculate
        const pkg = await prisma.challengePackage.findUnique({ where: { id: body.package_id } });
        if (!pkg) return NextResponse.json({ success: false, error: 'Pakiet nie istnieje' }, { status: 400 });

        const discountAmount = pkg.base_price - pkg.challenge_price;
        const uniqueLink = generateUniqueLink();
        const hours = await getSetting('fomo_countdown_hours', 24);
        const deadline = await getAcceptanceDeadline(hours);

        // 4. Create Challenge
        const newChallenge = await prisma.photoChallenge.create({
            data: {
                unique_link: uniqueLink,

                // Inviter Info
                inviter_name: body.inviter_name,
                inviter_contact: body.inviter_email,
                inviter_contact_type: 'email',
                admin_notes: `Inviter User ID: ${inviterUser.id}`,

                // Invitee Info
                invitee_name: body.invitee_name,
                invitee_contact: body.invitee_email,
                invitee_contact_type: 'email',

                // Details
                package_id: body.package_id,
                location_id: body.location_id || null,
                custom_location: body.custom_location,

                discount_amount: discountAmount,
                discount_percentage: pkg.discount_percentage,

                status: 'sent', // Initially sent
                acceptance_deadline: deadline,

                // Dates
                preferred_dates: JSON.stringify(body.preferred_dates || []),
            }
        });

        await logSystem('INFO', 'CHALLENGE', `Challenge Created: #${newChallenge.id} by ${body.inviter_name}`, { challengeId: newChallenge.id });

        // 6. Send Emails
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
        const challengeLink = `${baseUrl}/foto-wyzwanie/akceptuj/${uniqueLink}`;

        try {
            // Email 1: To Invitee
            const inviteHtml = generateChallengeInviteEmail({
                inviterName: body.inviter_name,
                inviteeName: body.invitee_name,
                link: challengeLink,
                packageName: pkg.name
            });
            await sendEmail({ to: body.invitee_email, subject: `Foto Wyzwanie od ${body.inviter_name}!`, html: inviteHtml });
            await logSystem('INFO', 'EMAIL', `Challenge Invite sent to ${body.invitee_email}`, { challengeId: newChallenge.id });

            // Email 2: To Inviter
            const createdHtml = generateChallengeCreatedEmail({
                inviterName: body.inviter_name,
                inviteeName: body.invitee_name,
                link: `${baseUrl}/foto-wyzwanie/status/${newChallenge.id}`, // Status link
                packageName: pkg.name,
                dates: body.preferred_dates
            });
            await sendEmail({ to: body.inviter_email, subject: 'Twoje wyzwanie zostało utworzone!', html: createdHtml });
        } catch (emailErr) {
            await logSystem('ERROR', 'EMAIL', `Failed to send challenge emails`, { challengeId: newChallenge.id, error: String(emailErr) });
            // Don't fail the request, just log
        }

        // 7. Generate Token for Inviter auto-login
        const token = await generateToken({ id: inviterUser.id, email: inviterUser.email });

        return NextResponse.json({
            success: true,
            unique_link: uniqueLink,
            challenge_id: newChallenge.id,
            token: token // Send back for auto-login
        });

    } catch (error) {
        console.error('Error creating challenge:', error);
        await logSystem('ERROR', 'CHALLENGE', 'Error creating challenge (Server Error)', { error: String(error) });
        return NextResponse.json(
            { success: false, error: 'Błąd serwera' },
            { status: 500 }
        );
    }
}
