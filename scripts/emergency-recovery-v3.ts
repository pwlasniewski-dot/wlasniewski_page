// @ts-nocheck

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- EMERGENCY RECOVERY SCRIPT ---');

    // --- PART 1: GIFT CARD PAGE (Revert to Fallback) ---
    console.log('1. Reverting "karta-podarunkowa" to fallback mode...');

    // To restore the fallback, we must set sections to NULL.
    // However, the fallback view needs the hero image managed via settings or fallback logic.
    // Let's ensure we fetch the image URL from recent media to put it where it counts if needed,
    // although page.tsx primarily looks at `settings.heroImage`.
    // We will ALSO set `page.hero_image` just in case, as a backup.

    // Fetch last media for the image (assuming user uploaded one recently for this)
    const media = await prisma.mediaLibrary.findMany({
        take: 5,
        orderBy: { id: 'desc' }
    });

    // Use the first image found or a safe placeholder if none
    const recoverImage = media[0]?.file_url || '';
    console.log(`Using image for Gift Card Setting: ${recoverImage}`);

    // Update Page: Clear sections to trigger fallback
    await prisma.page.update({
        where: { slug: 'karta-podarunkowa' },
        data: {
            sections: null, // THIS REACTIVATES THE BEAUTIFUL FALLBACK
            is_published: true
        }
    });

    // Update Settings: Ensure the shop has the correct hero image configured
    // The admin setting key for this is `gift_card_hero_image`
    // We need to update the `Setting` table.

    // First, find the main settings record (usually id=1)
    const settings = await prisma.setting.findFirst();
    if (settings) {
        await prisma.setting.update({
            where: { id: settings.id },
            data: {
                gift_card_hero_image: recoverImage,
                gift_card_hero_opacity: 0.6 // Default good look
            }
        });
        console.log('Updated Global Settings for Gift Card Hero Key.');
    } else {
        console.log('⚠️ No settings record found to update hero image.');
    }

    console.log('✅ Gift Card Page Reverted.');


    // --- PART 2: ABOUT ME PAGE (Restore Legacy + Add Parallax) ---
    console.log('2. Restoring "o-mnie" content...');

    const backupDir = path.join('backups', '2025-12-26T16-56-33-319Z');
    const pagePath = path.join(backupDir, 'Page.json');

    if (!fs.existsSync(pagePath)) {
        console.error('CRITICAL: Backup file not found for o-mnie cleanup!');
        // Fallback: If backup missing, we must at least restore the text we know
    } else {
        const pages = JSON.parse(fs.readFileSync(pagePath, 'utf8'));
        const aboutPageBackup = pages.find(p => p.slug === 'o-mnie');

        if (aboutPageBackup) {
            let restoredSection = null;
            try {
                const sections = JSON.parse(aboutPageBackup.sections);
                restoredSection = sections.find(s => s.type === 'image_text');
            } catch (e) { /* ignore */ }

            // If not in sections, maybe it was just in legacy content?
            // If so, we must construct the image_text section manually from content
            if (!restoredSection && aboutPageBackup.content) {
                restoredSection = {
                    id: 'restored_legacy_text',
                    type: 'rich_text', // or image_text if we have the photo
                    data: {
                        content: aboutPageBackup.content
                    }
                };
            }

            if (restoredSection) {
                // Get the Parallax Image (2nd most recent, or same as first if only 1 uploaded)
                const parallaxImage = media[0]?.file_url || '';

                const newSections = [
                    {
                        id: 'parallax_added_' + Date.now(),
                        type: 'parallax',
                        data: {
                            image: parallaxImage,
                            title: 'Nowy parallax',
                            subtitle: ''
                        }
                    },
                    restoredSection
                ];

                await prisma.page.update({
                    where: { slug: 'o-mnie' },
                    data: {
                        sections: JSON.stringify(newSections),
                        content: aboutPageBackup.content, // Restore legacy field too for safety
                        is_published: true
                    }
                });
                console.log('✅ About Me Page Restored (Parallax + Content).');
            } else {
                console.error('Could not find content to restore for o-mnie in backup.');
            }
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
