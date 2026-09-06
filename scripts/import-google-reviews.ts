/** Verified public Google reviews. Run with --apply only on the intended database. */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const snapshot = JSON.parse(readFileSync(new URL('./data/google-reviews-2026-09-06.json', import.meta.url), 'utf8'));

async function main() {
    const apply = process.argv.includes('--apply');
    const actions: Array<{ author: string; action: string; id?: number }> = [];
    await prisma.$transaction(async tx => {
        await tx.$executeRawUnsafe('LOCK TABLE testimonials IN SHARE ROW EXCLUSIVE MODE');
        if (apply) await tx.$executeRawUnsafe("DO $$ DECLARE seq text; current_value bigint; max_id bigint; BEGIN seq := pg_get_serial_sequence('testimonials','id'); EXECUTE format('SELECT last_value FROM %s', seq) INTO current_value; SELECT coalesce(max(id),0) INTO max_id FROM testimonials; PERFORM setval(seq::regclass, greatest(current_value,max_id,1), true); END $$");
        // Serialize imports; the existing model predates external review IDs.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('google-reviews-import'))`;
        for (const review of snapshot.reviews) {
            const names = review.client_name === 'Malgorzata Sosnowska'
                ? ['Malgorzata Sosnowska', 'Małgorzata Sosnowska', 'Małorzata Sosnowska']
                : [review.client_name];
            const matches = await tx.testimonial.findMany({
                where: { source: { equals: 'Google', mode: 'insensitive' }, client_name: { in: names } },
            });
            if (matches.length > 1) throw new Error(`Ambiguous author: ${review.client_name}`);
            const data = {
                client_name: review.client_name,
                testimonial_text: review.testimonial_text,
                rating: review.rating,
                source: 'Google',
                display_order: review.display_order,
                is_featured: true,
                show_on_booking_page: true,
            };
            const existing = matches[0];
            const unchanged = existing && Object.entries(data).every(([key, value]) => (existing as any)[key] === value);
            actions.push({ author: review.client_name, action: unchanged ? 'unchanged' : existing ? 'update' : 'insert', id: existing?.id });
            if (!apply || unchanged) continue;
            if (existing) await tx.testimonial.update({ where: { id: existing.id }, data });
            else await tx.testimonial.create({ data });
        }
    }, { timeout: 30_000 });
    console.log(JSON.stringify({ mode: apply ? 'applied' : 'preview', actions }, null, 2));
}

main().finally(() => prisma.$disconnect()).catch(error => { console.error(error.message); process.exitCode = 1; });
