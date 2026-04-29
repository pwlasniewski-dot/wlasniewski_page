import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const amount = request.nextUrl.searchParams.get('amount');

        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
        }

        const challenge = await prisma.photoChallenge.findUnique({
            where: { id },
            include: { package: true }
        });

        if (!challenge) {
            return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
        }

        // Mock payment processing:
        // In a real scenario, this would redirect to P24/PayU and then a callback would update the status.
        // For now, we simulate success and update the challenge status.

        await prisma.$transaction([
            // Update challenge status
            prisma.photoChallenge.update({
                where: { id },
                data: {
                    status: 'sent',
                    payment_status: 'paid',
                    payment_id: `SIMULATED_${Date.now()}`,
                    payment_method: 'P24_SIMULATED'
                } as any
            }),
            // Update related booking status if it exists
            prisma.booking.updateMany({
                where: { challenge_id: id },
                data: { status: 'confirmed' }
            })
        ]);

        // Send invitation email AFTER successful payment
        try {
            const { sendEmail } = await import('@/lib/email/sender');
            const { getSiteUrl } = await import('@/lib/site-url');
            const { createMagicLinkToken } = await import('@/lib/photo-challenge/magic-link');
            const baseUrl = getSiteUrl();
            const inviteLink = `${baseUrl}/foto-wyzwanie/invite/${challenge.unique_link}`;

            // Inviter — magic link 1-klik do /konto (bez konieczności pamiętania hasła).
            // Fallback na /logowanie jeśli z jakiegoś powodu nie ma user_id zapraszającego.
            let loginLink = `${baseUrl}/logowanie`;
            const inviterUserId = (challenge as any).inviter_user_id as number | null;
            if (inviterUserId && challenge.inviter_email) {
                const magicToken = await createMagicLinkToken({
                    userId: inviterUserId,
                    email: challenge.inviter_email,
                    challengeId: challenge.id,
                    ttl: '60d',
                });
                loginLink = `${baseUrl}/foto-wyzwanie/wejdz?token=${encodeURIComponent(magicToken)}`;
            }

            // 1. Send to Invitee
            await sendEmail({
                to: challenge.invitee_contact,
                subject: `🎉 ${challenge.inviter_name} zaprasza Cię do Foto Wyzwania!`,
                template: 'challenge-invitation',
                data: {
                    inviterName: challenge.inviter_name,
                    inviteeName: challenge.invitee_name,
                    packageName: challenge.package.name,
                    packagePrice: challenge.package.challenge_price,
                    packageDescription: challenge.package.description || '',
                    inviterPhone: challenge.inviter_contact,
                    inviteLink
                }
            });

            // 2. Send to Inviter (Confirmation)
            if (challenge.inviter_email) {
                await sendEmail({
                    to: challenge.inviter_email,
                    subject: `✅ Potwierdzenie płatności za Foto Wyzwanie`,
                    template: 'challenge-payment-confirmed-inviter',
                    data: {
                        inviterName: challenge.inviter_name,
                        inviteeName: challenge.invitee_name,
                        packageName: challenge.package.name,
                        inviteLink,
                        loginLink
                    }
                });
            }

            // 3. Notify Admin (fotograf) o nowym opłaconym wyzwaniu
            try {
                const { getAdminEmail } = await import('@/lib/email/sender');
                const adminEmail = await getAdminEmail();
                if (adminEmail) {
                    const adminLink = `${baseUrl}/admin/challenges/${challenge.id}`;
                    await sendEmail({
                        to: adminEmail,
                        subject: `🔔 Nowe Foto Wyzwanie opłacone — ${challenge.inviter_name} → ${challenge.invitee_name}`,
                        text: [
                            `Nowe Foto Wyzwanie zostało opłacone i czeka na akceptację zaproszonego.`,
                            ``,
                            `Zapraszający: ${challenge.inviter_name} (${challenge.inviter_email || challenge.inviter_contact})`,
                            `Zaproszony: ${challenge.invitee_name} (${challenge.invitee_contact})`,
                            `Pakiet: ${challenge.package.name} — ${challenge.package.challenge_price} zł`,
                            ``,
                            `Panel admina: ${adminLink}`,
                        ].join('\n'),
                    });
                }
            } catch (adminEmailError) {
                console.error('Failed to send admin notification:', adminEmailError);
            }
        } catch (emailError) {
            console.error('Failed to send emails after payment:', emailError);
        }

        // Redirect to a success page
        const { getSiteUrl: _getSiteUrl } = await import('@/lib/site-url');
        const baseUrl = _getSiteUrl();
        return NextResponse.redirect(`${baseUrl}/foto-wyzwanie/success?id=${challenge.unique_link}`);

    } catch (error) {
        console.error('Payment error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
