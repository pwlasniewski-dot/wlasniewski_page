import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const authError = await requireAuth(request);
        if (authError) return authError;

        const { id } = await context.params;
        const offerId = parseInt(id);
        const { message } = await request.json();

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Wiadomość nie może być pusta' }, { status: 400 });
        }

        // Create negotiation with sender = 'admin'
        const negotiation = await prisma.negotiation.create({
            data: {
                offer_id: offerId,
                message: message.trim(),
                sender: 'admin',
                status: 'open',
            },
        });

        // Send email notification to client
        try {
            const offer = await prisma.offer.findUnique({
                where: { id: offerId },
                include: { user: { select: { email: true, name: true } } }
            });

            const clientEmail = offer?.client_email || offer?.user?.email;
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';

            if (clientEmail) {
                await sendEmail({
                    to: clientEmail,
                    subject: `📩 Nowa wiadomość dot. oferty — ${offer?.title}`,
                    html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <h2 style="color:#c5a059;">📩 Fotograf odpowiedział na Twoją negocjację</h2>
  <div style="background:#111;border:1px solid #333;border-radius:8px;padding:20px;margin:16px 0;">
    <p style="color:#c5a059;font-size:18px;font-weight:bold;margin:0;">${offer?.title}</p>
  </div>
  <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;text-transform:uppercase;">Wiadomość od fotografa:</p>
    <p style="color:#e2e8f0;font-size:15px;line-height:1.6;margin:0;white-space:pre-wrap;">${message.trim()}</p>
  </div>
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/strefa-klienta/oferty/${offerId}" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Zobacz ofertę →</a>
  </div>
</div>`
                });
            }
        } catch (emailError) {
            console.error('[Admin Negotiate] Failed to send client notification:', emailError);
        }

        return NextResponse.json({ negotiation });
    } catch (error) {
        console.error('Error creating admin negotiation:', error);
        return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
    }
}
