
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { loadDronePhotographyCmsPage } from '@/lib/dronePhotographyCms';
import { formatDronePrice } from '@/lib/dronePhotographyOffer';

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
        const package_slug = cleanText(body.package_slug, 100);
        const city = cleanText(body.city, 120);
        const preferred_date = cleanText(body.preferred_date, 20);
        const address = cleanText(body.address, 300);
        const goal = cleanText(body.goal, 240);
        const notes = cleanText(body.notes, 1600);
        const source = cleanText(body.source, 160) || 'direct';

        if (client_name.length < 2 || !EMAIL_PATTERN.test(email) || phone.replace(/\D/g, '').length < 7) {
            return NextResponse.json({ error: 'Uzupełnij poprawnie imię, e-mail i telefon.' }, { status: 400 });
        }

        const { config } = await loadDronePhotographyCmsPage();
        const selectedPackage = config.packages.find(item => item.slug === package_slug && item.active !== false);
        if (!selectedPackage) return NextResponse.json({ error: 'Wybrany pakiet nie jest już dostępny. Odśwież stronę i wybierz aktualną ofertę.' }, { status: 400 });
        if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(preferred_date) || !config.booking.goalOptions.includes(goal)) {
            return NextResponse.json({ error: 'Uzupełnij miejscowość, preferowaną datę i zadanie materiału.' }, { status: 400 });
        }

        const service_type = `fotografia_${selectedPackage.slug}`;
        const details = [
            `Pakiet: ${selectedPackage.name} (${formatDronePrice(selectedPackage)})`,
            `Miejscowość: ${city}`,
            `Preferowana data: ${preferred_date}`,
            `Adres / miejsce: ${address || 'do ustalenia'}`,
            `Główne zadanie materiału: ${goal}`,
            `Dodatkowe informacje: ${notes || 'brak'}`,
            `Źródło: ${source}`,
        ].join('\n');

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
