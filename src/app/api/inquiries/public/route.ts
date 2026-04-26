/**
 * API: Public POST endpoint for landing-page inquiry forms.
 * Inserts into Inquiry table with `source` (np. 'promo_maj2026') tagged for marketing analytics.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { logSystem } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone, message, session_type, preferred_date, source, promo_code, utm_source, utm_campaign } = body;

        if (!name || !email) {
            return NextResponse.json({ error: 'Imię i email są wymagane' }, { status: 400 });
        }

        const inquiry = await prisma.inquiry.create({
            data: {
                name,
                email,
                phone: phone || null,
                message: message || '',
                session_type: session_type || null,
                preferred_date: preferred_date ? new Date(preferred_date) : null,
                promo_code: promo_code || null,
                source: source || utm_source || 'website',
                status: 'new',
                notes: utm_campaign ? `UTM Campaign: ${utm_campaign}` : null,
            },
        });

        // Notify admin
        try {
            await sendEmail({
                to: 'pwlasniewski@gmail.com',
                subject: `🔥 Nowe zapytanie z lądowiska: ${source || 'website'} — ${name}`,
                html: `
                    <h2>Nowy lead z kampanii</h2>
                    <p><strong>Imię:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Telefon:</strong> ${phone || '—'}</p>
                    <p><strong>Typ sesji:</strong> ${session_type || '—'}</p>
                    <p><strong>Preferowana data:</strong> ${preferred_date || '—'}</p>
                    <p><strong>Wiadomość:</strong><br>${message || '—'}</p>
                    <hr>
                    <p style="color:#888"><strong>Źródło:</strong> ${source || 'website'}<br>
                    <strong>UTM Campaign:</strong> ${utm_campaign || '—'}<br>
                    <strong>Promo code:</strong> ${promo_code || '—'}</p>
                    <p><strong>Action required:</strong> oddzwoń w ciągu 2h, lead jest gorący.</p>
                `,
            });
        } catch (emailErr) {
            await logSystem('WARN', 'EMAIL', 'Lead notification email failed', { error: String(emailErr) });
        }

        return NextResponse.json({ success: true, inquiry_id: inquiry.id });
    } catch (error: any) {
        console.error('Inquiry POST error:', error);
        return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
    }
}
