#!/usr/bin/env node
/**
 * prisma/fix_duplicate_homepage.js
 *
 * Safe merge script for duplicate 'Strona Główna' pages.
 * Usage:
 *  - Dry run (no DB changes):
 *      node prisma/fix_duplicate_homepage.js --dry-run
 *  - Apply changes (destructive):
 *      node prisma/fix_duplicate_homepage.js --apply
 *
 * The script will:
 *  1) Find candidate pages (slug = 'strona-glowna' OR title = 'Strona Główna')
 *  2) Pick canonical page (prefer slug='strona-glowna')
 *  3) Backup involved page data to prisma/backup_homepage_TIMESTAMP.json
 *  4) Merge `home_sections` (hero_slider + sections) with basic dedupe
 *  5) Copy menu-related fields if missing on canonical
 *  6) Delete duplicate records (only when --apply provided)
 *
 * IMPORTANT: ensure `DATABASE_URL` is set in the environment or .env.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function safeParseHomeSections(raw) {
    if (!raw) return { hero_slider: [], sections: [] };
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
            hero_slider: parsed.hero_slider || [],
            sections: parsed.sections || []
        };
    } catch (e) {
        return { hero_slider: [], sections: [] };
    }
}

function mergeHomeSections(aRaw, bRaw) {
    const a = safeParseHomeSections(aRaw);
    const b = safeParseHomeSections(bRaw);

    // Merge hero slides by id or by title fallback
    const heroMap = new Map();
    [...a.hero_slider, ...b.hero_slider].forEach(s => {
        const key = s.id || `${s.title}-${s.image}`;
        if (!heroMap.has(key)) heroMap.set(key, s);
    });

    // Merge sections by id (if id exists) or by type+label
    const sectionMap = new Map();
    [...a.sections, ...b.sections].forEach(s => {
        const key = s.id || `${s.type}-${s.label}`;
        if (!sectionMap.has(key)) sectionMap.set(key, s);
    });

    return {
        hero_slider: Array.from(heroMap.values()),
        sections: Array.from(sectionMap.values())
    };
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run') || !args.includes('--apply');
    const apply = args.includes('--apply');

    console.log(`Starting homepage merge script (dryRun=${dryRun}, apply=${apply})`);

    const candidates = await prisma.page.findMany({
        where: {
            OR: [
                { slug: 'strona-glowna' },
                { title: { equals: 'Strona Główna' } },
                { slug: '' }
            ]
        }
    });

    if (!candidates || candidates.length === 0) {
        console.log('No candidate pages found with slug/title matching homepage. Aborting.');
        process.exit(0);
    }

    console.log(`Found ${candidates.length} candidate page(s):`);
    candidates.forEach(p => console.log(` - id=${p.id} slug='${p.slug}' title='${p.title}'`));

    // Choose canonical: prefer slug === 'strona-glowna'
    let canonical = candidates.find(p => p.slug === 'strona-glowna') || candidates[0];
    const duplicates = candidates.filter(p => p.id !== canonical.id);

    console.log(`Canonical page chosen: id=${canonical.id} slug='${canonical.slug}' title='${canonical.title}'`);

    // Backup
    const backupPath = path.join(process.cwd(), 'prisma', `backup_homepage_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(candidates, null, 2));
    console.log(`Backup written to: ${backupPath}`);

    if (duplicates.length === 0) {
        console.log('No duplicates to merge. Exiting.');
        process.exit(0);
    }

    // Prepare merged home_sections
    const merged = duplicates.reduce((acc, dup) => mergeHomeSections(acc, dup.home_sections), canonical.home_sections || canonical.home_sections || '');

    // If canonical.home_sections empty and merged has content, mark as changed
    const mergedJson = JSON.stringify(merged);

    console.log('\nProposed changes:');
    console.log(` - canonical id=${canonical.id} will have merged home_sections with ${merged.hero_slider.length} hero slides and ${merged.sections.length} sections`);
    console.log(` - duplicates to remove: ${duplicates.map(d => d.id).join(', ')}`);

    if (dryRun) {
        console.log('\nDry-run mode: no DB changes applied. Use --apply to perform merge.');
        await prisma.$disconnect();
        process.exit(0);
    }

    // Decide menu fields to copy if canonical is not in menu
    const menuFromDuplicate = duplicates.find(d => d.is_in_menu);
    const menuUpdate = {};
    if (!canonical.is_in_menu && menuFromDuplicate) {
        menuUpdate.is_in_menu = true;
        if (menuFromDuplicate.menu_title) menuUpdate.menu_title = menuFromDuplicate.menu_title;
        if (typeof menuFromDuplicate.menu_order !== 'undefined') menuUpdate.menu_order = menuFromDuplicate.menu_order;
    }

    // Apply changes
    try {
        // Update canonical
        await prisma.page.update({
            where: { id: canonical.id },
            data: {
                slug: 'strona-glowna',
                home_sections: mergedJson,
                is_published: true,
                ...menuUpdate
            }
        });

        // Delete duplicates
        for (const d of duplicates) {
            await prisma.page.delete({ where: { id: d.id } });
            console.log(`Deleted duplicate page id=${d.id}`);
        }

        console.log('Merge applied successfully.');
    } catch (err) {
        console.error('Error applying merge:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
