import prisma from '@/lib/db/prisma';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';
import { logSystem } from '@/lib/logger';

type ParsedLine = {
  photo_id?: number;
  print_size_label?: string;
  print_size?: string;
  quantity?: number;
  unit_amount?: number;
  line_total?: number;
};

function formatPln(amountGrosze: number | null | undefined): string {
  const value = typeof amountGrosze === 'number' ? amountGrosze : 0;
  return `${(value / 100).toFixed(2)} zł`;
}

function buildLinesRows(lines: ParsedLine[], frameMap: Map<number, number>): string {
  if (!lines.length) return '';
  return lines
    .map((line) => {
      const label = line.print_size_label || line.print_size || 'Odbitka';
      const qty = line.quantity || 1;
      const total = formatPln(line.line_total ?? (line.unit_amount ?? 0) * qty);
      const pid = Number(line.photo_id);
      const frame = frameMap.get(pid);
      const kadr = frame ? `Kadr ${frame}` : '—';
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${kadr}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${total}</td>
      </tr>`;
    })
    .join('');
}

/**
 * Wysyła podstawowe maile o zamówieniu dodatkowych odbitek (galeria grupowa):
 * - potwierdzenie dla rodzica,
 * - powiadomienie dla administratora/fotografa.
 * Bezpieczne dla webhooków — nie rzuca wyjątkiem (loguje błędy).
 */
export async function sendGroupExtraOrderEmails(orderId: number): Promise<void> {
  try {
    const order = await prisma.photoOrder.findUnique({
      where: { id: orderId },
      include: {
        gallery: {
          select: {
            client_name: true,
            client_email: true,
            group_access_code: true,
          },
        },
      },
    });

    if (!order) return;

    const participant = order.participant_id
      ? await prisma.galleryParticipant.findUnique({
          where: { id: order.participant_id },
          select: { parent_name: true, parent_email: true, parent_identifier: true },
        })
      : null;

    let lines: ParsedLine[] = [];
    try {
      const meta = order.product_ids ? JSON.parse(order.product_ids) : {};
      lines = Array.isArray(meta?.lines) ? meta.lines : [];
    } catch {
      lines = [];
    }

    // Numer kadru = pozycja zdjęcia w galerii wg order_index (1-based), tak jak widzi je rodzic.
    const orderedPhotos = await prisma.galleryPhoto.findMany({
      where: { gallery_id: order.gallery_id },
      orderBy: { order_index: 'asc' },
      select: { id: true },
    });
    const frameMap = new Map<number, number>();
    orderedPhotos.forEach((p, idx) => frameMap.set(p.id, idx + 1));

    const parentName = participant?.parent_name || participant?.parent_identifier || 'Rodzicu';
    const galleryName = order.gallery?.client_name || 'Galeria';
    const accessCode = order.gallery?.group_access_code || '';
    const total = formatPln(order.total_amount);
    const rows = buildLinesRows(lines, frameMap);

    const summaryTable = `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        <thead>
          <tr>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #333;">Kadr</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #333;">Pozycja</th>
            <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #333;">Ilość</th>
            <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #333;">Kwota</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr>
            <td style="padding:10px 12px;font-weight:bold;" colspan="2">Razem (${order.photo_count} szt.)</td>
            <td></td>
            <td style="padding:10px 12px;text-align:right;font-weight:bold;">${total}</td>
          </tr>
        </tbody>
      </table>`;

    // --- Mail do rodzica ---
    if (participant?.parent_email) {
      const parentHtml = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;">
          <h2 style="color:#111;">Dziękujemy za zamówienie!</h2>
          <p>Cześć ${parentName},</p>
          <p>Twoje zamówienie dodatkowych odbitek zostało opłacone i przekazane do realizacji.</p>
          <p style="margin:4px 0;"><strong>Numer zamówienia:</strong> #${order.id}</p>
          <p style="margin:4px 0;"><strong>Galeria:</strong> ${galleryName}</p>
          ${summaryTable}
          <p style="color:#666;font-size:13px;">W razie pytań odpowiedz na tę wiadomość.</p>
        </div>`;
      try {
        await sendEmail({
          to: participant.parent_email,
          subject: `Potwierdzenie zamówienia #${order.id} — dodatkowe odbitki`,
          html: parentHtml,
        });
      } catch (e: any) {
        await logSystem('ERROR', 'EMAIL', 'Group order parent email failed', { orderId, error: e?.message });
      }
    }

    // --- Mail do admina/fotografa ---
    try {
      const adminEmail = await getAdminEmail();
      if (adminEmail) {
        const adminHtml = `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;">
            <h2 style="color:#111;">Nowe zamówienie odbitek (galeria grupowa)</h2>
            <p style="margin:4px 0;"><strong>Numer zamówienia:</strong> #${order.id}</p>
            <p style="margin:4px 0;"><strong>Galeria:</strong> ${galleryName} (kod: ${accessCode})</p>
            <p style="margin:4px 0;"><strong>Rodzic:</strong> ${parentName}${participant?.parent_email ? ` (${participant.parent_email})` : ''}</p>
            <p style="margin:4px 0;"><strong>Status:</strong> Opłacone</p>
            ${summaryTable}
          </div>`;
        await sendEmail({
          to: adminEmail,
          subject: `Nowe zamówienie odbitek #${order.id} — ${galleryName}`,
          html: adminHtml,
        });
      }
    } catch (e: any) {
      await logSystem('ERROR', 'EMAIL', 'Group order admin email failed', { orderId, error: e?.message });
    }
  } catch (error: any) {
    console.error('[email] sendGroupExtraOrderEmails error:', error);
    await logSystem('ERROR', 'EMAIL', 'Group order emails failed', { orderId, error: error?.message });
  }
}
