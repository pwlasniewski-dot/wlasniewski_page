
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { client_name, company_name, email, phone, service_type, details } = body;

        const order = await prisma.droneOrder.create({
            data: {
                client_name,
                company_name,
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
                        <p><strong>Klient:</strong> ${client_name}</p>
                        <p><strong>Firma:</strong> ${company_name || 'Brak'}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Telefon:</strong> ${phone || 'Nie podano'}</p>
                        <p><strong>Typ uslug:</strong> ${service_type}</p>
                        <p><strong>Szczegoly:</strong></p>
                        <blockquote style="border-left: 2px solid #ccc; padding-left: 10px;">${(details || '').replace(/\n/g, '<br>')}</blockquote>
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
