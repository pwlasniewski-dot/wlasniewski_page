
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const home = await prisma.page.findUnique({
        where: { slug: 'strona-glowna' }
    });
    console.log('Home Page:', home ? 'Found' : 'Not Found');
    if (home && home.home_sections) {
        console.log('Home Sections (Raw):', home.home_sections.substring(0, 200) + '...');
        try {
            const parsed = JSON.parse(home.home_sections);
            console.log('Hero Slider Slides:', parsed.hero_slider ? parsed.hero_slider.length : 0);
        } catch (e) {
            console.log('Error parsing home_sections');
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
