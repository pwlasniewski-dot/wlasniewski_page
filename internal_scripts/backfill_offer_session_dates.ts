/**
 * Backfill: Offer.template_data.eventDate (string) -> Offer.session_date (DateTime).
 *
 * Uruchom: npx tsx internal_scripts/backfill_offer_session_dates.ts
 *
 * Bezpieczny do wielokrotnego uruchamiania (DRY-RUN domyślnie).
 * Aby faktycznie zapisać: APPLY=1 npx tsx ...
 */
import prisma from '../src/lib/db/prisma';
import { parsePolishDate, parsePolishTime } from '../src/lib/calendar/polishDate';

async function main() {
    const APPLY = process.env.APPLY === '1';
    console.log(`[backfill] Mode: ${APPLY ? 'APPLY' : 'DRY-RUN (set APPLY=1 to write)'}`);

    const offers = await prisma.offer.findMany({
        where: { session_date: null },
        select: { id: true, title: true, template_data: true, valid_until: true, session_date: true },
    });
    console.log(`[backfill] Found ${offers.length} offers without session_date`);

    let parsed = 0;
    let skipped = 0;
    let updated = 0;

    for (const o of offers) {
        const td = (o.template_data || {}) as Record<string, unknown>;
        const eventDateStr = (td.eventDate as string) || (td.event_date as string) || null;
        const eventTimeStr = (td.eventTime as string) || (td.event_time as string) || (td.eventHour as string) || null;
        const venueStr = (td.eventLocation as string) || (td.location as string) || null;

        const date = parsePolishDate(eventDateStr);
        if (!date) {
            skipped++;
            console.log(`  [skip ${o.id}] "${o.title}" — eventDate="${eventDateStr || '(brak)'}"`);
            continue;
        }
        parsed++;
        const time = parsePolishTime(eventTimeStr) || parsePolishTime(eventDateStr);
        console.log(`  [ok   ${o.id}] "${o.title}" -> ${date.toISOString().slice(0, 10)} ${time || ''} ${venueStr || ''}`);

        if (APPLY) {
            await prisma.offer.update({
                where: { id: o.id },
                data: {
                    session_date: date,
                    session_time: time,
                    session_location: venueStr,
                },
            });
            updated++;
        }
    }

    console.log('\n[backfill] Summary:');
    console.log(`  parsed:  ${parsed}`);
    console.log(`  skipped: ${skipped}`);
    console.log(`  updated: ${updated}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
