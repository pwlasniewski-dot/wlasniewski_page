
import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, sendEmail } from '@/lib/email/sender';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { z } from 'zod';

const mailingSchema = z.object({
    recipientEmail: z.string().trim().email().max(254),
    templateId: z.number().int().positive().optional(),
    variableData: z.record(z.string().max(64), z.string().max(2_000)).optional(),
    subject: z.string().trim().min(1).max(180).optional(),
    content: z.string().trim().min(1).max(100_000).optional(),
    consentConfirmed: z.literal(true),
}).refine(value => value.templateId || (value.subject && value.content), { message: 'Wybierz szablon albo wpisz temat i treść.' });

export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const parsed = mailingSchema.safeParse(await request.json());
        if (!parsed.success) return NextResponse.json({ error: 'Nieprawidłowe dane wysyłki' }, { status: 400 });
        const { recipientEmail, templateId, variableData, subject: customSubject, content: customContent } = parsed.data;

        // Determine subject and content
        let subject: string = customSubject || '';
        let content: string = customContent || '';
        let templateTitle = 'Custom Email';

        if (templateId && (!subject || !content)) {
            const template = await prisma.marketingTemplate.findUnique({
                where: { id: templateId }
            });

            if (!template) {
                return NextResponse.json({ error: 'Template not found' }, { status: 404 });
            }

            templateTitle = template.title;
            // Use template values if custom ones aren't provided
            if (!subject) subject = template.subject;
            if (!content) content = template.content;
        }

        // Replace variables
        if (variableData && subject && content) {
            Object.keys(variableData).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                subject = subject.replace(regex, variableData[key] || '');
                content = content.replace(regex, variableData[key] || '');
            });
        }

        // Send email with copy to admin
        await sendEmail({
            to: recipientEmail,
            subject: subject || 'Oferta',
            html: content || '',
            bcc: await getAdminEmail(),
        });

        // Log action
        await prisma.marketingAction.create({
            data: {
                client_name: variableData?.client_name || recipientEmail,
                action_type: 'EMAIL_SENT',
                notes: `Consent confirmed by administrator. Sent: ${subject} to ${recipientEmail}`
            }
        });

        await prisma.systemLog.create({
            data: {
                level: 'INFO',
                message: `Wysłano ofertę marketingową (${templateTitle}) do ${recipientEmail}`,
                module: 'MARKETING_MODULE'
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Marketing email error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
