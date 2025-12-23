
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log('--- Checking Settings Table ---');
        const settingsCount = await prisma.setting.count();
        console.log(`Total Setting records: ${settingsCount}`);
        const allSettings = await prisma.setting.findMany({ orderBy: { id: 'asc' } });
        allSettings.forEach(s => {
            console.log(`ID: ${s.id}, PayU POS: ${s.payu_merchant_pos_id}, Env: ${s.payu_environment}, Logo: ${s.logo_url}`);
        });

        console.log('\n--- Checking Pages Table ---');
        const pages = await prisma.page.findMany({
            where: { slug: 'strona-glowna' }
        });
        console.log(`Pages with slug 'strona-glowna': ${pages.length}`);
        pages.forEach(p => {
            console.log(`ID: ${p.id}, Title: ${p.title}, Sections: ${p.home_sections ? 'Present' : 'Null'}`);
        });

        console.log('\n--- Checking Hero Slides ---');
        const slides = await prisma.heroSlide.findMany({
            include: { image: true }
        });
        console.log(`Total Hero Slides: ${slides.length}`);
        slides.forEach(s => {
            console.log(`ID: ${s.id}, Title: ${s.title}, ImageID: ${s.image_id}, ImagePath: ${s.image?.file_path}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
diagnose();
