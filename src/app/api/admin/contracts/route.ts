import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generateContractNumber } from '@/lib/services/numbering';
import { isImmutableContractStatus } from '@/lib/contracts/status';

export const dynamic = 'force-dynamic';

function parsePermissions(input: unknown): Record<string, any> {
  if (!input) return {};
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, any>;
  }
  return {};
}

function extractSessionPlanFromUser(user: any): { date: string | null; time: string | null; location: string | null } {
  const permissions = parsePermissions(user?.permissions);
  const raw = permissions.session_plan;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { date: null, time: null, location: null };
  }
  return {
    date: typeof raw.date === 'string' && raw.date.trim() ? raw.date : null,
    time: typeof raw.time === 'string' && raw.time.trim() ? raw.time : null,
    location: typeof raw.location === 'string' && raw.location.trim() ? raw.location : null,
  };
}

function buildAlbumDetails(offer: any): string {
  const addons: any[] = Array.isArray(offer?.selected_addons)
    ? offer.selected_addons
    : typeof offer?.selected_addons === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(offer.selected_addons);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

  const rows: string[] = [];
  for (const addon of addons) {
    const title = addon?.album_title || addon?.title || addon?.name;
    if (!title) continue;
    const format = addon?.format || addon?.album_format || addon?.size || '';
    const pages = addon?.page_count ?? addon?.pages ?? addon?.album_pages ?? addon?.spread_count ?? '';
    const price = addon?.final_price ?? addon?.price ?? '';
    const segments: string[] = [];
    if (format) segments.push(`format: ${format}`);
    if (pages) segments.push(`${pages} stron`);
    if (price !== '') segments.push(`${String(price)} PLN`);
    rows.push(`- Album: ${title}${segments.length ? ` (${segments.join(', ')})` : ''}`);
  }

  if (rows.length > 0) return `Album:\n${rows.join('\n')}`;

  const description = offer?.template_data?.albumDescription || offer?.template_data?.album_description;
  return description ? `Album: ${description}` : '';
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json();
      const { offer_id, client_id, content } = body;
      const depositAmountRaw = body.deposit_amount;
      const depositDueAtRaw = body.deposit_due_at;
      const depositAmount = depositAmountRaw == null || depositAmountRaw === '' ? null : parseInt(String(depositAmountRaw), 10);
      const depositDueAt = depositDueAtRaw ? new Date(depositDueAtRaw) : null;

      const offerIdInt = offer_id ? parseInt(offer_id) : null;

      // Build data
      const data: any = {
        content,
        client_id: client_id ? parseInt(client_id) : null,
      };

      let currentOffer = null;
      if (offerIdInt) {
        // Fetch the offer with client details for better defaults
        currentOffer = await prisma.offer.findUnique({
          where: { id: offerIdInt },
          include: { user: true }
        });

        if (currentOffer) {
          data.client_id = data.client_id || currentOffer.client_id;
          data.offer_id = offerIdInt;
        }
      }

      // If no offer details from offerIdInt, try to find user by client_id if provided
      let targetUser = currentOffer?.user || null;
      if (!targetUser && data.client_id) {
        targetUser = await prisma.user.findUnique({ where: { id: data.client_id } });
      }
      const sessionPlan = extractSessionPlanFromUser(targetUser);

      // Generate final contract number
      const contract_number = await generateContractNumber(content?.includes('B2B') ? 'B2B' : 'B2C');

      // --- PLACEHOLDER REPLACEMENT LOGIC (FULL) ---
      // Pull bank info from settings (single row) for transfer details
      let settings: any = null;
      try { settings = await (prisma as any).setting.findFirst({ where: { bank_account_number: { not: null } } }); } catch { /* ignore */ }

      // Build context: prefer values explicitly sent by ContractBuilder body, fallback to offer/template_data
      const td: any = (currentOffer as any)?.template_data || {};
      const sel: any = (currentOffer as any)?.client_selection || {};
      const fmtDate = (v: any) => {
        if (!v) return '';
        const d = new Date(v);
        if (isNaN(d.getTime())) return String(v);
        return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
      };
      const fields: Record<string, string> = body.fields || {};
      const offerNumber = fields.offerNumber || (currentOffer as any)?.offerNumber || '';
      const eventDateRaw = fields.eventDate || sessionPlan.date || (currentOffer as any)?.session_date || td.eventDate;
      const eventDate = fields.eventDate || fmtDate(eventDateRaw);
      const eventTime = fields.eventTime
        || sessionPlan.time
        || (currentOffer as any)?.session_time
        || td.eventTime
        || td.sessionTime
        || '';
      const eventLocation = fields.eventLocation
        || sessionPlan.location
        || (currentOffer as any)?.session_location
        || td.eventLocation
        || td.location
        || '';
      const eventCount = fields.eventCount
        || (sel.childCount ? String(sel.childCount) : '')
        || (td.eventCount ? String(td.eventCount) : '')
        || '';
      const eventTeam = fields.eventTeam || td.eventTeam || '';
      const totalPrice = fields.totalPrice
        || (sel.totalPrice ? String(sel.totalPrice) : '')
        || (currentOffer as any)?.total_price?.toString()
        || '0';
      const depositAmountStr = (depositAmount != null && !isNaN(depositAmount as number))
        ? String(depositAmount)
        : (fields.depositAmount || '0');
      const depositDueDate = depositDueAt
        ? new Date(depositDueAt).toLocaleDateString('pl-PL')
        : (fields.depositDueDate ? fmtDate(fields.depositDueDate) : '');
      const packageDetails = fields.packageDetails || '';
      const albumDetails = fields.albumDetails || buildAlbumDetails(currentOffer);
      const workshopPlan = fields.workshopPlan || '';

      const replacementContext: Record<string, string> = {
        contractNumber: contract_number,
        offerNumber,
        currentDate: new Date().toLocaleDateString('pl-PL'),
        clientName: targetUser?.name || currentOffer?.client_email || 'Kliencie',
        clientEmail: targetUser?.email || currentOffer?.client_email || '',
        clientPhone: (targetUser as any)?.phone || fields.clientPhone || '',
        clientAddress: fields.clientAddress || '',
        offerTitle: currentOffer?.title || 'Umowa Samodzielna',
        eventDate: eventDate || '',
        eventTime: eventTime || '',
        eventLocation: eventLocation || '',
        eventCount: eventCount || '',
        eventTeam: eventTeam || '',
        totalPrice: totalPrice,
        depositAmount: depositAmountStr,
        depositDueDate: depositDueDate,
        deliveryDays: fields.deliveryDays || '21',
        packageDetails: packageDetails,
        albumDetails,
        workshopPlan: workshopPlan,
        bankAccount: settings?.bank_account_number || '',
        bankHolder: settings?.bank_account_holder || 'FOTO-DRON Przemysław Właśniewski',
        bankName: settings?.bank_name || '',
      };

      const replacePlaceholders = (text: string, ctx: Record<string, string>) => {
        if (!text) return text;
        return text.replace(/\{\{(\w+)\}\}/g, (_m, k) => {
          const v = ctx[k];
          if (v === undefined || v === null || v === '') return '';
          return String(v);
        });
      };

      const finalContent = replacePlaceholders(content, replacementContext);

      const dateCandidate = fields.eventDateIso || sessionPlan.date || null;
      const resolvedSessionDate = dateCandidate ? new Date(dateCandidate) : null;
      const sessionDateForContract = resolvedSessionDate && !isNaN(resolvedSessionDate.getTime())
        ? resolvedSessionDate
        : ((currentOffer as any)?.session_date || null);
      const sessionTimeForContract = fields.eventTime || sessionPlan.time || (currentOffer as any)?.session_time || null;
      const sessionLocationForContract = fields.eventLocation || sessionPlan.location || (currentOffer as any)?.session_location || null;
      // -------------------------------------

      let contract;
      if (offerIdInt) {
        const existingContract = await prisma.contract.findUnique({
          where: { offer_id: offerIdInt },
          select: { id: true, status: true, updated_at: true },
        });
        if (existingContract && isImmutableContractStatus(existingContract.status)) {
          return NextResponse.json({ error: 'Wysłana lub podpisana umowa jest niezmienna. Utwórz aneks zamiast zmieniać treść.' }, { status: 409 });
        }
        const contractData = {
            content: finalContent,
            client_id: data.client_id,
            ...(sessionDateForContract ? { session_date: sessionDateForContract } : {}),
            ...(sessionTimeForContract ? { session_time: sessionTimeForContract } : {}),
            ...(sessionLocationForContract ? { session_location: sessionLocationForContract } : {}),
            ...(depositAmount != null && !isNaN(depositAmount) ? { deposit_amount: depositAmount } : {}),
            ...(depositDueAt ? { deposit_due_at: depositDueAt } : {}),
        };
        if (existingContract) {
          const claimed = await prisma.contract.updateMany({
            where: {
              id: existingContract.id,
              status: existingContract.status,
              updated_at: existingContract.updated_at,
            },
            data: contractData,
          });
          if (claimed.count !== 1) {
            return NextResponse.json({ error: 'Umowa została równolegle zmieniona lub wysłana. Odśwież dane.' }, { status: 409 });
          }
          contract = await prisma.contract.findUniqueOrThrow({ where: { id: existingContract.id } });
        } else {
          try {
            contract = await prisma.contract.create({
              data: {
            offer_id: offerIdInt,
            client_id: data.client_id,
            contract_number,
            content: finalContent,
            status: 'draft',
            ...(sessionDateForContract ? { session_date: sessionDateForContract } : {}),
            ...(sessionTimeForContract ? { session_time: sessionTimeForContract } : {}),
            ...(sessionLocationForContract ? { session_location: sessionLocationForContract } : {}),
            ...(depositAmount != null && !isNaN(depositAmount) ? { deposit_amount: depositAmount } : {}),
                ...(depositDueAt ? { deposit_due_at: depositDueAt } : {}),
              },
            });
          } catch (error: any) {
            if (error?.code === 'P2002') {
              return NextResponse.json({ error: 'Umowa została równolegle utworzona. Odśwież dane.' }, { status: 409 });
            }
            throw error;
          }
        }
      } else {
        // Standalone contract
        contract = await (prisma.contract as any).create({
          data: {
            client_id: data.client_id,
            contract_number,
            content: finalContent,
            status: 'draft',
            ...(sessionDateForContract ? { session_date: sessionDateForContract } : {}),
            ...(sessionTimeForContract ? { session_time: sessionTimeForContract } : {}),
            ...(sessionLocationForContract ? { session_location: sessionLocationForContract } : {}),
            ...(depositAmount != null && !isNaN(depositAmount) ? { deposit_amount: depositAmount } : {}),
            ...(depositDueAt ? { deposit_due_at: depositDueAt } : {}),
          }
        });
      }

      return NextResponse.json({
        success: true,
        contract,
        message: 'Umowa została zapisana jako robocza. Klient nie otrzymał wiadomości.',
      });
    } catch (error) {
      console.error('Create contract error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
