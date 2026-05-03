// Wymienia awatary istniejacych uczestnikow Wieldzadz na nowy zestaw nastoletni.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEEN_AVATARS = [
    '📸', '🎞️', '🎬', '🎥', '🖤', '🤍', '⚡', '🔥',
    '🌙', '☀️', '⭐', '✨', '🌈', '🎧', '🎸', '🎹',
    '🛹', '🏀', '⚽', '🎮', '🕹️', '🎯', '🚀', '🛰️',
    '🌊', '🏔️', '🌋', '🌵', '🍕', '🍔', '🧋', '☕',
];

async function main() {
    const w = await prisma.workshop.findUnique({ where: { slug: 'wieldzadz' } });
    if (!w) { console.log('Brak warsztatu wieldzadz'); return; }
    const ps = await prisma.workshopParticipant.findMany({ where: { workshop_id: w.id }, orderBy: { id: 'asc' } });
    let n = 0;
    for (let i = 0; i < ps.length; i++) {
        const avatar = TEEN_AVATARS[i % TEEN_AVATARS.length];
        await prisma.workshopParticipant.update({ where: { id: ps[i].id }, data: { avatar } });
        n++;
    }
    console.log('OK — zaktualizowano avatarow:', n);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
