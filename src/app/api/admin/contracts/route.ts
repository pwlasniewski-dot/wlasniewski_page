import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generateContractNumber } from '@/lib/services/numbering';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const { offer_id, client_id, content } = body;

            if (!offer_id) {
                return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
            }

            const offerIdInt = parseInt(offer_id);

            // Fetch the offer with client details
            const offer = await prisma.offer.findUnique({
                where: { id: offerIdInt },
                include: { user: true }
            });

            if (!offer) {
                return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
            }

            // Generate final contract number
            const contract_number = await generateContractNumber(offer.type === 'b2b' ? 'B2B' : 'B2C');

            // Create the contract
            const contract = await prisma.contract.create({
                data: {
                    offer_id: offerIdInt,
                    client_id: client_id || offer.client_id,
                    contract_number,
                    content,
                    status: 'pending'
                }
            });

            // Determine client email
            const clientEmail = offer.user?.email || offer.client_email;
            const clientName = offer.user?.name || offer.client_email || 'Kliencie';
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';

            // Send "Contract Ready" email to client
            if (clientEmail) {
                try {
                    await sendEmail({
                        to: clientEmail,
                        subject: `📄 Umowa ${contract_number} jest gotowa do podpisania — Przemysław Właśniewski`,
                        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c5a059;margin-bottom:30px;">
      <h1 style="color:#c5a059;font-size:28px;margin:0;letter-spacing:2px;">PRZEMYSŁAW WŁAŚNIEWSKI</h1>
      <p style="color:#888;font-size:12px;margin:5px 0 0;letter-spacing:4px;text-transform:uppercase;">Fotografia</p>
    </div>
    
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:40px;margin-bottom:24px;">
      <h2 style="color:#fff;font-size:24px;margin:0 0 16px;">Cześć, ${clientName}! 👋</h2>
      <p style="color:#ccc;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Twoja umowa jest gotowa. Możesz ją przejrzeć i pobrać w swoim panelu klienta.
      </p>
      
      <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="color:#888;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Numer umowy</p>
        <p style="color:#c5a059;font-size:20px;font-weight:bold;margin:0;font-family:monospace;">${contract_number}</p>
        <p style="color:#666;font-size:13px;margin:8px 0 0;">Oferta: ${offer.title}</p>
      </div>
      
      <div style="text-align:center;margin:32px 0;">
        <a href="${appUrl}/strefa-klienta/umowy" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;font-size:16px;letter-spacing:1px;">
          📄 Przejdź do umowy
        </a>
      </div>
      
      <p style="color:#666;font-size:13px;margin:0;text-align:center;">
        Jeśli masz pytania, odpowiedz na tego maila lub skontaktuj się bezpośrednio.
      </p>
    </div>
    
    <p style="color:#555;font-size:12px;text-align:center;margin:0;">
      © ${new Date().getFullYear()} Przemysław Właśniewski · Fotografia<br>
      <a href="https://wlasniewski.pl" style="color:#c5a059;">wlasniewski.pl</a>
    </p>
  </div>
</body>
</html>`
                    });
                    console.log(`[Contract] Email sent to client: ${clientEmail}`);
                } catch (emailError) {
                    console.error('[Contract] Failed to send client email:', emailError);
                }
            }

            // Notify admin
            try {
                const adminEmail = await getAdminEmail();
                if (adminEmail) {
                    await sendEmail({
                        to: adminEmail,
                        subject: `📄 Nowa umowa ${contract_number} — ${clientName}`,
                        html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;">
  <h2 style="color:#c5a059;">Nowa umowa wygenerowana</h2>
  <p>Umowa <strong>${contract_number}</strong> została wygenerowana dla klienta <strong>${clientName}</strong> (${clientEmail || 'brak emaila'}).</p>
  <p>Oferta: ${offer.title}</p>
  <p>Status: Oczekuje na podpisanie</p>
  <p><a href="${appUrl}/admin/generator-umow" style="color:#c5a059;">Zarządzaj umowami →</a></p>
</div>`
                    });
                }
            } catch (adminEmailError) {
                console.error('[Contract] Failed to send admin notification:', adminEmailError);
            }

            return NextResponse.json({ success: true, contract });
        } catch (error) {
            console.error('Create contract error:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}
