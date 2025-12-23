import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { withAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();
            const { host, port, user, pass, from, testTo } = body;

            const missingFields = [];
            if (!host) missingFields.push('host');
            if (!port) missingFields.push('port');
            if (!user) missingFields.push('user');
            if (!pass) missingFields.push('pass');
            if (!from) missingFields.push('from');

            if (missingFields.length > 0) {
                console.warn('[SMTP Test] Missing fields:', missingFields);
                return NextResponse.json({
                    success: false,
                    error: `Brakujące pola SMTP: ${missingFields.join(', ')}`
                }, { status: 400 });
            }

            console.log(`[SMTP Test] Attempting test to ${testTo || from} via ${host}:${port}`);
            await logSystem('INFO', 'EMAIL', 'Rozpoczęto test SMTP', { host, port, user, from });

            // [STABLE: 2025-12-23] TA SAMA KONFIGURACJA CO W SENDER.TS
            // Wymagane dla spójności testu z produkcją.
            const transporter = nodemailer.createTransport({
                host,
                port: Number(port),
                secure: Number(port) === 465,
                auth: { user, pass },
                connectionTimeout: 10000, // 10s timeout
                tls: {
                    rejectUnauthorized: false
                }
            });

            // 1. Verify connection
            try {
                await transporter.verify();
            } catch (verifyError: any) {
                console.error('[SMTP Test] Verification failed:', verifyError);
                await logSystem('ERROR', 'EMAIL', 'Weryfikacja SMTP nieudana', {
                    error: verifyError.message,
                    code: verifyError.code
                });
                return NextResponse.json({
                    success: false,
                    error: `Błąd weryfikacji połączenia: ${verifyError.message} (Kod: ${verifyError.code})`
                }, { status: 500 });
            }

            // 2. Send test email
            try {
                const info = await transporter.sendMail({
                    from,
                    to: testTo || from,
                    subject: '✅ Test konfiguracji SMTP - wlasniewski.pl',
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4af37; border-radius: 8px;">
                            <h1 style="color: #d4af37;">Test SMTP pomyślny!</h1>
                            <p>To jest wiadomość testowa wysłana z Panelu Admina strony <strong>wlasniewski.pl</strong>.</p>
                            <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">
                            <ul style="list-style: none; padding: 0;">
                                <li><strong>Host:</strong> ${host}</li>
                                <li><strong>Port:</strong> ${port}</li>
                                <li><strong>Użytkownik:</strong> ${user}</li>
                                <li><strong>Nadawca:</strong> ${from}</li>
                            </ul>
                            <p style="font-size: 12px; color: #666; margin-top: 30px;">Przetestowano pomyślnie z Panelu Admina.</p>
                        </div>
                    `
                });

                console.log('[SMTP Test] Success:', info.messageId);
                await logSystem('INFO', 'EMAIL', 'Test SMTP zakończony sukcesem', { messageId: info.messageId });

                return NextResponse.json({
                    success: true,
                    message: 'Test SMTP zakończony sukcesem. Sprawdź swoją skrzynkę.',
                    messageId: info.messageId
                });
            } catch (sendError: any) {
                console.error('[SMTP Test] Send failed:', sendError);
                await logSystem('ERROR', 'EMAIL', 'Wysyłka testowa SMTP nieudana', {
                    error: sendError.message,
                    code: sendError.code
                });
                return NextResponse.json({
                    success: false,
                    error: `Połączenie OK, ale wysyłka nieudana: ${sendError.message}`
                }, { status: 500 });
            }

        } catch (error: any) {
            console.error('[SMTP Test] Unexpected error:', error);
            await logSystem('ERROR', 'EMAIL', 'Nieoczekiwany błąd testu SMTP', {
                error: error.message,
                stack: error.stack
            });
            return NextResponse.json({
                success: false,
                error: `Błąd krytyczny: ${error.message}`
            }, { status: 500 });
        }
    });
}
