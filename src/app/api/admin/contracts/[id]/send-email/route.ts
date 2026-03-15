import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';

export const dynamic = 'force-dynamic';

// POST /api/admin/contracts/[id]/send-email — notify client about contract
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const params = await context.params;
            const contractId = parseInt(params.id);

            const contract = await prisma.contract.findUnique({
                where: { id: contractId },
                include: {
                    user: true,
                    offer: {
                        include: { user: true }
                    }
                }
            });

            if (!contract) {
                return NextResponse.json({ error: 'Umowa nie znaleziona' }, { status: 404 });
            }

            // Determine client email
            const clientEmail = contract.user?.email || contract.offer?.client_email || contract.offer?.user?.email;
            const clientName = contract.user?.name || contract.offer?.user?.name || 'Kliencie';

            if (!clientEmail) {
                return NextResponse.json({ error: 'Brak adresu e-mail klienta' }, { status: 400 });
            }

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';

            await sendEmail({
                to: clientEmail,
                subject: `📄 Umowa ${contract.contract_number} jest gotowa do podpisania — Przemysław Właśniewski`,
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
        Twoja umowa jest gotowa do przejrzenia i podpisania. Zaloguj się do panelu klienta, aby zobaczyć szczegóły.
      </p>
      
      <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="color:#888;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Numer umowy</p>
        <p style="color:#c5a059;font-size:20px;font-weight:bold;margin:0;font-family:monospace;">${contract.contract_number}</p>
      </div>
      
      <div style="text-align:center;margin:32px 0;">
        <a href="${appUrl}/strefa-klienta/umowy/${contract.id}" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;font-size:16px;letter-spacing:1px;">
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

            console.log(`[Contract] Notification email sent to: ${clientEmail} for contract ${contract.contract_number}`);

            return NextResponse.json({ success: true, message: `E-mail wysłany do ${clientEmail}` });
        } catch (error: any) {
            console.error('[Contract] Send email error:', error);
            return NextResponse.json({ error: error.message || 'Błąd wysyłki e-mail' }, { status: 500 });
        }
    });
}
