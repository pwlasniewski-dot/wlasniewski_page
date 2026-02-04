/**
 * Direct PostgreSQL backup using pg library
 * This bypasses Prisma Client entirely
 */

import pg from 'pg';
const { Client } = pg;
import * as fs from 'fs';
import * as path from 'path';

const PRODUCTION_DB = process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_vjh6d9PJuKFT@ep-dry-art-a-emsvsfc.us-east-2.aws.neon.tech/neondb?sslmode=require";

const client = new Client({ connectionString: PRODUCTION_DB });

const tables = [
    'admin_users', 'settings', 'pages', 'blog_posts', 'portfol io_sessions',
    'media_library', 'menu_items', 'hero_slides', 'testimonials',
    'service_types', 'packages', 'bookings', 'promo_codes',
    'gift_cards', 'gift_card_orders', 'inquiries', 'users',
    'history_photos', 'email_subscribers', 'analytics_events',
    'photographer_profiles', 'baskets', 'basket_items',
    'challenge_packages', 'challenge_locations', 'challenge_users',
    'photo_challenges', 'challenge_timeline_events', 'challenge_settings',
    'challenge_galleries', 'challenge_photos', 'client_galleries',
    'gallery_photos', 'photo_orders', 'system_settings', 'page_effects',
    'system_logs', 'error_notes', 'business_goals', 'scrum_tasks',
    'marketing_actions', 'drone_orders', 'analytics_snapshots',
    'marketing_templates', 'newsletter_campaigns', 'payouts',
    'provider_availability', 'subscribers', 'clients', 'client_offers',
    'client_contracts', 'offers', 'offer_sections', 'offer_items',
    'contracts', 'negotiations'
];

async function backup() {
    await client.connect();
    console.log('🔗 Connected to production database');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, '..', 'backups', 'data', `backup-${timestamp}.json`);
    const latestFile = path.join(__dirname, '..', 'backups', 'data', 'latest-holy-backup.json');

    const backup: any = {};
    let totalRecords = 0;

    console.log('\n📊 Backing up tables:\n');

    for (const table of tables) {
        try {
            const result = await client.query(`SELECT * FROM ${table}`);
            backup[table] = result.rows;
            console.log(`  ✓ ${table}: ${result.rows.length} records`);
            totalRecords += result.rows.length;
        } catch (e: any) {
            console.log(`  ✗ ${table}: ${e.message}`);
            backup[table] = [];
        }
    }

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    fs.writeFileSync(latestFile, JSON.stringify(backup, null, 2));

    console.log(`\n✅ Backup completed!`);
    console.log(`📊 Total records: ${totalRecords}`);
    console.log(`💾 Size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);
    console.log(`📁 File: ${backupFile}`);

    await client.end();
}

backup().catch(console.error);
