import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';
import { logSystem } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST: Send welcome email with password setup link
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const resolvedParams = await params;
            const clientId = parseInt(resolvedParams.id, 10);

            if (isNaN(clientId)) {
                return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
            }

            // Fetch client details
            const client = await prisma.user.findUnique({
                where: { id: clientId, role: 'CLIENT' }
            });

            if (!client) {
                return NextResponse.json({ error: 'Client not found' }, { status: 404 });
            }

            // Check if client already has a reset token or generate a new one
            let resetToken = client.reset_token;
            let resetTokenExpires = client.reset_token_expires;

            if (!resetToken || !resetTokenExpires || new Date(resetTokenExpires) < new Date()) {
                // Generate a new token if none exists or it's expired
                const { randomBytes } = await import('crypto');
                resetToken = randomBytes(32).toString('hex');
                resetTokenExpires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

                await prisma.user.update({
                    where: { id: clientId },
                    data: {
                        reset_token: resetToken,
                        reset_token_expires: resetTokenExpires,
                    }
                });
            }

            // Build the password-setup link
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
            const setupUrl = `${appUrl}/logowanie/ustaw-haslo?token=${resetToken}`;

            // Send welcome email with password setup link
            try {
                await sendEmail({
                    to: client.email,
                    subject: `Witaj ${client.name} w panelu klienta na stronie fotografa Przemka Właśniewskiego`,
                    template: 'welcome-client',
                    data: {
                        name: client.name,
                        email: client.email,
                        loginUrl: setupUrl,
                    }
                });

                await logSystem('INFO', 'SYSTEM', `Welcome email sent to client: ${client.name} (${client.email})`, { clientId });

                return NextResponse.json({ 
                    success: true, 
                    message: `Email powitalny wysłany do ${client.email}` 
                });
            } catch (emailError: any) {
                console.error('Failed to send welcome email:', emailError);
                await logSystem('ERROR', 'SYSTEM', 'Failed to send welcome email', { 
                    clientId, 
                    error: emailError.message 
                });
                return NextResponse.json({ 
                    error: 'Nie udało się wysłać emaila powitalnego' 
                }, { status: 500 });
            }
        } catch (error: any) {
            console.error('Send welcome email error:', error);
            await logSystem('ERROR', 'SYSTEM', 'Failed to send welcome email', { error: error.message });
            return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
        }
    });
}
