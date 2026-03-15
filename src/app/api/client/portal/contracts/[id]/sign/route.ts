import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';
import { generateContractPDF } from '@/lib/services/pdf';
import { uploadToS3 } from '@/lib/storage/s3';
import { logClientActivity } from '@/lib/crm-activity';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = extractToken(request.headers.get('authorization')) ||
            request.cookies.get('client_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const clientNote = body.client_note?.trim() || '';

        const { id } = await params;
        const contractId = parseInt(id);

        // Fetch contract with offer details
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                offer: {
                    include: { user: true }
                }
            }
        });

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Verify ownership
        const isOwner =
            contract.client_id === decoded.id ||
            contract.offer?.client_id === decoded.id ||
            contract.offer?.client_email === decoded.email;

        if (!isOwner) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check if already signed
        if (contract.status === 'signed') {
            return NextResponse.json({ error: 'Contract already signed' }, { status: 400 });
        }

        console.log(`[CONTRACT_SIGN] Signing contract ${contractId} with note: ${clientNote ? 'Yes' : 'No'}`);

        // CRM Activity: contract signed
        logClientActivity(decoded, 'contract_signed', {
            entityType: 'contract',
            entityId: contractId,
            details: { contract_number: contract.contract_number, has_note: !!clientNote },
            request,
        });

        // Sign the contract and add client note
        const updated = await prisma.contract.update({
            where: { id: contractId },
            data: {
                status: 'signed',
                signed_at: new Date(),
                client_note: clientNote || null,
            },
            include: {
                offer: {
                    select: {
                        id: true,
                        title: true,
                        offerNumber: true,
                        client_email: true,
                    }
                }
            }
        });

        // Fetch user name from DB (JWT only has id/email)
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { name: true }
        });

        const clientName = user?.name || decoded.email || 'Klient';
        const clientEmail = decoded.email;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';

        // Generate signed PDF and upload to S3
        let signedPdfUrl = null;
        try {
            console.log(`[CONTRACT_SIGN] Generating signed PDF for contract ${contractId}...`);
            const pdfBuffer = await generateContractPDF(updated, true); // includeSignatureSection = true
            console.log(`[CONTRACT_SIGN] PDF generated, size: ${pdfBuffer.length} bytes`);

            const fileName = `umowa_${updated.contract_number || contractId}_podpisana.pdf`;
            const s3Key = `contracts/${fileName}`;

            console.log(`[CONTRACT_SIGN] Uploading to S3: ${s3Key}...`);
            signedPdfUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');
            console.log(`[CONTRACT_SIGN] Successfully uploaded signed PDF to S3: ${signedPdfUrl}`);
        } catch (pdfError) {
            console.error('[CONTRACT_SIGN] Failed to generate/upload signed PDF:', pdfError);
            // Non-blocking error - continue with email notifications even if PDF fails
        }

        // Notify admin about signing
        try {
            const adminEmail = await getAdminEmail();
            if (adminEmail) {
                await sendEmail({
                    to: adminEmail,
                    subject: `✅ Umowa ${updated.contract_number} PODPISANA — ${clientName}`,
                    html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <h2 style="color:#4ade80;">✅ Umowa podpisana przez klienta!</h2>
  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin:16px 0;">
    <p style="color:#888;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Numer umowy</p>
    <p style="color:#c5a059;font-size:20px;font-weight:bold;margin:0;font-family:monospace;">${updated.contract_number}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:8px 0;color:#888;font-size:13px;">Klient</td><td style="padding:8px 0;color:#fff;font-size:13px;text-align:right;">${clientName} (${clientEmail})</td></tr>
    <tr><td style="padding:8px 0;color:#888;font-size:13px;">Oferta</td><td style="padding:8px 0;color:#fff;font-size:13px;text-align:right;">${updated.offer?.title || 'N/A'}</td></tr>
    <tr><td style="padding:8px 0;color:#888;font-size:13px;">Data podpisania</td><td style="padding:8px 0;color:#4ade80;font-size:13px;font-weight:bold;text-align:right;">${new Date().toLocaleString('pl-PL')}</td></tr>
    ${clientNote ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;">Notatka klienta</td><td style="padding:8px 0;color:#fff;font-size:13px;text-align:right;">Tak</td></tr>` : ''}
  </table>
  ${signedPdfUrl ? `<div style="text-align:center;margin:24px 0;">
    <a href="${signedPdfUrl}" style="display:inline-block;background:#4ade80;color:#000;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;font-size:12px;margin-right:8px;">Pobierz umowę podpisaną</a>
  </div>` : ''}
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/admin/generator-umow" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Zarządzaj umowami →</a>
  </div>
</div>`
                });
            }
        } catch (emailError) {
            console.error('[CONTRACT_SIGN] Failed to send admin notification:', emailError);
        }

        // Send confirmation to client
        try {
            if (clientEmail) {
                await sendEmail({
                    to: clientEmail,
                    subject: `✅ Umowa ${updated.contract_number} podpisana — dziękujemy!`,
                    html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <div style="text-align:center;padding:24px 0;border-bottom:2px solid #c5a059;margin-bottom:24px;">
    <h1 style="color:#c5a059;font-size:22px;margin:0;letter-spacing:2px;">PRZEMYSŁAW WŁAŚNIEWSKI</h1>
    <p style="color:#888;font-size:11px;margin:4px 0 0;letter-spacing:4px;text-transform:uppercase;">Fotografia</p>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:12px;padding:32px;">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;background:rgba(74,222,128,0.1);border:2px solid rgba(74,222,128,0.4);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:24px;">✅</div>
    </div>
    <h2 style="color:#fff;font-size:22px;margin:0 0 12px;text-align:center;">Umowa podpisana!</h2>
    <p style="color:#888;font-size:14px;line-height:1.6;text-align:center;margin:0 0 24px;">
      Dziękujemy za podpisanie umowy. Skontaktuję się z Tobą wkrótce, aby omówić szczegóły sesji.
    </p>
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#888;font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:2px;">Numer umowy</p>
      <p style="color:#c5a059;font-size:18px;font-weight:bold;margin:0;font-family:monospace;">${updated.contract_number}</p>
      <p style="color:#555;font-size:12px;margin:6px 0 0;">Oferta: ${updated.offer?.title || 'N/A'}</p>
    </div>
    ${signedPdfUrl ? `<div style="text-align:center;margin-top:20px;">
      <p style="color:#888;font-size:12px;margin:0 0 12px;">Pobierz swoją podpisaną umowę:</p>
      <a href="${signedPdfUrl}" style="display:inline-block;background:#4ade80;color:#000;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;">Pobierz PDF</a>
    </div>` : ''}
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/konto" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:14px;">Panel klienta →</a>
    </div>
  </div>
  <p style="color:#444;font-size:11px;text-align:center;margin:16px 0 0;">© ${new Date().getFullYear()} Przemysław Właśniewski · <a href="https://wlasniewski.pl" style="color:#c5a059;">wlasniewski.pl</a></p>
</div>`
                });
            }
        } catch (emailError) {
            console.error('[CONTRACT_SIGN] Failed to send client confirmation:', emailError);
        }

        return NextResponse.json({ 
            success: true, 
            contract: updated,
            signed_pdf_url: signedPdfUrl
        });
    } catch (error) {
        console.error('Error signing contract:', error);
        return NextResponse.json({ error: 'Failed to sign contract' }, { status: 500 });
    }
}
