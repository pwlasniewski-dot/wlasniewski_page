import { readFile, writeFile } from 'node:fs/promises';

type Fix = {
    model: 'page' | 'blogPost';
    slug: string;
    expectedRenderedDescription: string;
    description: string;
};

// Offline plan by default. --check reads CMS; --apply requires a fresh backup file.
// Test on an isolated database branch before applying to the live CMS.
async function main() {
    const fixes: Fix[] = JSON.parse(await readFile(new URL('./seo-descriptions-2026-09-05.json', import.meta.url), 'utf8'));
    const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
    for (const fix of fixes) {
        if (!['page', 'blogPost'].includes(fix.model) || !fix.slug || !fix.description || fix.description.length > 160) {
            throw new Error('Invalid description plan');
        }
    }
    const apply = process.argv.includes('--apply');
    const check = process.argv.includes('--check');
    if (!apply && !check) {
        console.log(JSON.stringify(fixes, null, 2));
        return;
    }
    const backupPath = process.argv.find(arg => arg.startsWith('--backup='))?.slice('--backup='.length);
    if (apply && !backupPath) throw new Error('--apply requires --backup=/absolute/path/to/new-file.json');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
        const changes = [];
        for (const fix of fixes) {
            const row = fix.model === 'page'
                ? await prisma.page.findUnique({ where: { slug: fix.slug }, select: { id: true, meta_description: true } })
                : await prisma.blogPost.findUnique({ where: { slug: fix.slug }, select: { id: true, meta_description: true, excerpt: true, status: true } });
            if (!row || ('status' in row && row.status !== 'published')) throw new Error(`Published content missing: ${fix.slug}`);
            if (row.meta_description === fix.description) continue;
            const rendered = row.meta_description || ('excerpt' in row ? row.excerpt : '') || '';
            if (normalize(rendered) !== normalize(fix.expectedRenderedDescription)) {
                throw new Error(`CMS content changed since the audit: ${fix.slug}. Review before replacing.`);
            }
            changes.push({ ...fix, id: row.id, previousMetaDescription: row.meta_description, previousExcerpt: 'excerpt' in row ? row.excerpt : null });
        }
        console.log(JSON.stringify({ mode: apply ? 'apply' : 'check', changes }, null, 2));
        if (!apply || changes.length === 0) return;
        await writeFile(backupPath!, JSON.stringify(changes, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
        await prisma.$transaction(async tx => {
            for (const change of changes) {
                const where = { id: change.id, slug: change.slug, meta_description: change.previousMetaDescription };
                const data = { meta_description: change.description };
                const result = change.model === 'page'
                    ? await tx.page.updateMany({ where, data })
                    : await tx.blogPost.updateMany({ where: { ...where, status: 'published', excerpt: change.previousExcerpt }, data });
                if (result.count !== 1) throw new Error(`Concurrent edit: ${change.slug}; rolling back all changes.`);
            }
        });
        console.log(`Updated ${changes.length} CMS descriptions. Revalidate the affected pages and verify their public HTML.`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : 'Description update failed');
    process.exitCode = 1;
});
