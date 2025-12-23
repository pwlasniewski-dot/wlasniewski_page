import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function restorePages() {
    try {
        console.log('📖 Starting page data restoration...');
        
        // Czytanie backup'u
        const backupPath = path.join(process.cwd(), 'debug_pages.json');
        const backupData = fs.readFileSync(backupPath, 'utf-8');
        const parsed = JSON.parse(backupData);
        
        if (!parsed.pages || !Array.isArray(parsed.pages)) {
            console.error('❌ Invalid backup format');
            return;
        }

        let restored = 0;
        for (const pageData of parsed.pages) {
            try {
                await prisma.page.upsert({
                    where: { slug: pageData.slug },
                    update: {
                        title: pageData.title,
                        content: pageData.content || '',
                        meta_title: pageData.meta_title,
                        meta_description: pageData.meta_description,
                        meta_keywords: pageData.meta_keywords,
                        is_published: pageData.is_published !== false,
                        sections: pageData.sections,
                        page_type: pageData.page_type || 'regular'
                    },
                    create: {
                        slug: pageData.slug,
                        title: pageData.title,
                        content: pageData.content || '',
                        meta_title: pageData.meta_title,
                        meta_description: pageData.meta_description,
                        meta_keywords: pageData.meta_keywords,
                        is_published: pageData.is_published !== false,
                        sections: pageData.sections,
                        page_type: pageData.page_type || 'regular'
                    }
                });
                restored++;
                console.log(`  ✅ Restored: ${pageData.title}`);
            } catch (err) {
                console.error(`  ❌ Failed to restore ${pageData.slug}:`, (err as any).message);
            }
        }

        console.log(`\n🎉 Restoration complete! ${restored}/${parsed.pages.length} pages restored.`);
    } catch (error) {
        console.error('❌ Restoration error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restorePages();
