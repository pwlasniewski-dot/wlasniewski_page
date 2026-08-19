
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: unknown, maxLength: number) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const client_name = cleanText(body.client_name, 120);
        const company_name = cleanText(body.company_name, 160);
        const email = cleanText(body.email, 180).toLowerCase();
        const phone = cleanText(body.phone, 40);
        const service_type = cleanText(body.service_type, 100);
        const details = cleanText(body.details, 4000);

        if (client_name.length < 2 || !EMAIL_PATTERN.test(email) || !service_type) {
            return NextResponse.json({ error: 'Uzupełnij poprawnie imię, e-mail i rodzaj usługi.' }, { status: 400 });
        }

        const order = await prisma.droneOrder.create({
            data: {
                client_name,
                company_name: company_name || null,
                email,
                phone: phone || '',
                service_type,
                details: details || '',
                status: 'NEW'
            }
        });

        // Send email notification to admin
        try {
            const { getAdminEmail, sendEmail } = await import('@/lib/email/sender');
            const adminEmail = await getAdminEmail();
            if (adminEmail) {
                await sendEmail({
                    to: adminEmail,
                    subject: `✈️ Nowe zlecenie drona: ${client_name}`,
                    html: `
                        <h3>Nowe zlecenie uslug dronowych</h3>
                        <p><strong>Klient:</strong> ${escapeHtml(client_name)}</p>
                        <p><strong>Firma:</strong> ${escapeHtml(company_name || 'Brak')}</p>
                        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                        <p><strong>Telefon:</strong> ${escapeHtml(phone || 'Nie podano')}</p>
                        <p><strong>Typ uslug:</strong> ${escapeHtml(service_type)}</p>
                        <p><strong>Szczegoly:</strong></p>
                        <blockquote style="border-left: 2px solid #ccc; padding-left: 10px;">${escapeHtml(details || '').replace(/\n/g, '<br>')}</blockquote>
                    `
                });
            }
        } catch (emailError) {
            console.error('Failed to send drone order notification:', emailError);
        }

        return NextResponse.json({ success: true, id: order.id });
    } catch (error) {
        console.error('Drone Order API error:', error);
        return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 });
    }
}
