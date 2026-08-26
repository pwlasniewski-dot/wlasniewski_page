import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';
import { logSystem } from '@/lib/logger';
import { OWNER_EMAIL, buildPasswordSetupUrl, normalizeEmail } from '@/lib/crm/delivery';
import { ensurePasswordSetupToken } from '@/lib/auth/password-setup-token';
import { randomUUID } from 'node:crypto';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

export const dynamic = 'force-dynamic';

// POST: Send welcome email with password setup link
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        const correlationId = randomUUID();
        let incidentClientId: number | null = null;
        let incidentClientEmail: string | null = null;
        let phase = 'load_client';
        try {
            const resolvedParams = await params;
            const clientId = parseInt(resolvedParams.id, 10);
            incidentClientId = Number.isInteger(clientId) ? clientId : null;

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
            incidentClientEmail = normalizeEmail(client.email);
            if (!client.is_active || client.deleted_at) {
                return NextResponse.json({ error: 'Nie można wysłać dostępu do nieaktywnego lub usuniętego konta.' }, { status: 409 });
            }

            phase = 'ensure_setup_token';
            const resetToken = await ensurePasswordSetupToken(client);

            // Build the password-setup link
            const setupUrl = buildPasswordSetupUrl(resetToken, '/konto');
            const recipient = normalizeEmail(client.email);
            const isExistingAccess = client.welcome_email_count > 0 || Boolean(client.last_login);

            // Send welcome email with password setup link
            try {
                phase = 'send_email';
                const delivery = await sendEmail({
                    to: recipient,
                    bcc: OWNER_EMAIL,
                    subject: isExistingAccess
                        ? 'Nowy link dostępu do panelu klienta — Przemysław Właśniewski'
                        : `Witaj ${client.name || ''} w panelu klienta — Przemysław Właśniewski`,
                    template: 'welcome-client',
                    data: {
                        name: client.name,
                        email: recipient,
                        loginUrl: setupUrl,
                        isExistingAccess,
                    }
                });

                phase = 'persist_delivery';
                await prisma.$transaction([
                    prisma.user.update({
                        where: { id: clientId },
                        data: { welcome_email_sent_at: new Date(), welcome_email_count: { increment: 1 } },
                    }),
                    prisma.crmActivity.create({
                        data: {
                            client_id: clientId,
                            client_email: recipient,
                            action: 'welcome_email_sent',
                            entity_type: 'client',
                            entity_id: clientId,
                            details: JSON.stringify({ recipient, isExistingAccess, messageId: delivery.messageId }),
                        },
                    }),
                ]);

                await logSystem('INFO', 'SYSTEM', `Welcome email sent to client: ${client.name} (${client.email})`, { clientId });

                return NextResponse.json({ 
                    success: true, 
                    message: `${isExistingAccess ? 'Nowy link dostępu' : 'Email powitalny'} wysłany do ${recipient}`
                });
            } catch (emailError: any) {
                console.error('Failed to send welcome email:', emailError);
                await recordAdminIncidentSafely({
                    severity: 'P1',
                    category: 'COMMUNICATION',
                    reasonCode: 'WELCOME_EMAIL_DELIVERY_FAILED',
                    summary: 'Nie udało się wysłać lub potwierdzić wiadomości powitalnej',
                    clientId: incidentClientId,
                    clientEmail: incidentClientEmail,
                    entityType: 'client',
                    entityId: incidentClientId,
                    correlationId,
                    details: { phase, error: emailError instanceof Error ? emailError.message : String(emailError) },
                });
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
            await recordAdminIncidentSafely({
                severity: 'P1',
                category: 'COMMUNICATION',
                reasonCode: 'WELCOME_EMAIL_WORKFLOW_FAILED',
                summary: 'Proces wysyłki wiadomości powitalnej zakończył się błędem',
                clientId: incidentClientId,
                clientEmail: incidentClientEmail,
                entityType: 'client',
                entityId: incidentClientId,
                correlationId,
                details: { phase, error: error instanceof Error ? error.message : String(error) },
            });
            await logSystem('ERROR', 'SYSTEM', 'Failed to send welcome email', { error: error.message });
            return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
        }
    });
}
