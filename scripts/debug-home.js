
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugHome() {
    try {
        console.log('Fetching strona-glowna...');
        const page = await prisma.page.findUnique({
            where: { slug: 'strona-glowna' }
        });

        if (!page) {
            console.error('Page NOT FOUND!');
            return;
        }

        console.log('Page ID:', page.id);
        console.log('Title:', page.title);

        console.log('--- SECTIONS COLUMN (New System) ---');
        console.log('Raw type:', typeof page.sections);
        console.log('Raw content:', page.sections ? page.sections.substring(0, 500) + '...' : 'NULL');

        if (page.sections) {
            try {
                const parsed = JSON.parse(page.sections);
                console.log('Parsed successfully');
                console.log('Is Array?', Array.isArray(parsed));
                console.log('Length:', parsed.length);
                if (Array.isArray(parsed)) {
                    parsed.forEach((s, i) => {
                        console.log(`[${i}] Type: ${s.type}, Label: ${s.label}, Enabled: ${s.enabled}`);
                        if (s.type === 'features') {
                            console.log('   Feature Data:', JSON.stringify(s.data, null, 2));
                        }
                    });
                }
            } catch (e) {
                console.error('JSON Parse Error for sections:', e.message);
            }
        }

        console.log('\n--- HOME_SECTIONS COLUMN (Legacy/Backup) ---');
        console.log('Raw type:', typeof page.home_sections);
        if (page.home_sections) {
            try {
                const parsed = JSON.parse(page.home_sections);
                console.log('Parsed successfully');
                if (parsed.sections) {
                    console.log('Has nested "sections" array? Yes, length:', parsed.sections.length);
                    // Check logic for buttonText inside nested sections if appropriate
                } else {
                    console.log('No nested "sections" array found in home_sections');
                }

                if (parsed.features) {
                    console.log('Has legacy "features" object? Yes');
                    console.log(JSON.stringify(parsed.features, null, 2));
                }
            } catch (e) {
                console.error('JSON Parse Error for home_sections:', e.message);
            }
        }

    } catch (e) {
        console.error('Script Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

debugHome();
