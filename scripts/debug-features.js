
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking strona-glowna features...');

    const page = await prisma.page.findUnique({
        where: { slug: 'strona-glowna' }
    });

    if (!page) {
        console.log('Page strona-glowna not found!');
        return;
    }

    // Check 'sections' column (new system)
    if (page.sections) {
        try {
            const sections = JSON.parse(page.sections);
            const featuresSection = sections.find(s => s.type === 'features');

            if (featuresSection) {
                console.log('Found features section in "sections" column:', JSON.stringify(featuresSection, null, 2));
            } else {
                console.log('No features section found in "sections" column.');
            }
        } catch (e) {
            console.log('Error parsing sections json:', e);
        }
    } else {
        console.log('sections column is empty/null');
    }

    // Check 'home_sections' column (legacy/hybrid system often used by homepage editor)
    // The HomepageManager in strona-glowna/page.tsx saves to BOTH home_sections and sections.
    if (page.home_sections) {
        try {
            const homeSections = JSON.parse(page.home_sections);
            console.log('Checking "home_sections" column...');

            // home_sections usually has { hero_slider: [], sections: [] }
            if (homeSections.sections) {
                const features = homeSections.sections.find(s => s.type === 'features');
                if (features) {
                    console.log('Found features section in "home_sections.sections":', JSON.stringify(features, null, 2));
                } else {
                    console.log('No features section found in "home_sections.sections".');
                }
            }
        } catch (e) {
            console.log('Error parsing home_sections json:', e);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
