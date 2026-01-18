/**
 * Simplified Database Backup Script
 * Uses production DATABASE_URL from .env
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function backupDatabase() {
    const backupDir = path.join(process.cwd(), 'backups', '2026-01-16_DATABASE_BACKUP');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('🔄 Starting database backup...');
    console.log(`📁 Backup location: ${backupDir}`);
    console.log(`🔗 Database: ${process.env.DATABASE_URL?.substring(0, 50)}...`);

    try {
        // Backup Pages
        console.log('\n📄 Backing up Pages...');
        const pages = await prisma.page.findMany();
        fs.writeFileSync(
            path.join(backupDir, 'pages.json'),
            JSON.stringify(pages, null, 2)
        );
        console.log(`✅ Saved ${pages.length} pages`);

        // Backup Settings
        console.log('\n⚙️ Backing up Settings...');
        const settings = await prisma.setting.findMany();
        fs.writeFileSync(
            path.join(backupDir, 'settings.json'),
            JSON.stringify(settings, null, 2)
        );
        console.log(`✅ Saved ${settings.length} settings`);

        // Backup Menu Items
        console.log('\n🔗 Backing up Menu Items...');
        const menuItems = await prisma.menuItem.findMany();
        fs.writeFileSync(
            path.join(backupDir, 'menu_items.json'),
            JSON.stringify(menuItems, null, 2)
        );
        console.log(`✅ Saved ${menuItems.length} menu items`);

        // Backup Packages
        console.log('\n📦 Backing up Packages...');
        const packages = await prisma.package.findMany();
        fs.writeFileSync(
            path.join(backupDir, 'packages.json'),
            JSON.stringify(packages, null, 2)
        );
        console.log(`✅ Saved ${packages.length} packages`);

        // Backup Blog Posts
        console.log('\n📝 Backing up Blog Posts...');
        const blogPosts = await prisma.blogPost.findMany();
        fs.writeFileSync(
            path.join(backupDir, 'blog_posts.json'),
            JSON.stringify(blogPosts, null, 2)
        );
        console.log(`✅ Saved ${blogPosts.length} blog posts`);

        // Backup Media Library
        console.log('\n🖼️ Backing up Media Library...');
        const media = await prisma.media.findMany();
        fs.writeFileSync(
            path.join(backupDir, 'media_library.json'),
            JSON.stringify(media, null, 2)
        );
        console.log(`✅ Saved ${media.length} media items`);

        // Backup Gallery Photos
        console.log('\n📸 Backing up Gallery Photos...');
        const galleryPhotos = await prisma.galleryPhoto.findMany();
        fs.writeFileSync(
            path.join(backupDir, 'gallery_photos.json'),
            JSON.stringify(galleryPhotos, null, 2)
        );
        console.log(`✅ Saved ${galleryPhotos.length} gallery photos`);

        const summary = {
            backup_date: new Date().toISOString(),
            source: 'Production Database',
            tables: {
                pages: pages.length,
                settings: settings.length,
                menu_items: menuItems.length,
                packages: packages.length,
                blog_posts: blogPosts.length,
                media_library: media.length,
                gallery_photos: galleryPhotos.length,
            }
        };

        fs.writeFileSync(
            path.join(backupDir, '_BACKUP_SUMMARY.json'),
            JSON.stringify(summary, null, 2)
        );

        console.log('\n' + '='.repeat(60));
        console.log('✅ DATABASE BACKUP COMPLETED!');
        console.log('='.repeat(60));
        console.log(`📊 Total records: ${Object.values(summary.tables).reduce((a, b) => a + b, 0)}`);
        console.log(`📁 Location: ${backupDir}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

backupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
