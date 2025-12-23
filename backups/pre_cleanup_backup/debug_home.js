
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHomepage() {
    console.log('--- Checking Page "strona-glowna" ---');

    // 1. Check Page
    const page = await prisma.page.findUnique({
        where: { slug: 'strona-glowna' }
    });

    if (!page) {
        console.log('❌ Page "strona-glowna" NOT FOUND!');
        return;
    }

    console.log('✅ Page found:', page.id, page.title);
    console.log('--- home_sections content ---');
    if (!page.home_sections) {
        console.log('❌ home_sections is NULL or EMPTY');
    } else {
        console.log('Preview (first 500 chars):');
        console.log(page.home_sections.substring(0, 500));

        try {
            const parsed = JSON.parse(page.home_sections);
            console.log('\n✅ JSON Parsed Successfully');
            console.log('Keys:', Object.keys(parsed));

            if (parsed.hero_slider) {
                console.log(`\nHero Slider: Found ${parsed.hero_slider.length} slides.`);
                console.log(JSON.stringify(parsed.hero_slider[0], null, 2));
            } else {
                console.log('\n❌ hero_slider key MISSING in JSON');
            }

            if (parsed.sections) {
                console.log(`\nSections: Found ${parsed.sections.length} ordered sections.`);
                console.log('Types:', parsed.sections.map(s => s.type));
            } else {
                console.log('\n⚠️ "sections" key not found (Using fallback logic?)');
            }

        } catch (e) {
            console.error('❌ JSON Parse Error:', e.message);
        }
    }

    // 2. Check Settings (backup/legacy)
    const settings = await prisma.setting.findFirst();
    console.log('\n--- Settings Check ---');
    console.log('home_sections in Settings:', settings?.home_sections ? 'PRESENT' : 'NULL');
}

checkHomepage()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
