import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { generateContractPDF } from '@/lib/services/pdf';
import { isContractRecordOwner, isVerifiedAdminIdentity } from '@/lib/auth/document-access';
import { getPrivateS3DownloadUrl } from '@/lib/storage/s3';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { isClientVisibleContractStatus } from '@/lib/contracts/status';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tokenCandidates = [
            extractToken(request.headers.get('authorization')),
            extractToken(request.headers.get('Authorization')),
            request.cookies.get('client_token')?.value || null,
            request.cookies.get('admin_token')?.value || null,
            request.cookies.get('user_token')?.value || null,
        ].filter((value): value is string => Boolean(value));

        let payload: { id: number; email: string; role?: string; type?: string } | null = null;
        for (const candidate of tokenCandidates) {
            payload = await verifyToken(candidate);
            if (payload) break;
        }

        if (!payload) {
            console.warn('[CONTRACT PDF API] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const contractId = parseInt(id);

        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                offer: true,
                user: true
            }
        });

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Security check: Only owner or admin
        const admin = payload.type === 'admin' && payload.role === 'ADMIN'
            ? await prisma.adminUser.findUnique({ where: { id: payload.id }, select: { id: true, email: true, role: true } })
            : null;
        const isAdmin = isVerifiedAdminIdentity(payload, admin);
        const activeClient = isAdmin ? null : await revalidateActiveClient(payload);
        if (!isAdmin && !activeClient) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const isClientOwner = activeClient ? isContractRecordOwner(contract, activeClient) : false;

        if (!isAdmin && !isClientOwner) {
            console.warn(`[CONTRACT PDF API] Forbidden access attempt by ${payload.email} to contract ${contractId}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!isAdmin && !isClientVisibleContractStatus(contract.status)) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        if (contract.status.toLowerCase() === 'signed' && contract.signed_pdf_url) {
            return NextResponse.redirect(await getPrivateS3DownloadUrl(contract.signed_pdf_url), { status: 302 });
        }

        // PROTECT standalone/uploaded PDFs — if content is just a marker, always serve original
        const isStandalonePdf = contract.pdf_url && 
            (contract.content?.startsWith('Umowa wgrana jako PDF') || !contract.content?.trim());

        if (isStandalonePdf) {
            console.log(`[CONTRACT PDF API] Contract ${contractId} is standalone PDF — redirecting to original file`);
            return NextResponse.redirect(await getPrivateS3DownloadUrl(contract.pdf_url), { status: 302 });
        }

        // Custom Logic: If Signed, always dynamically generate the PDF to stamp dates
        if (contract.status === 'signed' || contract.status === 'SIGNED') {
            const clientIp = request.headers.get('x-forwarded-for') || 'nieznane';
            const footerNote = `Oświadczenie pobrane elektronicznie w dniu: ${new Date().toLocaleString('pl-PL')} (IP: ${clientIp})`;

            const modifiedContract = { ...contract, _footerNote: footerNote };

            const clientName = (contract.offer?.template_data as any)?.contactName || contract.user?.name || undefined;
            const eventDate = (contract.offer?.template_data as any)?.eventDate || undefined;

            const pdfBuffer = await generateContractPDF(modifiedContract as any, clientName, eventDate);
            return new NextResponse(pdfBuffer as any, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="Umowa_${contract.contract_number || contract.id}.pdf"`,
                },
            });
        }

        // If a stored PDF URL exists (uploaded via S3), redirect to it
        if (contract.pdf_url) {
            return NextResponse.redirect(await getPrivateS3DownloadUrl(contract.pdf_url), { status: 302 });
        }

        // No stored PDF: return a helpful HTML splash page
        const contractTitle = contract.contract_number || `Umowa #${contract.id}`;

        return new NextResponse(
            `<!DOCTYPE html>
            <html lang="pl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PDF Umowy Niedostępny | Przemysław Właśniewski</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; background-color: #0a0a0a; color: white; }
                    .gold-text { color: #c5a059; }
                    .gold-bg { background-color: #c5a059; }
                </style>
            </head>
            <body class="min-h-screen flex items-center justify-center p-4">
                <div class="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl">
                    <div class="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold mb-4">PDF Umowy nie jest gotowy</h1>
                    <p class="text-zinc-400 mb-8 leading-relaxed">
                        Dokument PDF dla umowy <span class="text-white font-medium">"${contractTitle}"</span> nie został jeszcze wygenerowany.
                    </p>
                    <div class="bg-zinc-950/50 rounded-2xl p-6 mb-8 border border-zinc-800 text-left">
                        <p class="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Co możesz zrobić?</p>
                        <ul class="space-y-3 text-sm text-zinc-300">
                            <li class="flex gap-3">
                                <span class="gold-text">✓</span>
                                <span>Możesz podejrzeć treść umowy w portalu klienta.</span>
                            </li>
                            <li class="flex gap-3">
                                <span class="gold-text">✓</span>
                                <span>Zostaniesz poinformowany, gdy PDF zostanie wygenerowany.</span>
                            </li>
                            <li class="flex gap-3">
                                <span class="gold-text">✓</span>
                                <span>Jeśli jesteś adminem: Możesz wygenerować PDF w panelu klienta.</span>
                            </li>
                        </ul>
                    </div>
                    <button onclick="window.close()" class="gold-bg text-black px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all w-full">
                        Zamknij to okno
                    </button>
                </div>
            </body>
            </html>`,
            {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
        );
    } catch (error) {
        console.error('Error serving Contract PDF:', error);
        return NextResponse.json({ error: 'Failed to serve PDF' }, { status: 500 });
    }
}
