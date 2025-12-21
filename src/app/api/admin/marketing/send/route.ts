
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sender';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
    try {
        const { recipientEmail, templateId, variableData, subject: customSubject, content: customContent } = await request.json();

        if (!recipientEmail || (!templateId && (!customSubject || !customContent))) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Determine subject and content
        let subject = customSubject;
        let content = customContent;
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
            bcc: 'kontakt@wlasniewski.pl' // Ensure admin always gets a copy
        });

        // Log action
        await prisma.marketingAction.create({
            data: {
                client_name: variableData?.client_name || recipientEmail,
                action_type: 'EMAIL_SENT',
                notes: `Sent: ${subject} to ${recipientEmail}`
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
