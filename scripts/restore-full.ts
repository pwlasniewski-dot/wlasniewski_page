
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const MODELS = [
    'AdminUser',
    'Setting',
    'MenuItem',
    'MediaLibrary',
    'PortfolioSession',
    'BlogPost',
    'Testimonial',
    'PromoCode',
    'Inquiry',
    'EmailSubscriber',
    'AnalyticsEvent',
    'HeroSlide',
    'Page',
    'Booking',
    'ServiceType',
    'Package',
    'GiftCardOrder',
    'GiftCard',
    'User',
    'SessionInvite',
    'ChallengePackage',
    'ChallengeLocation',
    'ChallengeUser',
    'PhotoChallenge',
    'ChallengeTimelineEvent',
    'ChallengeSetting',
    'ChallengeGallery',
    'ChallengePhoto',
    'ClientGallery',
    'GalleryPhoto',
    'PhotoOrder',
    'SystemSettings',
    'PageEffect',
    'SystemLog',
    'ErrorNote',
    'BusinessGoal',
    'ScrumTask',
    'MarketingAction',
    'DroneOrder',
    'AnalyticsSnapshot',
    'MarketingTemplate'
];

async function restore() {
    const backupDirName = process.argv[2];
    if (!backupDirName) {
        console.error('❌ Please provide the backup directory name (timestamp) as an argument.');
        console.log('Usage: npx tsx scripts/restore-full.ts 2025-12-26T16-56-32-123Z');

        // List available backups
        const backupsPath = path.join(process.cwd(), 'backups');
        if (fs.existsSync(backupsPath)) {
            console.log('\nAvailable backups:');
            const backups = fs.readdirSync(backupsPath).filter(f => fs.statSync(path.join(backupsPath, f)).isDirectory());
            backups.forEach(b => console.log(` - ${b}`));
        }
        process.exit(1);
    }

    const backupDir = path.join(process.cwd(), 'backups', backupDirName);

    if (!fs.existsSync(backupDir)) {
        console.error(`❌ Backup directory not found: ${backupDir}`);
        process.exit(1);
    }

    console.log(`\n⚠️  WARNING: This will OVERWRITE the current database with data from ${backupDirName}`);
    console.log(`⚠️  Are you sure? This action is destructive for current data.`);
    console.log(`⚠️  To proceed, run with --force flag: npx tsx scripts/restore-full.ts ${backupDirName} --force\n`);

    if (!process.argv.includes('--force')) {
        process.exit(0);
    }

    console.log(`🚀 Starting restore from: ${backupDir}`);

    // Restore in reverse order of dependencies if possible, or usually just disable constraints.
    // However, Prisma doesn't easily allow disabling constraints globally across different DB types.
    // For PostgreSQL (Neon), we can try to truncate tables with CASCADE.

    try {
        // 1. Clean database
        console.log('🧹 Cleaning current database...');
        // We use $executeRawUnsafe carefully here to truncate tables.
        // Order matters due to foreign keys, or we use CASCADE.

        // Construct TRUNCATE command for all tables
        const tableNames = [
            'admin_users', 'settings', 'menu_items', 'media_library', 'portfolio_sessions',
            'blog_posts', 'testimonials', 'promo_codes', 'inquiries', 'email_subscribers',
            'analytics_events', 'hero_slides', 'pages', 'bookings', 'service_types',
            'packages', 'gift_card_orders', 'gift_cards', 'users', 'session_invites',
            'challenge_packages', 'challenge_locations', 'challenge_users', 'photo_challenges',
            'challenge_timeline_events', 'challenge_settings', 'challenge_galleries',
            'challenge_photos', 'client_galleries', 'gallery_photos', 'photo_orders',
            'system_settings', 'page_effects', 'system_logs', 'error_notes',
            'business_goals', 'scrum_tasks', 'marketing_actions', 'drone_orders',
            'analytics_snapshots', 'marketing_templates'
        ];

        // Ensure we are connected
        await prisma.$connect();

        for (const tableName of tableNames) {
            try {
                // Use CASCADE to handle foreign keys
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
            } catch (e) {
                // Table might not exist or other error, log warning but continue
                // console.warn(`Warning truncating ${tableName}: ${e.message}`);
            }
        }
        console.log('✅ Database cleaned.');

        // 2. Restore data
        console.log('📥 Importing data...');

        // We need to restore independent tables first, then dependent ones.
        // This simple iteration might fail if we don't handle order.
        // A better approach for "one-move" restore without complex logic is to:
        // A) Disable triggers/constraints (Postgres specific) OR
        // B) Order this list manually by dependency.

        // Let's try to order MODELS list roughly by dependency for insertion:
        // Independent: AdminUser, Setting, SystemSettings, etc.
        // Dependent: MenuItem (depends on Page), Package (ServiceType), etc.

        const ORDERED_MODELS_RESTORE = [
            'AdminUser', 'Setting', 'SystemSettings', 'ServiceType', 'Page',
            'MediaLibrary', 'User', 'ChallengeLocation', 'ChallengePackage',
            'ChallengeUser', 'ChallengeSetting', 'PromoCode', 'EmailSubscriber',
            'BusinessGoal', 'MarketingAction', 'DroneOrder', 'AnalyticsSnapshot',
            'MarketingTemplate', 'SystemLog', 'ErrorNote',
            // Dependent Level 1
            'MenuItem', 'BlogPost', 'Testimonial', 'PortfolioSession',
            'HeroSlide', 'Package', 'GiftCard', 'SessionInvite', 'ChallengeGallery',
            'ClientGallery', 'PageEffect',
            // Dependent Level 2
            'Booking', 'GiftCardOrder', 'PhotoChallenge', 'GalleryPhoto',
            'PhotoOrder', 'ChallengePhoto', 'ChallengeTimelineEvent', 'Inquiry',
            'AnalyticsEvent'
        ];

        for (const modelName of ORDERED_MODELS_RESTORE) {
            const filePath = path.join(backupDir, `${modelName}.json`);
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(fileContent);

                if (Array.isArray(data) && data.length > 0) {
                    // @ts-ignore
                    await prisma[modelName].createMany({
                        data: data,
                        skipDuplicates: true
                    });
                    console.log(`✅ Restored ${modelName}: ${data.length} records`);
                }
            }
        }

        console.log('🎉 Restore completed successfully.');

    } catch (error) {
        console.error('❌ Restore failed:', error);
    }
}

restore()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
