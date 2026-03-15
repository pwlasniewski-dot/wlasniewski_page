import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateOfferPDF } from '@/lib/services/pdf';
import { verifyToken, extractToken } from '@/lib/auth/jwt';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Extract and verify token for custom JWT system
        let token = extractToken(request.headers.get('authorization'));

        // Fallback: Check cookies if header missing (for browser downloads)
        if (!token) {
            const clientTokenCookie = request.cookies.get('client_token');
            const adminTokenCookie = request.cookies.get('admin_token');
            token = clientTokenCookie?.value || adminTokenCookie?.value || null;
        }

        // Fallback: Check query param (last resort)
        if (!token) {
            const url = new URL(request.url);
            token = url.searchParams.get('token');
        }

        const payload = token ? await verifyToken(token) : null;

        if (!payload) {
            console.warn('[PDF API] Unauthorized access attempt to offer PDF');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const offerId = parseInt(id);

        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                sections: {
                    include: { items: true },
                },
            },
        });

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        // Security check: Only owner or admin
        const isAdmin = await prisma.adminUser.findUnique({ where: { id: payload.id } });
        const isClientOwner = payload.email === offer.client_email || payload.id === offer.client_id;

        if (!isAdmin && !isClientOwner) {
            console.warn(`[PDF API] Forbidden access attempt by ${payload.email} to offer ${offerId}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // PROTECT standalone/uploaded PDFs — if no sections, always serve original file
        const hasSections = offer.sections && offer.sections.length > 0;

        // If a stored PDF URL exists and offer has no sections (standalone upload), always redirect to original
        if (offer.pdf_url && !hasSections) {
            console.log(`[PDF API] Offer ${offerId} is standalone PDF — redirecting to original file`);
            return NextResponse.redirect(offer.pdf_url, { status: 302 });
        }

        // Custom Logic: If Communion AND Accepted AND has sections, dynamically generate the PDF
        const isCommunion = offer.category?.toLowerCase() === 'komunia';
        if (isCommunion && offer.status === 'accepted' && hasSections) {
            const clientIp = request.headers.get('x-forwarded-for') || 'nieznane';
            const footerNote = `Dokument pobrany przez klienta w dniu: ${new Date().toLocaleString('pl-PL')} (IP: ${clientIp})`;

            const modifiedOffer = { ...offer, _footerNote: footerNote };

            const pdfBuffer = await generateOfferPDF(modifiedOffer as any);
            return new NextResponse(pdfBuffer as any, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="Oferta_Komunia_${offer.id}.pdf"`,
                },
            });
        }

        // If a stored PDF URL exists (uploaded via S3), redirect to it
        if (offer.pdf_url) {
            return NextResponse.redirect(offer.pdf_url, { status: 302 });
        }

        // No stored PDF: return a helpful HTML splash page
        console.warn(`[PDF API] No pdf_url for offer ${offerId}. PDF not yet generated.`);
        return new NextResponse(
            `<!DOCTYPE html>
            <html lang="pl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PDF Niedostępny | Przemysław Właśniewski</title>
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
                    <h1 class="text-2xl font-bold mb-4">PDF nie jest jeszcze gotowy</h1>
                    <p class="text-zinc-400 mb-8 leading-relaxed">
                        Dokument PDF dla oferty <span class="text-white font-medium">"${offer.title}"</span> nie został jeszcze wygenerowany przez fotografa.
                    </p>
                    <div class="bg-zinc-950/50 rounded-2xl p-6 mb-8 border border-zinc-800 text-left">
                        <p class="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Co możesz zrobić?</p>
                        <ul class="space-y-3 text-sm text-zinc-300">
                            <li class="flex gap-3">
                                <span class="gold-text">✓</span>
                                <span>Możesz przeglądać ofertę bezpośrednio w przeglądarce.</span>
                            </li>
                            <li class="flex gap-3">
                                <span class="gold-text">✓</span>
                                <span>Jeśli jesteś adminem: Wejdź w edycję oferty i kliknij przycisk <strong class="text-white">"S3 (Zapisz PDF)"</strong>.</span>
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
        console.error('Error serving PDF:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error details:', {
            message: errorMessage,
            stack: error instanceof Error ? error.stack : 'No stack trace',
        });
        return NextResponse.json(
            { 
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
            }, 
            { status: 500 }
        );
    }
}
