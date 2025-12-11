import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';
import { generateGiftCardEmail } from '@/lib/email/giftCardTemplate';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'przemyslaw@wlasniewski.pl';

// Simple email validation
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

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
                // Notify admin about error
                try {
                    await sendEmail({
                        to: ADMIN_EMAIL,
                        subject: `❌ Błąd wysyłania karty podarunkowej #${card.id}`,
                        html: `
                            <h2>Błąd wysyłania karty</h2>
                            <p><strong>Karta:</strong> #${card.id}</p>
                            <p><strong>Kod:</strong> ${card.code}</p>
                            <p><strong>Błąd:</strong> Brak adresu email odbiorcy</p>
                            <p>Uzupełnij email odbiorcy w formularzu karty.</p>
                        `
                    });
                } catch (e) {
                    console.error('Failed to send error notification:', e);
                }
                
                return NextResponse.json({ 
                    error: 'No recipient email provided',
                    details: 'Uzupełnij email odbiorcy w karcie'
                }, { status: 400 });
            }

            // Validate email format
            if (!isValidEmail(recipientEmail)) {
                // Notify admin about invalid email
                try {
                    await sendEmail({
                        to: ADMIN_EMAIL,
                        subject: `⚠️ Błędny adres email - karta #${card.id}`,
                        html: `
                            <h2>Błędny format adresu email</h2>
                            <p><strong>Karta:</strong> #${card.id}</p>
                            <p><strong>Kod:</strong> ${card.code}</p>
                            <p><strong>Email:</strong> ${recipientEmail}</p>
                            <p>Adres email jest nieprawidłowy. Sprawdź i spróbuj ponownie.</p>
                        `
                    });
                } catch (e) {
                    console.error('Failed to send validation error notification:', e);
                }
                
                return NextResponse.json({ 
                    error: 'Invalid email format',
                    details: `Email "${recipientEmail}" jest nieprawidłowy`
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
                logoUrl,
                card.card_title || 'KARTA PODARUNKOWA',
                card.card_description || undefined
            );

            // Send email to recipient
            await sendEmail({
                to: recipientEmail,
                subject: `🎁 Twoja Karta Podarunkowa od PRZEMYSŁAW WŁAŚNIEWSKI FOTOGRAFIA`,
                html: emailHtml
            });

            // Update card status
            await prisma.giftCard.update({
                where: { id: parseInt(id) },
                data: { status: 'sent', updated_at: new Date() }
            });

            // Send confirmation to admin
            try {
                await sendEmail({
                    to: ADMIN_EMAIL,
                    subject: `✅ Karta podarunkowa wysłana - #${card.id}`,
                    html: `
                        <h2>✅ Karta podarunkowa wysłana pomyślnie</h2>
                        <p><strong>Karta:</strong> #${card.id}</p>
                        <p><strong>Kod:</strong> ${card.code}</p>
                        <p><strong>Wartość:</strong> ${card.value || card.amount} PLN</p>
                        <p><strong>Odbiorca:</strong> ${card.recipient_name || 'Nie podane'}</p>
                        <p><strong>Email:</strong> ${recipientEmail}</p>
                        <p><strong>Wysłano:</strong> ${new Date().toLocaleString('pl-PL')}</p>
                    `
                });
            } catch (e) {
                console.error('Failed to send confirmation to admin:', e);
                // Don't fail the request if admin notification fails
            }

            return NextResponse.json({ success: true });
        } catch (error: any) {
            console.error('❌ Error sending gift card email:', {
                message: error?.message,
                code: error?.code,
                command: error?.command,
                response: error?.response,
                stack: error?.stack,
            });
            
            // Send error notification to admin
            try {
                await sendEmail({
                    to: ADMIN_EMAIL,
                    subject: `❌ Błąd wysyłania karty podarunkowej`,
                    html: `
                        <h2>❌ Błąd wysyłania karty podarunkowej</h2>
                        <p><strong>Błąd:</strong> ${error?.message || 'Nieznany błąd'}</p>
                        <p><strong>Kod błędu:</strong> ${error?.code || 'N/A'}</p>
                        <p><strong>Czas:</strong> ${new Date().toLocaleString('pl-PL')}</p>
                        <hr>
                        <p><strong>Sugestie:</strong></p>
                        <ul>
                            <li>Sprawdź ustawienia SMTP w Admin → Settings</li>
                            <li>Sprawdź czy adres email odbiorcy jest poprawny</li>
                            <li>Sprawdź czy serwer mailowy jest dostępny</li>
                        </ul>
                    `
                });
            } catch (notifyError) {
                console.error('Failed to send error notification:', notifyError);
            }
            
            // Return detailed error information for debugging
            return NextResponse.json({ 
                error: 'Failed to send email',
                details: error?.message || 'Unknown error',
                code: error?.code,
                suggestions: [
                    'Sprawdź czy adres email jest poprawny',
                    'Sprawdź ustawienia SMTP w Admin Settings',
                    'Spróbuj ponownie za chwilę'
                ]
            }, { status: 500 });
        }
    });
}

