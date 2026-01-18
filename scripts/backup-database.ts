/**
 * Database Backup Script
 * Exports all production data to JSON files
 * Run: npx tsx scripts/backup-database.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupDatabase() {
    const backupDir = path.join(process.cwd(), 'backups', '2026-01-16_DATABASE_BACKUP');

    // Create backup directory
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('🔄 Starting database backup...');
    console.log(`📁 Backup location: ${backupDir}`);

    try {
        // Backup Pages (B2C + B2B)
        console.log('\n📄 Backing up Pages...');
        const pages = await prisma.page.findMany({
            include: {
                menu_items: true,
                children: true,
            }
        });
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
        const menuItems = await prisma.menuItem.findMany({
            include: {
                page: true,
            }
        });
        fs.writeFileSync(
            path.join(backupDir, 'menu_items.json'),
            JSON.stringify(menuItems, null, 2)
        );
        console.log(`✅ Saved ${menuItems.length} menu items`);

        // Backup Packages (Session types)
        console.log('\n📦 Backing up Packages...');
        const packages = await prisma.package.findMany();
        fs.writeFileSync(
            path.join(backupDir, 'packages.json'),
            JSON.stringify(packages, null, 2)
        );
        console.log(`✅ Saved ${packages.length} packages`);

        // Backup Blog Posts
        console.log('\n📝 Backing up Blog Posts...');
        const blogPosts = await prisma.blogPost.findMany({
            include: {
                category: true,
            }
        });
        fs.writeFileSync(
            path.join(backupDir, 'blog_posts.json'),
            JSON.stringify(blogPosts, null, 2)
        );
        console.log(`✅ Saved ${blogPosts.length} blog posts`);

        // Backup Blog Categories
        console.log('\n🏷️ Backing up Blog Categories...');
        const blogCategories = await prisma.blogCategory.findMany();
        fs.writeFileSync(
            path.join(backupDir, 'blog_categories.json'),
            JSON.stringify(blogCategories, null, 2)
        );
        console.log(`✅ Saved ${blogCategories.length} categories`);

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
        const galleryPhotos = await prisma.galleryPhoto.findMany({
            include: {
                session: true,
            }
        });
        fs.writeFileSync(
            path.join(backupDir, 'gallery_photos.json'),
            JSON.stringify(galleryPhotos, null, 2)
        );
        console.log(`✅ Saved ${galleryPhotos.length} gallery photos`);

        // Backup Sessions
        console.log('\n🎬 Backing up Sessions...');
        const sessions = await prisma.session.findMany();
        fs.writeFileSync(
            path.join(backupDir, 'sessions.json'),
            JSON.stringify(sessions, null, 2)
        );
        console.log(`✅ Saved ${sessions.length} sessions`);

        // Backup Users (Admin accounts)
        console.log('\n👤 Backing up Users...');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                created_at: true,
                updated_at: true,
                // Exclude password hash for security
            }
        });
        fs.writeFileSync(
            path.join(backupDir, 'users.json'),
            JSON.stringify(users, null, 2)
        );
        console.log(`✅ Saved ${users.length} users`);

        // Create summary file
        const summary = {
            backup_date: new Date().toISOString(),
            database_url: process.env.DATABASE_URL?.includes('neon') ? 'Neon Production' : 'Unknown',
            tables: {
                pages: pages.length,
                settings: settings.length,
                menu_items: menuItems.length,
                packages: packages.length,
                blog_posts: blogPosts.length,
                blog_categories: blogCategories.length,
                media_library: media.length,
                gallery_photos: galleryPhotos.length,
                sessions: sessions.length,
                users: users.length,
            },
            total_records: pages.length + settings.length + menuItems.length + packages.length +
                blogPosts.length + blogCategories.length + media.length +
                galleryPhotos.length + sessions.length + users.length,
        };

        fs.writeFileSync(
            path.join(backupDir, '_BACKUP_SUMMARY.json'),
            JSON.stringify(summary, null, 2)
        );

        console.log('\n' + '='.repeat(60));
        console.log('✅ DATABASE BACKUP COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log(`📊 Total records backed up: ${summary.total_records}`);
        console.log(`📁 Location: ${backupDir}`);
        console.log('\n💾 Files created:');
        console.log('   - pages.json');
        console.log('   - settings.json');
        console.log('   - menu_items.json');
        console.log('   - packages.json');
        console.log('   - blog_posts.json');
        console.log('   - blog_categories.json');
        console.log('   - media_library.json');
        console.log('   - gallery_photos.json');
        console.log('   - sessions.json');
        console.log('   - users.json');
        console.log('   - _BACKUP_SUMMARY.json');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Backup failed:', error);
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
