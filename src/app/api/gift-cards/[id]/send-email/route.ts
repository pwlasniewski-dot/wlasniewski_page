import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';
import { generateGiftCardEmail } from '@/lib/email/giftCardTemplate';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req) => {
        try {
            const { id } = await params;
            const body = await request.json();

            // Get gift card
            const card = await prisma.giftCard.findUnique({
                where: { id: parseInt(id) }
            });

            if (!card) {
                return NextResponse.json({ error: 'Card not found' }, { status: 404 });
            }

            // Check if recipient email is available
            const recipientEmail = body.email || card.recipient_email;
            if (!recipientEmail) {
                return NextResponse.json({ 
                    error: 'No recipient email provided',
                    details: 'Card recipient_email is missing and no email provided in request'
                }, { status: 400 });
            }

            // Get settings for logo
            const settings = await prisma.setting.findFirst({
                orderBy: { id: 'asc' }
            });

            const logoUrl = (settings as any)?.logo_url || body.logoUrl;

            // Generate email HTML
            const emailHtml = generateGiftCardEmail(
                card.recipient_name,
                card.code,
                card.value || card.amount,
                card.theme || card.card_template,
                card.sender_name || 'Fotograf',
                card.message || '',
                logoUrl
            );

            // Send email
            await sendEmail({
                to: recipientEmail,
                subject: `🎁 Twoja Karta Podarunkowa od ${card.sender_name || 'Fotografa'}!`,
                html: emailHtml
            });

            // Update card status
            await prisma.giftCard.update({
                where: { id: parseInt(id) },
                data: { status: 'sent', updated_at: new Date() }
            });

            return NextResponse.json({ success: true });
        } catch (error: any) {
            console.error('❌ Error sending gift card email:', {
                message: error?.message,
                code: error?.code,
                command: error?.command,
                response: error?.response,
                stack: error?.stack
            });
            return NextResponse.json({ 
                error: 'Failed to send email',
                details: error?.message || 'Unknown error',
                code: error?.code
            }, { status: 500 });
        }
    });
}

