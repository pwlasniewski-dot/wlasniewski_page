
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const backupDir = path.join('backups', '2025-12-26T16-56-33-319Z'); // Found via dir command
    const pagePath = path.join(backupDir, 'Page.json');

    console.log(`Reading backup from: ${pagePath}`);

    if (!fs.existsSync(pagePath)) {
        console.error('Backup file not found!');
        process.exit(1);
    }

    const pages = JSON.parse(fs.readFileSync(pagePath, 'utf8'));
    const aboutPageBackup = pages.find(p => p.slug === 'o-mnie');

    if (!aboutPageBackup) {
        console.error('Page "o-mnie" not found in backup');
        process.exit(1);
    }

    console.log('--- FOUND BACKUP CONTENT ---');
    let restoredSection = null;

    try {
        const sections = JSON.parse(aboutPageBackup.sections);
        console.log('Backup Sections:', JSON.stringify(sections, null, 2));

        // Find the image_text section the user is missing
        restoredSection = sections.find(s => s.type === 'image_text');
    } catch (e) {
        console.log('Sections column was empty or invalid in backup:', aboutPageBackup.sections);
    }

    if (!restoredSection) {
        console.log('No "image_text" section found in backup sections.');
        // Maybe it was just "content"?
        console.log('Backup Content Column:', aboutPageBackup.content);
        process.exit(0);
    }

    console.log('--- RESTORING CONTENT ---');

    // Construct the combined sections: Parallax (which user wanted) + Restored ImageText
    const newSections = [
        {
            id: 'parallax_restored',
            type: 'parallax',
            data: {
                image: 'https://wlasniewski.pl/uploads/ballerina.jpg', // Placeholder or try to find exact
                // Actually, let's keep the one I added if it was correct media, or use what was in backup?
                // The backup didn't have parallax (that's why user complained).
                // So we keep my new parallax, but append the restored section.
                title: 'Nowy parallax',
                subtitle: ''
            }
        },
        restoredSection
    ];

    // Wait, let's fetch the CURRENT page to get the media URL I just stuck in there for parallax
    // so I don't lose that either.
    const currentPage = await prisma.page.findUnique({ where: { slug: 'o-mnie' } });
    let currentParallax = null;
    if (currentPage && currentPage.sections) {
        const currentSections = JSON.parse(currentPage.sections);
        currentParallax = currentSections.find(s => s.type === 'parallax');
    }

    if (currentParallax) {
        newSections[0] = currentParallax;
    }

    console.log('Saving New Sections:', JSON.stringify(newSections, null, 2));

    await prisma.page.update({
        where: { slug: 'o-mnie' },
        data: {
            sections: JSON.stringify(newSections),
            is_published: true
        }
    });

    console.log('✅ RECOVERY COMPLETE');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
