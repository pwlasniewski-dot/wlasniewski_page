/**
 * Backfill: parsuje template_data.eventDate -> Offer.session_date dla ofert,
 * ktore nie maja jeszcze ustawionej kolumny session_date.
 *
 * Uruchom: npx tsx internal_scripts/backfill_offer_session_date.ts
 */
import prisma from '../src/lib/db/prisma';
import { parsePolishDate, parsePolishTime } from '../src/lib/calendar/polishDate';

async function main() {
    const offers = await prisma.offer.findMany({
        where: { session_date: null, is_template: false },
        select: { id: true, template_data: true, session_time: true, session_location: true, title: true },
    });
    console.log(`Znaleziono ${offers.length} ofert bez session_date.`);
    let updated = 0;
    let skipped = 0;
    for (const o of offers) {
        const td = (o.template_data || {}) as Record<string, unknown>;
        const eventDateStr = (td.eventDate as string) || (td.event_date as string) || null;
        const parsed = parsePolishDate(eventDateStr);
        if (!parsed) { skipped++; continue; }
        const eventTimeStr = (td.eventTime as string) || (td.event_time as string) || (td.eventHour as string) || null;
        const time = o.session_time || parsePolishTime(eventTimeStr) || parsePolishTime(eventDateStr) || null;
        const location = o.session_location || (td.eventLocation as string) || (td.location as string) || null;
        await prisma.offer.update({
            where: { id: o.id },
            data: {
                session_date: parsed,
                session_time: time,
                session_location: location,
            },
        });
        updated++;
        console.log(`  ✓ #${o.id} "${o.title}" → ${parsed.toISOString().slice(0, 10)} ${time || ''}`);
    }
    console.log(`\nGotowe. Zaktualizowano: ${updated}, pominieto: ${skipped}.`);
    await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
