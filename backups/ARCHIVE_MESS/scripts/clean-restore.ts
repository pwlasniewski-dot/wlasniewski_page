
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAndSeed() {
    try {
        console.log('--- Cleaning Settings ---');
        // Find latest setting
        const settings = await prisma.setting.findMany({ orderBy: { id: 'desc' } });
        if (settings.length > 1) {
            const keep = settings[0];
            console.log(`Keeping latest setting ID: ${keep.id}`);
            const deleteIds = settings.slice(1).map(s => s.id);
            await prisma.setting.deleteMany({
                where: { id: { in: deleteIds } }
            });
            console.log(`Deleted ${deleteIds.length} duplicate setting records.`);

            // Fix Key-Value pairs that might be orphaned?
            // Actually, keep KV pairs, they are unique by key.
        } else {
            console.log('Settings already clean (0 or 1 record).');
        }

        console.log('\n--- Seeding Hero Slides ---');
        const count = await prisma.heroSlide.count();
        if (count === 0) {
            // Find a media image to use
            const media = await prisma.mediaLibrary.findFirst();
            if (media) {
                await prisma.heroSlide.create({
                    data: {
                        image_id: media.id,
                        title: 'Witaj w Świecie Fotografii',
                        subtitle: 'Utrwalam najpiękniejsze chwile',
                        display_order: 0,
                        is_active: true
                    }
                });
                console.log('Created default Hero Slide.');
            } else {
                console.log('No media found to create Hero Slide.');
            }
        } else {
            console.log('Hero Slides exist.');
        }

        console.log('\n--- Resetting Homepage Sections ---');
        const hp = await prisma.page.findFirst({ where: { slug: 'strona-glowna' } });
        if (hp && !hp.home_sections) {
            const defaultSections = JSON.stringify([
                { id: 'hero', type: 'hero', enabled: true, order: 0 },
                { id: 'portfolio', type: 'portfolio', enabled: true, order: 1 },
                { id: 'about', type: 'about', enabled: true, order: 2 },
                { id: 'contact', type: 'contact', enabled: true, order: 3 }
            ]);
            await prisma.page.update({
                where: { id: hp.id },
                data: { home_sections: defaultSections }
            });
            console.log('Seeded homepage sections.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
cleanAndSeed();
